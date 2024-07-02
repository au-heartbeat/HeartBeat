package heartbeat.handler;

import heartbeat.controller.report.dto.response.ReportResponse;
import heartbeat.exception.GenerateReportException;
import heartbeat.exception.NotFoundException;
import heartbeat.util.IdUtil;
import org.apache.commons.io.FileUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.Assert.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

@ExtendWith(MockitoExtension.class)
class AsyncReportRequestHandlerTest {

	public static final String APP_OUTPUT_REPORT = "./app/output/report";

	public static final String START_TIME = "20240417";

	public static final String END_TIME = "20240418";

	public static final String TEST_UUID = "test-uuid";

	@InjectMocks
	AsyncReportRequestHandler asyncReportRequestHandler;

	@AfterEach
	void afterEach() {
		try {
			FileUtils.cleanDirectory(new File("./app"));
		}
		catch (IOException ignored) {
		}
	}

	@Test
	void shouldDeleteReportWhenReportIsExpire() throws IOException {
		long currentTimeMillis = System.currentTimeMillis();
		String currentTime = Long.toString(currentTimeMillis);
		String expireTime = Long.toString(currentTimeMillis - 1900000L);
		String unExpireFile = getBoardReportFileId(currentTime);
		String expireFile = getBoardReportFileId(expireTime);
		asyncReportRequestHandler.putReport(unExpireFile, ReportResponse.builder().build());
		asyncReportRequestHandler.putReport(expireFile, ReportResponse.builder().build());

		asyncReportRequestHandler.deleteExpireReportFile(currentTimeMillis, new File(APP_OUTPUT_REPORT));

		assertNull(asyncReportRequestHandler.getReport(expireFile));
		assertNotNull(asyncReportRequestHandler.getReport(unExpireFile));
		Files.deleteIfExists(Path.of(APP_OUTPUT_REPORT + "/" + unExpireFile));
		assertNull(asyncReportRequestHandler.getReport(unExpireFile));
	}

	@Test
	void shouldGetAsyncReportWhenPuttingReportIntoAsyncReportRequestHandler() throws IOException {
		long currentTimeMillis = System.currentTimeMillis();
		String currentTime = Long.toString(currentTimeMillis);
		String boardReportId = IdUtil.getBoardReportFileId(TEST_UUID, currentTime);

		asyncReportRequestHandler.putReport(boardReportId, ReportResponse.builder().build());

		assertNotNull(asyncReportRequestHandler.getReport(boardReportId));
		Files.deleteIfExists(Path.of(APP_OUTPUT_REPORT + "/" + boardReportId));
		assertNull(asyncReportRequestHandler.getReport(boardReportId));
	}

	@Test
	void shouldThrowGenerateReportExceptionGivenFileNameInvalidWhenHandlerPutData() {
		assertThrows(GenerateReportException.class,
				() -> asyncReportRequestHandler.putReport("../", ReportResponse.builder().build()));
	}

	@Test
	void shouldThrowNotFoundExceptionWhenDictionaryDontExist() {
		assertThrows(NotFoundException.class, () -> asyncReportRequestHandler.getReportFiles(TEST_UUID));
	}

	@Test
	void shouldThrowNotFoundExceptionWhenFileIsNotDictionary() throws IOException {
		String path = "./app/output/report/test-uuid";
		Files.createDirectories(Path.of(path).getParent());
		new File(path).createNewFile();

		assertThrows(NotFoundException.class, () -> asyncReportRequestHandler.getReportFiles(TEST_UUID));
	}

	@Test
	void shouldGetFilesList() throws IOException {
		String path = "./app/output/report/test-uuid/test.txt";
		Files.createDirectories(Path.of(path).getParent());
		new File(path).createNewFile();

		List<String> reportFiles = asyncReportRequestHandler.getReportFiles(TEST_UUID);
		assertEquals(1, reportFiles.size());
		assertEquals("test.txt", reportFiles.get(0));
	}

	private String getBoardReportFileId(String timestamp) {
		return "board-" + START_TIME + "-" + END_TIME + "-" + timestamp;
	}

}
