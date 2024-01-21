package heartbeat.controller.report;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import heartbeat.controller.report.dto.request.GenerateReportRequest;
import heartbeat.controller.report.dto.request.ReportDataType;
import heartbeat.controller.report.dto.request.ReportType;
import heartbeat.controller.report.dto.response.ReportResponse;
import heartbeat.exception.GenerateReportException;
import heartbeat.handler.AsyncExceptionHandler;
import heartbeat.service.report.GenerateReporterService;
import heartbeat.service.report.ReportService;
import lombok.extern.log4j.Log4j2;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReportController.class)
@ExtendWith(SpringExtension.class)
@AutoConfigureJsonTesters
@Log4j2
class ReporterControllerTest {

	private static final String REQUEST_FILE_PATH = "src/test/java/heartbeat/controller/report/request.json";

	private static final String RESPONSE_FILE_PATH = "src/test/java/heartbeat/controller/report/reportResponse.json";

	@MockBean
	private GenerateReporterService generateReporterService;

	@MockBean
	private ReportService reporterService;

	@Autowired
	private MockMvc mockMvc;

	private final ObjectMapper mapper = new ObjectMapper();

	@Test
	void shouldReturnCreatedStatusWhenCheckGenerateReportIsTrue() throws Exception {
		String reportId = Long.toString(System.currentTimeMillis());
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
			.boardMetricsCompleted(false)
			.allMetricsCompleted(false)
			.build();

		when(generateReporterService.checkGenerateReportIsDone(reportId)).thenReturn(false);
		when(generateReporterService.getComposedReportResponse(reportId, false)).thenReturn(reportResponse);

		MockHttpServletResponse response = mockMvc
			.perform(get("/reports/{reportId}", reportId).contentType(MediaType.APPLICATION_JSON))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse();
		final var content = response.getContentAsString();
		final var isAllMetricsReady = JsonPath.parse(content).read("$.allMetricsCompleted");

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
		assertEquals("Failed to generate report", hintInfo);
	}

	@Test
	void shouldReturnWhenExportCsv() throws Exception {
		Long csvTimeStamp = 1685010080107L;
		String expectedResponse = "csv data";

		when(reporterService.exportCsv(ReportDataType.PIPELINE, csvTimeStamp))
			.thenReturn(new InputStreamResource(new ByteArrayInputStream(expectedResponse.getBytes())));

		MockHttpServletResponse response = mockMvc
			.perform(get("/reports/{reportType}/{csvTimeStamp}", ReportDataType.PIPELINE.getValue(), csvTimeStamp))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse();

		assertThat(response.getContentAsString()).isEqualTo(expectedResponse);
		// todo
	}

	@Test
	void shouldReturnCallBackUrlWithAcceptedStatusAndInvokeGenerateReportByType() throws Exception {
		GenerateReportRequest request = GenerateReportRequest.builder().metrics(List.of("velocity")).build();
		String currentTimeStamp = "1685010080107";
		request.setCsvTimeStamp(currentTimeStamp);

		doAnswer(invocation -> null).when(reporterService).generateReportByType(request, ReportType.DORA);

		mockMvc
			.perform(post("/reports/{reportType}", ReportType.DORA.reportType).contentType(MediaType.APPLICATION_JSON)
				.content(mapper.writeValueAsString(request)))
			.andExpect(status().isAccepted())
			.andExpect(jsonPath("S.callbackUrl").value("/reports/" + currentTimeStamp))
			.andExpect(jsonPath("S.interval").value("10"))
			.andReturn()
			.getResponse();

		verify(reporterService, times(1)).generateReportByType(request, ReportType.DORA);
	}

}
