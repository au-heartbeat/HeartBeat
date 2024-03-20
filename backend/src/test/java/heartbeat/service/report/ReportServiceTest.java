package heartbeat.service.report;

import heartbeat.controller.report.dto.request.GenerateReportRequest;
import heartbeat.controller.report.dto.request.ReportType;
import heartbeat.controller.report.dto.response.MetricsDataCompleted;
import heartbeat.exception.NotFoundException;
import heartbeat.handler.AsyncMetricsDataHandler;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.core.io.InputStreamResource;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import static heartbeat.service.report.scheduler.DeleteExpireCSVScheduler.EXPORT_CSV_VALIDITY_TIME;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.STRICT_STUBS)
public class ReportServiceTest {

	@InjectMocks
	ReportService reportService;

	@Mock
	CSVFileGenerator csvFileGenerator;

	@Mock
	AsyncMetricsDataHandler asyncMetricsDataHandler;

	@Mock
	GenerateReporterService generateReporterService;

	@Test
	void exportCsvShouldCallCsvFileGeneratorToGotTheStreamWhenTimestampIsValid() throws IOException {
		long validTimestamp = System.currentTimeMillis() - EXPORT_CSV_VALIDITY_TIME + 20000L;
		when(csvFileGenerator.getDataFromCSV(ReportType.METRIC, validTimestamp))
			.thenReturn(new InputStreamResource(new ByteArrayInputStream("csv data".getBytes())));

		InputStream result = reportService.exportCsv(ReportType.METRIC, validTimestamp).getInputStream();
		String returnData = new BufferedReader(new InputStreamReader(result)).lines().collect(Collectors.joining("\n"));

		assertEquals(returnData, "csv data");
		verify(csvFileGenerator).getDataFromCSV(ReportType.METRIC, validTimestamp);
	}

	@Test
	void exportCsvShouldThrowNotFoundExceptionWhenTimestampIsValid() {
		long invalidTimestamp = System.currentTimeMillis() - EXPORT_CSV_VALIDITY_TIME - 20000L;

		assertThrows(NotFoundException.class, () -> reportService.exportCsv(ReportType.METRIC, invalidTimestamp));
		verify(csvFileGenerator, never()).getDataFromCSV(ReportType.METRIC, invalidTimestamp);
	}

	@Nested
	class GenerateReportByType {

		String timeStamp = "1683734399999";

		GenerateReportRequest request = GenerateReportRequest.builder()
			.csvTimeStamp(timeStamp)
			.metrics(new ArrayList<>())
			.metricTypes(List.of("board"))
			.build();

		@Test
		void shouldCallGenerateBoardReportWhenMetricTypesListOnlyHasBoardElement() throws InterruptedException {
			MetricsDataCompleted expected = MetricsDataCompleted.builder()
				.boardMetricsCompleted(true)
				.allMetricsCompleted(true)
				.build();
			doAnswer(invocation -> null).when(asyncMetricsDataHandler).putMetricsDataCompleted(any(), any());
			doAnswer(invocation -> null).when(generateReporterService).generateBoardReport(request);

			reportService.generateReportByType(request);
			Thread.sleep(100);

			verify(asyncMetricsDataHandler).putMetricsDataCompleted(request.getBoardReportId(), expected);
			verify(generateReporterService).generateBoardReport(request);
			verify(generateReporterService, never()).generateDoraReport(request);
		}

		@Test
		void shouldCallGenerateDoraReportWhenMetricTypesListOnlyHasDoraElement() throws InterruptedException {
			MetricsDataCompleted expected = MetricsDataCompleted.builder().doraMetricsCompleted(false).build();
			doAnswer(invocation -> null).when(asyncMetricsDataHandler).putMetricsDataCompleted(any(), any());
			request.setMetricTypes(List.of("dora"));
			doAnswer(invocation -> null).when(generateReporterService).generateDoraReport(request);

			reportService.generateReportByType(request);
			Thread.sleep(100);

			verify(asyncMetricsDataHandler).putMetricsDataCompleted(request.getDoraReportId(), expected);
			verify(generateReporterService).generateDoraReport(request);
			verify(generateReporterService, never()).generateBoardReport(request);
		}

	}

}
