package heartbeat.service.report;

import com.google.gson.JsonElement;
import com.opencsv.CSVWriter;
import heartbeat.controller.board.dto.response.JiraCardDTO;
import heartbeat.controller.report.dto.response.BoardCSVConfig;
import heartbeat.controller.report.dto.response.BoardCSVConfigEnum;
import heartbeat.controller.report.dto.response.LeadTimeInfo;
import heartbeat.controller.report.dto.response.PipelineCSVInfo;
import heartbeat.exception.FileIOException;
import heartbeat.util.DecimalUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.core.io.InputStreamResource;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

@RequiredArgsConstructor
@Component
@Log4j2
public class CSVFileGenerator {

	private static final String FORMAT_2_DECIMALS = "0.00";

	private static InputStreamResource readStringFromCsvFile(String fileName) {
		try {
			InputStream inputStream = new FileInputStream(fileName);

			return new InputStreamResource(inputStream);
		}
		catch (IOException e) {
			log.error("Failed to read file", e);
			throw new FileIOException(e);
		}
	}

	private static Map<String, JsonElement> getCustomFields(JiraCardDTO perRowCardDTO) {
		if (perRowCardDTO.getBaseInfo() != null && perRowCardDTO.getBaseInfo().getFields() != null) {
			return perRowCardDTO.getBaseInfo().getFields().getCustomFields();
		}
		else {
			return null;
		}
	}

	public void convertPipelineDataToCSV(List<PipelineCSVInfo> leadTimeData, String csvTimeStamp) {
		log.info("Start to create csv directory");
		boolean created = createCsvDirectory();
		String message = created ? "Successfully create csv directory" : "CSV directory is already exist";
		log.info(message);

		String fileName = CSVFileNameEnum.PIPELINE.getValue() + "-" + csvTimeStamp + ".csv";
		File file = new File(fileName);

		try (CSVWriter csvWriter = new CSVWriter(new FileWriter(file))) {
			String[] headers = { "Pipeline Name", "Pipeline Step", "Build Number", "Committer",
					"First Code Committed Time In PR", "Code Committed Time", "PR Created Time", "PR Merged Time",
					"Deployment Completed Time", "Total Lead Time (HH:mm:ss)",
					"Time from PR Created to PR Merged (HH:mm:ss)",
					"Time from PR Merged to Deployment Completed (HH:mm:ss)", "Status" };

			csvWriter.writeNext(headers);

			for (PipelineCSVInfo csvInfo : leadTimeData) {
				String committerName = null;
				String commitDate = null;
				String pipelineName = csvInfo.getPipeLineName();
				String stepName = csvInfo.getStepName();
				String buildNumber = String.valueOf(csvInfo.getBuildInfo().getNumber());
				String state = csvInfo.getDeployInfo().getState();
				if (csvInfo.getCommitInfo() != null) {
					committerName = csvInfo.getCommitInfo().getCommit().getCommitter().getName();
					commitDate = csvInfo.getCommitInfo().getCommit().getCommitter().getDate();
				}

				LeadTimeInfo leadTimeInfo = csvInfo.getLeadTimeInfo();
				String firstCommitTimeInPr = leadTimeInfo.getFirstCommitTimeInPr();
				String prCreatedTime = leadTimeInfo.getPrCreatedTime();
				String prMergedTime = leadTimeInfo.getPrMergedTime();
				String jobFinishTime = leadTimeInfo.getJobFinishTime();
				String totalTime = leadTimeInfo.getTotalTime();
				String prDelayTime = leadTimeInfo.getPrDelayTime();
				String pipelineDelayTime = leadTimeInfo.getPipelineDelayTime();

				String[] rowData = { pipelineName, stepName, buildNumber, committerName, firstCommitTimeInPr,
						commitDate, prCreatedTime, prMergedTime, jobFinishTime, totalTime, prDelayTime,
						pipelineDelayTime, state };

				csvWriter.writeNext(rowData);
			}
		}
		catch (IOException e) {
			log.error("Failed to write file", e);
			throw new FileIOException(e);
		}
	}

	public InputStreamResource getDataFromCSV(String dataType, long csvTimeStamp) {
		return switch (dataType) {
			case "pipeline" -> readStringFromCsvFile(CSVFileNameEnum.PIPELINE.getValue() + "-" + csvTimeStamp + ".csv");
			case "board" -> readStringFromCsvFile(CSVFileNameEnum.BOARD.getValue() + "-" + csvTimeStamp + ".csv");
			default -> new InputStreamResource(new ByteArrayInputStream("".getBytes()));
		};
	}

	private boolean createCsvDirectory() {
		String directoryPath = "./csv";
		File directory = new File(directoryPath);
		return directory.mkdirs();
	}

	public void convertBoardDataToCSV(List<JiraCardDTO> cardDTOList, List<BoardCSVConfig> fields,
			List<BoardCSVConfig> extraFields, String csvTimeStamp) {
		log.info("Start to create board csv directory");
		boolean created = createCsvDirectory();
		String message = created ? "Successfully create csv directory" : "CSV directory is already exist";
		log.info(message);

		String fileName = CSVFileNameEnum.BOARD.getValue() + "-" + csvTimeStamp + ".csv";
		try (CSVWriter writer = new CSVWriter(new FileWriter(fileName))) {
			List<BoardCSVConfig> fixedFields = new ArrayList<>(fields);
			fixedFields.removeAll(extraFields);

			String[][] fixedFieldsData = getFixedFieldsData(cardDTOList, fixedFields);
			String[][] extraFieldsData = getExtraFieldsData(cardDTOList, extraFields);

			String[] fixedFieldsRow = fixedFieldsData[0];
			String targetElement = "Cycle Time";
			List<String> fixedFieldsRowList = Arrays.asList(fixedFieldsRow);
			int targetIndex = fixedFieldsRowList.indexOf(targetElement);
			int insertIndex = targetIndex == -1 ? fixedFieldsRow.length : targetIndex + 1;

			String[][] mergedArrays = mergeArrays(fixedFieldsData, extraFieldsData, insertIndex);

			writer.writeAll(Arrays.asList(mergedArrays));

		}
		catch (IOException e) {
			log.error("Failed to write file", e);
			throw new FileIOException(e);
		}
	}

	public String[][] mergeArrays(String[][] fixedFieldsData, String[][] extraFieldsData, int fixedColumnCount) {
		int mergedColumnLength = fixedFieldsData[0].length + extraFieldsData[0].length;
		String[][] mergedArray = new String[fixedFieldsData.length][mergedColumnLength];
		for (int i = 0; i < fixedFieldsData.length; i++) {
			String[] mergedPerRowArray = new String[mergedColumnLength];
			System.arraycopy(fixedFieldsData[i], 0, mergedPerRowArray, 0, fixedColumnCount);
			System.arraycopy(extraFieldsData[i], 0, mergedPerRowArray, fixedColumnCount, extraFieldsData[i].length);
			System.arraycopy(fixedFieldsData[i], fixedColumnCount, mergedPerRowArray,
					fixedColumnCount + extraFieldsData[i].length, fixedFieldsData[i].length - fixedColumnCount);
			mergedArray[i] = mergedPerRowArray;
		}

		return mergedArray;
	}

	private String[][] getExtraFieldsData(List<JiraCardDTO> cardDTOList, List<BoardCSVConfig> extraFields) {
		// TODO new app -> Story point estimate: 有小数
		// TODO old app -> Story point estimate: 无小数
		int rowCount = cardDTOList.size() + 1;
		int columnCount = extraFields.size();
		String[][] data = new String[rowCount][columnCount];

		for (int column = 0; column < columnCount; column++) {
			data[0][column] = extraFields.get(column).getLabel();
		}
		for (int row = 0; row < cardDTOList.size(); row++) {
			JiraCardDTO perRowCardDTO = cardDTOList.get(row);
			Map<String, JsonElement> customFields = getCustomFields(perRowCardDTO);
			for (int column = 0; column < columnCount; column++) {
				data[row + 1][column] = getExtraDataPerRow(customFields, extraFields.get(column));
			}
		}
		return data;
	}

	private String[][] getFixedFieldsData(List<JiraCardDTO> cardDTOList, List<BoardCSVConfig> fixedFields) {

		int rowCount = cardDTOList.size() + 1;
		int columnCount = fixedFields.size();
		List<BoardCSVConfig> originCycleTimeFields = getOriginCycleTimeFields(fixedFields);
		int fixedFieldColumnCount = columnCount - originCycleTimeFields.size();

		String[][] data = new String[rowCount][columnCount];

		for (int column = 0; column < columnCount; column++) {
			data[0][column] = fixedFields.get(column).getLabel();
		}
		for (int row = 0; row < cardDTOList.size(); row++) {
			JiraCardDTO cardDTO = cardDTOList.get(row);

			String[] fixedDataPerRow = getFixedDataPerRow(cardDTO, fixedFieldColumnCount);
			String[] originCycleTimePerRow = getOriginCycleTimePerRow(cardDTO, originCycleTimeFields);
			data[row + 1] = Stream.concat(Arrays.stream(fixedDataPerRow), Arrays.stream(originCycleTimePerRow))
				.toArray(String[]::new);
		}
		return data;
	}

	private String[] getOriginCycleTimePerRow(JiraCardDTO cardDTO, List<BoardCSVConfig> originCycleTimeFields) {

		int columnCount = originCycleTimeFields.size();
		String[] data = new String[columnCount];

		for (int column = 0; column < columnCount; column++) {
			data[column] = getExtraDataPerRow(cardDTO.getCycleTimeFlat(), originCycleTimeFields.get(column));
		}
		return data;

	}

	private List<BoardCSVConfig> getOriginCycleTimeFields(List<BoardCSVConfig> fixedFields) {
		BoardCSVConfigEnum[] values = BoardCSVConfigEnum.values();
		List<String> fixedLabels = new ArrayList<>();
		List<BoardCSVConfig> originCycleTimeFields = new ArrayList<>(fixedFields);

		for (BoardCSVConfigEnum value : values) {
			fixedLabels.add(value.getLabel());
		}

		originCycleTimeFields.removeIf(config -> fixedLabels.contains(config.getLabel()));

		return originCycleTimeFields;
	}

	private String[] getFixedDataPerRow(JiraCardDTO cardDTO, int columnCount) {
		String[] rowData = new String[columnCount];
		if (cardDTO.getBaseInfo() != null) {
			rowData[0] = cardDTO.getBaseInfo().getKey();

			if (cardDTO.getBaseInfo().getFields() != null) {
				rowData[1] = cardDTO.getBaseInfo().getFields().getSummary();
				rowData[2] = cardDTO.getBaseInfo().getFields().getIssuetype().getName();
				rowData[3] = cardDTO.getBaseInfo().getFields().getStatus().getName();
				rowData[4] = String.valueOf(cardDTO.getBaseInfo().getFields().getStoryPoints());
				if (cardDTO.getBaseInfo().getFields().getAssignee() != null) {
					rowData[5] = cardDTO.getBaseInfo().getFields().getAssignee().getDisplayName();
				}
				if (cardDTO.getBaseInfo().getFields().getReporter() != null) {
					rowData[6] = cardDTO.getBaseInfo().getFields().getReporter().getDisplayName();
				}

				rowData[7] = cardDTO.getBaseInfo().getFields().getProject().getKey();
				rowData[8] = cardDTO.getBaseInfo().getFields().getProject().getName();
				rowData[9] = cardDTO.getBaseInfo().getFields().getPriority().getName();

				if (cardDTO.getBaseInfo().getFields().getParent() != null) {
					rowData[10] = cardDTO.getBaseInfo().getFields().getParent().getFields().getSummary();
				}

				// TODO 与old app不一致，但原始数据sprint为null
				if (cardDTO.getBaseInfo().getFields().getSprint() != null) {
					rowData[11] = cardDTO.getBaseInfo().getFields().getSprint().getName();
				}

				rowData[12] = String.join(",", cardDTO.getBaseInfo().getFields().getLabels());
			}

		}
		if (cardDTO.getCardCycleTime() != null) {
			// TODO new app do not calculate cycle time for nonDoneCards
			rowData[13] = DecimalUtil.formatDecimalTwo(cardDTO.getCardCycleTime().getTotal());
			rowData[14] = cardDTO.getTotalCycleTimeDivideStoryPoints();
			rowData[15] = DecimalUtil.formatDecimalTwo(cardDTO.getCardCycleTime().getSteps().getAnalyse());
			rowData[16] = DecimalUtil.formatDecimalTwo(cardDTO.getCardCycleTime().getSteps().getDevelopment());
			rowData[17] = DecimalUtil.formatDecimalTwo(cardDTO.getCardCycleTime().getSteps().getWaiting());
			rowData[18] = DecimalUtil.formatDecimalTwo(cardDTO.getCardCycleTime().getSteps().getTesting());
			rowData[19] = DecimalUtil.formatDecimalTwo(cardDTO.getCardCycleTime().getSteps().getBlocked());
			rowData[20] = DecimalUtil.formatDecimalTwo(cardDTO.getCardCycleTime().getSteps().getReview());
		}
		return rowData;
	}

	private String getExtraDataPerRow(Object object, BoardCSVConfig extraField) {
		DecimalFormat decimalFormat = new DecimalFormat(FORMAT_2_DECIMALS);
		Map<String, JsonElement> elementMap = (Map<String, JsonElement>) object;
		if (elementMap == null) {
			return null;
		}
		String[] values = extraField.getValue().split("\\.");
		String extraFieldValue = values[values.length - 1];
		Object fieldValue = elementMap.get(extraFieldValue);
		if (fieldValue == null) {
			return "";
		}
		else if (fieldValue instanceof Double) {
			return decimalFormat.format(fieldValue);
		}
		else if (fieldValue.toString().equals("null")) {
			return "";
		}
		else {
			return fieldValue.toString().replaceAll("\"", "");
		}
	}

}
