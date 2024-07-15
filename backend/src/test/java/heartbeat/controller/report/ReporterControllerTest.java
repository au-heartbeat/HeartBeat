package heartbeat.controller.report;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import heartbeat.controller.report.dto.request.GenerateReportRequest;
import heartbeat.controller.report.dto.request.ReportType;
import heartbeat.controller.report.dto.response.ReportResponse;
import heartbeat.controller.report.dto.response.ShareApiDetailsResponse;
import heartbeat.controller.report.dto.response.UuidResponse;
import heartbeat.exception.GenerateReportException;
import heartbeat.service.report.GenerateReporterService;
import heartbeat.service.report.ReportService;
import heartbeat.tools.TimeUtils;
import lombok.extern.log4j.Log4j2;
import org.hamcrest.Matchers;
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
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
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

	@MockBean
	private GenerateReporterService generateReporterService;

	@MockBean
	private ReportService reporterService;

	@Autowired
	private MockMvc mockMvc;

	private final ObjectMapper mapper = new ObjectMapper();

	public static final String START_TIME = "20240310";

	public static final String END_TIME = "20240409";

	@Test
	void shouldGetSuccessDataGivenReportId() throws Exception {
		String timeStamp = Long.toString(System.currentTimeMillis());
		ReportResponse mockReportResponse = ReportResponse.builder()
			.boardMetricsCompleted(true)
			.allMetricsCompleted(true)
			.build();

		when(generateReporterService.getComposedReportResponse(timeStamp, START_TIME, END_TIME))
			.thenReturn(mockReportResponse);

		String reportResponseString = mockMvc
			.perform(get("/reports/{reportId}/detail", timeStamp).param("startTime", START_TIME)
				.param("endTime", END_TIME)
				.contentType(MediaType.APPLICATION_JSON))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.allMetricsCompleted").value(true))
			.andReturn()
			.getResponse()
			.getContentAsString();
		ReportResponse response = mapper.readValue(reportResponseString, new TypeReference<>() {
		});
		verify(generateReporterService).getComposedReportResponse(any(), any(), any());
		assertEquals(true, response.getBoardMetricsCompleted());
		assertEquals(true, response.getAllMetricsCompleted());
	}

	@Test
	void shouldReturn500StatusWhenRequestGenerateReportGivenReportTimeIsExpired() throws Exception {
		String reportId = Long.toString(System.currentTimeMillis());
		doThrow(new GenerateReportException("Failed to get report due to report time expires"))
			.when(generateReporterService)
			.getComposedReportResponse(any(), any(), any());

		mockMvc.perform(get("/reports/{reportId}/detail", reportId).contentType(MediaType.APPLICATION_JSON))
			.andExpect(status().isInternalServerError())
			.andExpect(jsonPath("$.message").value("Failed to get report due to report time expires"))
			.andReturn()
			.getResponse();
		verify(generateReporterService).getComposedReportResponse(any(), any(), any());
	}

	@Test
	void shouldReturnWhenExportCsv() throws Exception {
		long timeStamp = TimeUtils.mockTimeStamp(2023, 5, 25, 18, 21, 20);
		String expectedResponse = "csv data";

		when(reporterService.exportCsv(ReportType.PIPELINE, String.valueOf(timeStamp), START_TIME, END_TIME))
			.thenReturn(new InputStreamResource(new ByteArrayInputStream(expectedResponse.getBytes())));

		MockHttpServletResponse response = mockMvc
			.perform(get("/reports/{reportType}/{timeStamp}", ReportType.PIPELINE.getValue(), timeStamp)
				.param("startTime", START_TIME)
				.param("endTime", END_TIME))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse();

		assertThat(response.getContentAsString()).isEqualTo(expectedResponse);
	}

	@Test
	void shouldReturnCallBackUrlWithAcceptedStatusAndInvokeWhenGenerateReportByType() throws Exception {
		ObjectMapper mapper = new ObjectMapper();
		GenerateReportRequest request = mapper.readValue(new File(REQUEST_FILE_PATH), GenerateReportRequest.class);

		String currentTimeStamp = String.valueOf(TimeUtils.mockTimeStamp(2023, 5, 25, 18, 21, 20));
		String startTime = "20220829";
		String endTime = "20220909";
		request.setCsvTimeStamp(currentTimeStamp);
		String uuid = "test-uuid";

		doAnswer(invocation -> null).when(reporterService).generateReport(request, uuid);
		when(reporterService.generateReportCallbackUrl(uuid, startTime, endTime))
			.thenReturn("/reports/" + uuid + "/detail" + "?startTime=" + startTime + "&endTime=" + endTime);

		mockMvc
			.perform(post("/reports/{uuid}", uuid).contentType(MediaType.APPLICATION_JSON)
				.content(mapper.writeValueAsString(request)))
			.andExpect(status().isAccepted())
			.andExpect(jsonPath("$.callbackUrl")
				.value("/reports/" + uuid + "/detail?startTime=" + startTime + "&endTime=" + endTime))
			.andExpect(jsonPath("$.interval").value("10"))
			.andReturn()
			.getResponse();

		verify(reporterService, times(1)).generateReport(request, uuid);
	}

	@Test
	void shouldReturnUuidWhenCallGenerateUUID() throws Exception {
		String expectedResponse = "test";
		when(reporterService.generateReportId()).thenReturn(UuidResponse.builder().reportId(expectedResponse).build());
		mockMvc.perform(post("/reports"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.reportId").value(expectedResponse))
			.andReturn()
			.getResponse();
		verify(reporterService).generateReportId();
	}

	@Test
	void shouldReturnListCallbackWhenCallGetReportUrls() throws Exception {
		String uuid = "test-uuid";
		when(reporterService.getShareReportInfo(uuid)).thenReturn(ShareApiDetailsResponse.builder()
			.reportURLs(List.of("/reports/test-uuid/detail?startTime=startTime&endTime=endTime"))
			.metrics(List.of("board"))
			.pipelines(List.of("pipeline1", "pipeline2"))
			.build());

		mockMvc.perform(get("/reports/{uuid}", uuid))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.reportURLs.length()", Matchers.is(1)))
			.andExpect(
					jsonPath("$.reportURLs[0]").value("/reports/test-uuid/detail?startTime=startTime&endTime=endTime"))
			.andExpect(jsonPath("$.metrics.length()", Matchers.is(1)))
			.andExpect(jsonPath("$.metrics[0]").value("board"))
			.andExpect(jsonPath("$.pipelines.length()", Matchers.is(2)))
			.andExpect(jsonPath("$.pipelines[0]").value("pipeline1"))
			.andExpect(jsonPath("$.pipelines[1]").value("pipeline2"))
			.andReturn()
			.getResponse();

		verify(reporterService, times(1)).getShareReportInfo(uuid);
	}

}
