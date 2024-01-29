package heartbeat.handler.base;

import com.google.gson.Gson;
import com.google.gson.stream.JsonReader;
import heartbeat.exception.GenerateReportException;
import lombok.extern.log4j.Log4j2;
import org.springframework.util.ObjectUtils;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Objects;

import static heartbeat.handler.base.FIleType.METRICS_DATA_COMPLETED;
import static heartbeat.service.report.scheduler.DeleteExpireCSVScheduler.EXPORT_CSV_VALIDITY_TIME;

@Log4j2
public class AsyncDataBaseHandler {

	private static final String OUTPUT_FILE_PATH = "./app/output/";

	public static final String SUFFIX_TMP = ".tmp";

	private void createDirToConvertData(FIleType fIleType) {
		File directory = new File(OUTPUT_FILE_PATH + fIleType.getType());
		boolean isCreateSucceed = directory.mkdirs();
		String message = isCreateSucceed ? String.format("Successfully create %s directory", fIleType.getType())
				: String.format("Failed create %s directory because it already exist", fIleType.getType());
		log.info(message);
	}

	protected void creatFileByType(FIleType fIleType, String fileId, String json) {
		createDirToConvertData(fIleType);
		String fileName = OUTPUT_FILE_PATH + fIleType.getPath() + fileId;
		String tmpFileName = OUTPUT_FILE_PATH + fIleType.getPath() + fileId + SUFFIX_TMP;
		log.info("Start to write file type: {}, file name: {}", fIleType.getType(), fileName);
		try (FileWriter writer = new FileWriter(tmpFileName)) {
			writer.write(json);
			Files.move(Path.of(tmpFileName), Path.of(fileName), StandardCopyOption.ATOMIC_MOVE,
					StandardCopyOption.REPLACE_EXISTING);
			log.info("Successfully write file type: {}, file name: {}", fIleType.getType(), fileId);
		}
		catch (IOException | RuntimeException e) {
			log.error("Failed write file type: {}, file name: {}, reason: {}", fIleType.getType(), fileId, e);
			throw new GenerateReportException("Failed write " + fIleType.getType() + " file " + fileId);
		}
	}

	protected <T> T readFileByType(FIleType fIleType, String fileId, Class<T> classType) {
		String fileName = OUTPUT_FILE_PATH + fIleType.getPath() + fileId;
		if (Files.exists(Path.of(fileName))) {
			try (JsonReader reader = new JsonReader(new FileReader(fileName))) {
				return new Gson().fromJson(reader, classType);
			}
			catch (IOException | RuntimeException e) {
				log.error("Failed read file type: {}, file name: {}, reason: {}", fIleType.getType(), fileId, e);
				throw new GenerateReportException("Failed read " + fIleType.getType() + " file " + fileId);
			}
		}
		return null;
	}

	protected <T> T readAndRemoveFileByType(FIleType fIleType, String fileId, Class<T> classType) {
		String fileName = OUTPUT_FILE_PATH + fIleType.getPath() + fileId;
		log.info("Start to remove file type: {}, file name: {}", fIleType.getType(), fileId);
		try {
			T t = readFileByType(fIleType, fileId, classType);
			if (Objects.nonNull(t)) {
				Files.delete(Path.of(fileName));
			}
			log.info("Successfully remove file type: {}, file name: {}", fIleType.getType(), fileId);
			return t;
		}
		catch (IOException | RuntimeException e) {
			log.info("Failed remove file type: {}, file name: {}", fIleType.getType(), fileId);
			throw new GenerateReportException("Failed remove " + fIleType.getType() + " file " + fileId);
		}
	}

	protected void deleteExpireFileByType(FIleType fIleType, long currentTimeStamp) {
		File directory = new File(OUTPUT_FILE_PATH + fIleType.getType());
		File[] files = directory.listFiles();
		if (!ObjectUtils.isEmpty(files)) {
			for (File file : files) {
				String fileName = file.getName();
				String[] splitResult = fileName.split("\\s*\\-|\\.\\s*");
				String timeStamp = METRICS_DATA_COMPLETED == fIleType ? splitResult[0] : splitResult[1];
				if (validateExpire(currentTimeStamp, Long.parseLong(timeStamp)) && !file.delete() && file.exists()) {
					log.error("Failed to deleted expired fIleType: {} file, file name: {}", fIleType.getType(),
							fileName);
				}
			}
		}
	}

	private boolean validateExpire(long currentTimeStamp, long timeStamp) {
		return timeStamp < currentTimeStamp - EXPORT_CSV_VALIDITY_TIME;
	}

}
