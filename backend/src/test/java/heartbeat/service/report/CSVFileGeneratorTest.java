package heartbeat.service.report;

import heartbeat.controller.board.dto.response.JiraCardDTO;
import heartbeat.controller.report.dto.response.BoardCSVConfig;
import heartbeat.controller.report.dto.response.PipelineCSVInfo;
import heartbeat.exception.FileIOException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.core.io.InputStreamResource;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.Assert.assertThrows;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CSVFileGeneratorTest {

	@InjectMocks
	CSVFileGenerator csvFileGenerator;

	String mockTimeStamp = "168369327000";

	private static void deleteDirectory(File directory) {
		if (directory.exists()) {
			File[] files = directory.listFiles();
			if (files != null) {
				for (File file : files) {
					if (file.isDirectory()) {
						deleteDirectory(file);
					}
					else {
						file.delete();
					}
				}
			}
			directory.delete();
		}
	}

	@Test
	void shouldConvertPipelineDataToCsv() throws IOException {

		List<PipelineCSVInfo> pipelineCSVInfos = PipelineCsvFixture.MOCK_PIPELINE_CSV_DATA();
		csvFileGenerator.convertPipelineDataToCSV(pipelineCSVInfos, mockTimeStamp);
		String fileName = CSVFileNameEnum.PIPELINE.getValue() + "-" + mockTimeStamp + ".csv";
		File file = new File(fileName);

		Assertions.assertTrue(file.exists());

		FileInputStream fileInputStream = new FileInputStream(file);
		BufferedReader reader = new BufferedReader(new InputStreamReader(fileInputStream));
		String headers = reader.readLine();
		Assertions.assertEquals(
				"\"Pipeline Name\",\"Pipeline Step\",\"Build Number\",\"Committer\",\"First Code Committed Time In PR\",\"Code Committed Time\",\"PR Created Time\",\"PR Merged Time\",\"Deployment Completed Time\",\"Total Lead Time (HH:mm:ss)\",\"PR Lead Time (HH:mm:ss)\",\"Pipeline Lead Time (HH:mm:ss)\",\"Status\",\"Branch\"",
				headers);
		String firstLine = reader.readLine();
		Assertions.assertEquals(
				"\"Heartbeat\",\":rocket: Deploy prod\",\"880\",\"XXXX\",\"2023-05-08T07:18:18Z\",\"2023-05-10T06:43:02.653Z\",\"168369327000\",\"1683793037000\",\"1684793037000\",\"8379303\",\"16837\",\"653037000\",\"passed\",\"branch\"",
				firstLine);
		reader.close();
		fileInputStream.close();
		file.delete();
	}

	@Test
	public void shouldMakeCsvDirWhenNotExistGivenDataTypeIsPipeline() {
		String csvDirPath = "./csv";
		File csvDir = new File(csvDirPath);
		deleteDirectory(csvDir);
		List<PipelineCSVInfo> pipelineCSVInfos = PipelineCsvFixture.MOCK_PIPELINE_CSV_DATA();

		csvFileGenerator.convertPipelineDataToCSV(pipelineCSVInfos, mockTimeStamp);

		String fileName = CSVFileNameEnum.PIPELINE.getValue() + "-" + mockTimeStamp + ".csv";
		File file = new File(fileName);
		Assertions.assertTrue(file.exists());
		file.delete();
	}

	@Test
	public void shouldHasContentWhenGetDataFromCsvGivenDataTypeIsPipeline() throws IOException {
		List<PipelineCSVInfo> pipelineCSVInfos = PipelineCsvFixture.MOCK_PIPELINE_CSV_DATA();
		csvFileGenerator.convertPipelineDataToCSV(pipelineCSVInfos, mockTimeStamp);

		InputStreamResource inputStreamResource = csvFileGenerator.getDataFromCSV("pipeline",
				Long.parseLong(mockTimeStamp));
		InputStream csvDataInputStream = inputStreamResource.getInputStream();
		String csvPipelineData = new BufferedReader(new InputStreamReader(csvDataInputStream)).lines()
			.collect(Collectors.joining("\n"));

		Assertions.assertEquals(
				"\"Pipeline Name\",\"Pipeline Step\",\"Build Number\",\"Committer\",\"First Code Committed Time In PR\",\"Code Committed Time\",\"PR Created Time\",\"PR Merged Time\",\"Deployment Completed Time\",\"Total Lead Time (HH:mm:ss)\",\"PR Lead Time (HH:mm:ss)\",\"Pipeline Lead Time (HH:mm:ss)\",\"Status\",\"Branch\"\n"
						+ "\"Heartbeat\",\":rocket: Deploy prod\",\"880\",\"XXXX\",\"2023-05-08T07:18:18Z\",\"2023-05-10T06:43:02.653Z\",\"168369327000\",\"1683793037000\",\"1684793037000\",\"8379303\",\"16837\",\"653037000\",\"passed\",\"branch\"",
				csvPipelineData);

		String fileName = CSVFileNameEnum.PIPELINE.getValue() + "-" + mockTimeStamp + ".csv";
		File file = new File(fileName);
		file.delete();
	}

	@Test
	public void shouldReturnEmptyWhenDataTypeNotMatch() throws IOException {

		InputStreamResource result = csvFileGenerator.getDataFromCSV("mockDataType", Long.parseLong(mockTimeStamp));
		InputStream csvDataInputStream = result.getInputStream();
		String csvData = new BufferedReader(new InputStreamReader(csvDataInputStream)).lines()
			.collect(Collectors.joining("\n"));

		Assertions.assertEquals("", csvData);
	}

	@Test
	public void shouldThrowExceptionWhenFileNotExist() {
		List<PipelineCSVInfo> pipelineCSVInfos = PipelineCsvFixture.MOCK_PIPELINE_CSV_DATA();
		assertThrows(FileIOException.class, () -> csvFileGenerator.getDataFromCSV("pipeline", 123456L));
		assertThrows(FileIOException.class,
				() -> csvFileGenerator.convertPipelineDataToCSV(pipelineCSVInfos, "15469:89/033"));
	}

	@Test
	public void shouldMakeCsvDirWhenNotExistGivenDataTypeIsBoard() {
		String csvDirPath = "./csv";
		File csvDir = new File(csvDirPath);
		deleteDirectory(csvDir);
		List<JiraCardDTO> cardDTOList = BoardCsvFixture.MOCK_JIRA_CARD_DTO();
		List<BoardCSVConfig> fields = BoardCsvFixture.MOCK_ALL_FIELDS();
		List<BoardCSVConfig> extraFields = BoardCsvFixture.MOCK_EXTRA_FIELDS();

		csvFileGenerator.convertBoardDataToCSV(cardDTOList, fields, extraFields, mockTimeStamp);

		String fileName = CSVFileNameEnum.BOARD.getValue() + "-" + mockTimeStamp + ".csv";
		File csvFile = new File(fileName);
		Assertions.assertTrue(csvFile.exists());
		csvFile.delete();
	}

	@Test
	public void shouldGenerateBoardCsvWhenConvertBoardDataToCsv() {
		List<JiraCardDTO> cardDTOList = BoardCsvFixture.MOCK_JIRA_CARD_DTO();
		List<BoardCSVConfig> fields = BoardCsvFixture.MOCK_ALL_FIELDS();
		List<BoardCSVConfig> extraFields = BoardCsvFixture.MOCK_EXTRA_FIELDS();

		csvFileGenerator.convertBoardDataToCSV(cardDTOList, fields, extraFields, mockTimeStamp);

		String fileName = CSVFileNameEnum.BOARD.getValue() + "-" + mockTimeStamp + ".csv";
		File csvFile = new File(fileName);
		Assertions.assertTrue(csvFile.exists());
		csvFile.delete();
	}

	@Test
	public void shouldGenerateBoardCsvWhenConvertBoardDataToCsvGivenBaseInfoIsEmpty() {
		List<JiraCardDTO> cardDTOList = BoardCsvFixture.MOCK_JIRA_CARD_DTO_WITH_EMPTY_BASE_INFO();
		List<BoardCSVConfig> fields = BoardCsvFixture.MOCK_ALL_FIELDS();
		List<BoardCSVConfig> extraFields = BoardCsvFixture.MOCK_EXTRA_FIELDS();

		csvFileGenerator.convertBoardDataToCSV(cardDTOList, fields, extraFields, mockTimeStamp);

		String fileName = CSVFileNameEnum.BOARD.getValue() + "-" + mockTimeStamp + ".csv";
		File csvFile = new File(fileName);
		Assertions.assertTrue(csvFile.exists());
		csvFile.delete();
	}

	@Test
	public void shouldGenerateBoardCsvWhenConvertBoardDataToCsvGivenBaseInfoFieldsIsNull() {
		List<JiraCardDTO> cardDTOList = BoardCsvFixture.MOCK_JIRA_CARD_DTO_WITH_EMPTY_BASE_INFO_FIELDS();
		List<BoardCSVConfig> fields = BoardCsvFixture.MOCK_ALL_FIELDS();
		List<BoardCSVConfig> extraFields = BoardCsvFixture.MOCK_EXTRA_FIELDS();

		csvFileGenerator.convertBoardDataToCSV(cardDTOList, fields, extraFields, mockTimeStamp);

		String fileName = CSVFileNameEnum.BOARD.getValue() + "-" + mockTimeStamp + ".csv";
		File csvFile = new File(fileName);
		Assertions.assertTrue(csvFile.exists());
		csvFile.delete();
	}

	@Test
	public void shouldGenerateBoardCsvWhenConvertBoardDataToCsvGivenCycleTimeIsNull() {
		List<JiraCardDTO> cardDTOList = BoardCsvFixture.MOCK_JIRA_CARD_DTO_WITH_EMPTY_CARD_CYCLE_TIME();
		List<BoardCSVConfig> fields = BoardCsvFixture.MOCK_ALL_FIELDS();
		List<BoardCSVConfig> extraFields = BoardCsvFixture.MOCK_EXTRA_FIELDS();

		csvFileGenerator.convertBoardDataToCSV(cardDTOList, fields, extraFields, mockTimeStamp);

		String fileName = CSVFileNameEnum.BOARD.getValue() + "-" + mockTimeStamp + ".csv";
		File csvFile = new File(fileName);
		Assertions.assertTrue(csvFile.exists());
		csvFile.delete();
	}

	@Test
	public void shouldThrowExceptionWhenBoardCsvNotExist() {
		List<JiraCardDTO> cardDTOList = BoardCsvFixture.MOCK_JIRA_CARD_DTO_WITH_EMPTY_BASE_INFO();
		List<BoardCSVConfig> fields = BoardCsvFixture.MOCK_ALL_FIELDS();
		List<BoardCSVConfig> extraFields = BoardCsvFixture.MOCK_EXTRA_FIELDS();

		assertThrows(FileIOException.class, () -> csvFileGenerator.getDataFromCSV("board", 1686710104536L));
		assertThrows(FileIOException.class,
				() -> csvFileGenerator.convertBoardDataToCSV(cardDTOList, fields, extraFields, "15469:89/033"));
	}

	@Test
	public void shouldHasContentWhenGetDataFromCsvGivenDataTypeIsBoard() throws IOException {
		List<JiraCardDTO> cardDTOList = BoardCsvFixture.MOCK_JIRA_CARD_DTO();
		List<BoardCSVConfig> fields = BoardCsvFixture.MOCK_ALL_FIELDS();
		List<BoardCSVConfig> extraFields = BoardCsvFixture.MOCK_EXTRA_FIELDS();

		csvFileGenerator.convertBoardDataToCSV(cardDTOList, fields, extraFields, mockTimeStamp);
		InputStreamResource inputStreamResource = csvFileGenerator.getDataFromCSV("board",
				Long.parseLong(mockTimeStamp));
		InputStream csvDataInputStream = inputStreamResource.getInputStream();
		String boardCsvData = new BufferedReader(new InputStreamReader(csvDataInputStream)).lines()
			.collect(Collectors.joining("\n"));

		Assertions.assertEquals(boardCsvData,
				"\"Issue key\",\"Summary\",\"Issue Type\",\"Status\",\"Story Points\",\"assignee\",\"Reporter\",\"Project Key\",\"Project Name\",\"Priority\",\"Parent Summary\",\"Sprint\",\"Labels\",\"Cycle Time\",\"Story point estimate\",\"Flagged\",\"1010\",\"1011\",\"Cycle Time / Story Points\",\"Analysis Days\",\"In Dev Days\",\"Waiting Days\",\"Testing Days\",\"Block Days\",\"Review Days\",\"OriginCycleTime: DOING\",\"OriginCycleTime: BLOCKED\"\n"
						+ "\"ADM-489\",\"summary\",\"issue type\",,\"2\",\"name\",\"name\",\"ADM\",\"Auto Dora Metrics\",\"Medium\",\"parent\",\"sprint 1\",\"\",\"0.90\",\"1.00\",\"\",\"\",\"{}\",\"0.90\",\"0\",\"0.90\",\"0\",\"0\",\"0\",\"0\",\"0\",\"0\"");

		String fileName = CSVFileNameEnum.BOARD.getValue() + "-" + mockTimeStamp + ".csv";
		File file = new File(fileName);
		file.delete();
	}

}
