package heartbeat.controller.report;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import heartbeat.controller.report.dto.request.ExportCSVRequest;
import heartbeat.controller.report.dto.request.GenerateBoardReportRequest;
import heartbeat.controller.report.dto.request.GenerateDoraReportRequest;
import heartbeat.controller.report.dto.request.RequireDataEnum;
import heartbeat.controller.report.dto.response.AvgDeploymentFrequency;
import heartbeat.controller.report.dto.response.DeploymentFrequency;
import heartbeat.controller.report.dto.response.ReportResponse;
import heartbeat.controller.report.dto.response.Velocity;
import heartbeat.exception.GenerateReportException;
import heartbeat.exception.RequestFailedException;
import heartbeat.service.report.GenerateReporterService;
import heartbeat.handler.AsyncExceptionHandler;
import heartbeat.util.IdUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.AutoConfigureJsonTesters;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(GenerateReportController.class)
@ExtendWith(SpringExtension.class)
@AutoConfigureJsonTesters
class GenerateReporterControllerTest {

	private static final String REQUEST_FILE_PATH = "src/test/java/heartbeat/controller/report/request.json";

	private static final String RESPONSE_FILE_PATH = "src/test/java/heartbeat/controller/report/reportResponse.json";

	private final List<String> buildKiteMetrics = Stream
		.of(RequireDataEnum.CHANGE_FAILURE_RATE, RequireDataEnum.DEPLOYMENT_FREQUENCY,
				RequireDataEnum.MEAN_TIME_TO_RECOVERY)
		.map(RequireDataEnum::getValue)
		.toList();

	private final List<String> codebaseMetrics = Stream.of(RequireDataEnum.LEAD_TIME_FOR_CHANGES)
		.map(RequireDataEnum::getValue)
		.toList();

	@MockBean
	private GenerateReporterService generateReporterService;

	@MockBean
	private AsyncExceptionHandler asyncExceptionHandler;

	@Autowired
	private MockMvc mockMvc;

	@Test
	void shouldReturnCreatedStatusWhenCheckGenerateReportIsTrue() throws Exception {
		String reportId = Long.toString(System.currentTimeMillis());
		ObjectMapper mapper = new ObjectMapper();
		ReportResponse expectedReportResponse = mapper.readValue(new File(RESPONSE_FILE_PATH), ReportResponse.class);

		when(generateReporterService.checkGenerateReportIsDone(reportId)).thenReturn(true);
		when(generateReporterService.getComposedReportResponse(reportId, true)).thenReturn(expectedReportResponse);

		MockHttpServletResponse response = mockMvc
			.perform(get("/reports/{reportId}", reportId).contentType(MediaType.APPLICATION_JSON))
			.andExpect(status().isCreated())
			.andReturn()
			.getResponse();
		final var content = response.getContentAsString();
		ReportResponse actualReportResponse = mapper.readValue(content, ReportResponse.class);

		assertEquals(expectedReportResponse, actualReportResponse);
	}

	@Test
	void shouldReturnOkStatusWhenCheckGenerateReportIsFalse() throws Exception {
		String reportId = Long.toString(System.currentTimeMillis());
		ReportResponse reportResponse = ReportResponse.builder()
			.isBoardMetricsReady(false)
			.isAllMetricsReady(false)
			.build();

		when(generateReporterService.checkGenerateReportIsDone(reportId)).thenReturn(false);
		when(generateReporterService.getComposedReportResponse(reportId, false)).thenReturn(reportResponse);

		MockHttpServletResponse response = mockMvc
			.perform(get("/reports/{reportId}", reportId).contentType(MediaType.APPLICATION_JSON))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse();
		final var content = response.getContentAsString();
		final var isAllMetricsReady = JsonPath.parse(content).read("$.isAllMetricsReady");

		assertEquals(false, isAllMetricsReady);
	}

	@Test
	void shouldReturnInternalServerErrorStatusWhenCheckGenerateReportThrowException() throws Exception {
		String reportId = Long.toString(System.currentTimeMillis());

		when(generateReporterService.checkGenerateReportIsDone(reportId))
			.thenThrow(new GenerateReportException("Report time expires"));

		var response = mockMvc.perform(get("/reports/{reportId}", reportId).contentType(MediaType.APPLICATION_JSON))
			.andExpect(status().isInternalServerError())
			.andReturn()
			.getResponse();

		final var content = response.getContentAsString();
		final var errorMessage = JsonPath.parse(content).read("$.message").toString();
		final var hintInfo = JsonPath.parse(content).read("$.hintInfo").toString();

		assertEquals("Report time expires", errorMessage);
		assertEquals("Generate report failed", hintInfo);
	}

	@Test
	void shouldReturnWhenExportCsv() throws Exception {
		String dataType = "pipeline";
		String csvTimeStamp = "1685010080107";
		String expectedResponse = "csv data";

		when(generateReporterService
			.fetchCSVData(ExportCSVRequest.builder().dataType(dataType).csvTimeStamp(csvTimeStamp).build()))
			.thenReturn(new InputStreamResource(new ByteArrayInputStream(expectedResponse.getBytes())));

		MockHttpServletResponse response = mockMvc
			.perform(get("/reports/{dataType}/{csvTimeStamp}", dataType, csvTimeStamp))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse();

		assertThat(response.getContentAsString()).isEqualTo(expectedResponse);

	}

	@Test
	void shouldReturnAcceptedStatusAndCallbackUrlAndIntervalWhenCallBoardReports() throws Exception {
		ReportResponse expectedResponse = ReportResponse.builder()
			.velocity(Velocity.builder().velocityForSP(10).build())
			.deploymentFrequency(DeploymentFrequency.builder()
				.avgDeploymentFrequency(new AvgDeploymentFrequency("Average", 0.10F))
				.build())
			.build();

		ObjectMapper mapper = new ObjectMapper();
		GenerateBoardReportRequest request = mapper.readValue(new File(REQUEST_FILE_PATH),
				GenerateBoardReportRequest.class);
		String currentTimeStamp = "1685010080107";
		request.setCsvTimeStamp(currentTimeStamp);

		when(generateReporterService.generateReporter(request.convertToReportRequest())).thenReturn(expectedResponse);
		doNothing().when(generateReporterService).initializeMetricsDataReadyInHandler(any(), any());
		doNothing().when(generateReporterService).saveReporterInHandler(any(), any());
		doNothing().when(generateReporterService).updateMetricsDataReadyInHandler(any(), any());

		MockHttpServletResponse response = mockMvc
			.perform(post("/reports/board").contentType(MediaType.APPLICATION_JSON)
				.content(mapper.writeValueAsString(request)))
			.andExpect(status().isAccepted())
			.andReturn()
			.getResponse();

		final var callbackUrl = JsonPath.parse(response.getContentAsString()).read("$.callbackUrl").toString();
		final var interval = JsonPath.parse(response.getContentAsString()).read("$.interval").toString();
		assertEquals("/reports/" + currentTimeStamp, callbackUrl);
		assertEquals("10", interval);
	}

	@Test
	void shouldGetExceptionAndPutInExceptionMapWhenCallBoardReport() throws Exception {
		ObjectMapper mapper = new ObjectMapper();
		GenerateBoardReportRequest request = mapper.readValue(new File(REQUEST_FILE_PATH),
				GenerateBoardReportRequest.class);
		String currentTimeStamp = "1685010080107";
		request.setCsvTimeStamp(currentTimeStamp);

		RequestFailedException requestFailedException = new RequestFailedException(402, "Client Error");
		when(generateReporterService.generateReporter(request.convertToReportRequest()))
			.thenThrow(requestFailedException);
		doNothing().when(generateReporterService).initializeMetricsDataReadyInHandler(any(), any());
		doNothing().when(generateReporterService).saveReporterInHandler(any(), any());
		doNothing().when(generateReporterService).updateMetricsDataReadyInHandler(any(), any());

		MockHttpServletResponse response = mockMvc
			.perform(post("/reports/board").contentType(MediaType.APPLICATION_JSON)
				.content(mapper.writeValueAsString(request)))
			.andExpect(status().isAccepted())
			.andReturn()
			.getResponse();

		final var callbackUrl = JsonPath.parse(response.getContentAsString()).read("$.callbackUrl").toString();
		final var interval = JsonPath.parse(response.getContentAsString()).read("$.interval").toString();
		assertEquals("/reports/" + currentTimeStamp, callbackUrl);
		assertEquals("10", interval);

		Thread.sleep(2000L);
		verify(generateReporterService).initializeMetricsDataReadyInHandler(request.getCsvTimeStamp(),
				request.getMetrics());
		verify(generateReporterService, times(0)).saveReporterInHandler(any(), any());
		verify(generateReporterService, times(0)).updateMetricsDataReadyInHandler(request.getCsvTimeStamp(),
				request.getMetrics());
		verify(asyncExceptionHandler).put(IdUtil.getBoardReportId(currentTimeStamp), requestFailedException);
	}

	@Test
	void shouldGetExceptionAndPutInExceptionMapWhenCallDoraReport() throws Exception {

		ObjectMapper mapper = new ObjectMapper();
		GenerateDoraReportRequest request = mapper.readValue(new File(REQUEST_FILE_PATH),
				GenerateDoraReportRequest.class);
		List<String> pipeLineMetrics = request.getMetrics()
			.stream()
			.map(String::toLowerCase)
			.filter(this.buildKiteMetrics::contains)
			.collect(Collectors.toList());
		List<String> codeBaseMetrics = request.getMetrics()
			.stream()
			.map(String::toLowerCase)
			.filter(this.codebaseMetrics::contains)
			.collect(Collectors.toList());
		String currentTimeStamp = "1685010080107";
		request.setCsvTimeStamp(currentTimeStamp);

		RequestFailedException requestFailedException = new RequestFailedException(402, "Client Error");
		when(generateReporterService.generateReporter(any())).thenThrow(requestFailedException);
		doNothing().when(generateReporterService).initializeMetricsDataReadyInHandler(any(), any());
		doNothing().when(generateReporterService).saveReporterInHandler(any(), any());
		doNothing().when(generateReporterService).updateMetricsDataReadyInHandler(any(), any());

		MockHttpServletResponse response = mockMvc
			.perform(post("/reports/dora").contentType(MediaType.APPLICATION_JSON)
				.content(mapper.writeValueAsString(request)))
			.andExpect(status().isAccepted())
			.andReturn()
			.getResponse();

		final var callbackUrl = JsonPath.parse(response.getContentAsString()).read("$.callbackUrl").toString();
		final var interval = JsonPath.parse(response.getContentAsString()).read("$.interval").toString();
		assertEquals("/reports/" + currentTimeStamp, callbackUrl);
		assertEquals("10", interval);

		Thread.sleep(2000L);
		verify(generateReporterService).initializeMetricsDataReadyInHandler(request.getCsvTimeStamp(),
				request.getMetrics());
		verify(generateReporterService, times(0)).saveReporterInHandler(any(), any());
		verify(generateReporterService, times(0)).updateMetricsDataReadyInHandler(request.getCsvTimeStamp(),
				request.getMetrics());
		verify(asyncExceptionHandler, times(2)).put(IdUtil.getDoraReportId(currentTimeStamp), requestFailedException);
	}

	@Test
	void shouldReturnAcceptedStatusAndCallbackUrlAndIntervalWhenCallDoraReports() throws Exception {
		ReportResponse expectedResponse = ReportResponse.builder()
			.deploymentFrequency(DeploymentFrequency.builder()
				.avgDeploymentFrequency(new AvgDeploymentFrequency("Average", 0.10F))
				.build())
			.velocity(Velocity.builder().velocityForSP(10).build())
			.deploymentFrequency(DeploymentFrequency.builder()
				.avgDeploymentFrequency(new AvgDeploymentFrequency("Average", 0.10F))
				.build())
			.build();

		ObjectMapper mapper = new ObjectMapper();
		GenerateBoardReportRequest request = mapper.readValue(new File(REQUEST_FILE_PATH),
				GenerateBoardReportRequest.class);
		String currentTimeStamp = "1685010080107";
		request.setCsvTimeStamp(currentTimeStamp);

		when(generateReporterService.generateReporter(request.convertToReportRequest())).thenReturn(expectedResponse);

		MockHttpServletResponse response = mockMvc
			.perform(post("/reports/dora").contentType(MediaType.APPLICATION_JSON)
				.content(mapper.writeValueAsString(request)))
			.andExpect(status().isAccepted())
			.andReturn()
			.getResponse();

		final var callbackUrl = JsonPath.parse(response.getContentAsString()).read("$.callbackUrl").toString();
		final var interval = JsonPath.parse(response.getContentAsString()).read("$.interval").toString();
		assertEquals("/reports/" + currentTimeStamp, callbackUrl);
		assertEquals("10", interval);
	}

}
