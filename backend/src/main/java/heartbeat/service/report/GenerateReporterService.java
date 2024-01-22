package heartbeat.service.report;

import heartbeat.client.dto.codebase.github.PipelineLeadTime;
import heartbeat.controller.board.dto.response.CardCollection;
import heartbeat.controller.report.dto.request.GenerateReportRequest;
import heartbeat.controller.report.dto.request.JiraBoardSetting;
import heartbeat.controller.report.dto.response.ErrorInfo;
import heartbeat.controller.report.dto.response.MetricsDataCompleted;
import heartbeat.controller.report.dto.response.PipelineCSVInfo;
import heartbeat.controller.report.dto.response.ReportMetricsError;
import heartbeat.controller.report.dto.response.ReportResponse;
import heartbeat.exception.BadRequestException;
import heartbeat.exception.BaseException;
import heartbeat.exception.GenerateReportException;
import heartbeat.exception.RequestFailedException;
import heartbeat.exception.ServiceUnavailableException;
import heartbeat.handler.AsyncExceptionHandler;
import heartbeat.handler.AsyncMetricsDataHandler;
import heartbeat.handler.AsyncReportRequestHandler;
import heartbeat.service.report.calculator.ChangeFailureRateCalculator;
import heartbeat.service.report.calculator.ClassificationCalculator;
import heartbeat.service.report.calculator.CycleTimeCalculator;
import heartbeat.service.report.calculator.DeploymentFrequencyCalculator;
import heartbeat.service.report.calculator.LeadTimeForChangesCalculator;
import heartbeat.service.report.calculator.MeanToRecoveryCalculator;
import heartbeat.service.report.calculator.VelocityCalculator;
import heartbeat.service.report.calculator.model.FetchedData;
import heartbeat.service.report.calculator.model.FetchedData.BuildKiteData;

import java.io.File;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import heartbeat.util.IdUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.apache.commons.collections.CollectionUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

import static heartbeat.service.report.scheduler.DeleteExpireCSVScheduler.EXPORT_CSV_VALIDITY_TIME;
import static heartbeat.util.ValueUtil.getValueOrNull;
import static heartbeat.util.ValueUtil.valueOrDefault;

@Service
@RequiredArgsConstructor
@Log4j2
public class GenerateReporterService {

	private final KanbanService kanbanService;

	private final PipelineService pipelineService;

	private final WorkDay workDay;

	private final ClassificationCalculator classificationCalculator;

	private final DeploymentFrequencyCalculator deploymentFrequency;

	private final ChangeFailureRateCalculator changeFailureRate;

	private final MeanToRecoveryCalculator meanToRecoveryCalculator;

	private final CycleTimeCalculator cycleTimeCalculator;

	private final VelocityCalculator velocityCalculator;

	private final CSVFileGenerator csvFileGenerator;

	private final LeadTimeForChangesCalculator leadTimeForChangesCalculator;

	private final AsyncReportRequestHandler asyncReportRequestHandler;

	private final AsyncMetricsDataHandler asyncMetricsDataHandler;

	private final AsyncExceptionHandler asyncExceptionHandler;

	public void generateBoardReport(GenerateReportRequest request) {
		String boardReportId = request.getBoardReportId();
		removePreviousAsyncException(boardReportId);
		log.info(
				"Start to generate board report, _metrics: {}, _considerHoliday: {}, _startTime: {}, _endTime: {}, _boardReportId: {}",
				request.getMetrics(), request.getConsiderHoliday(), request.getStartTime(), request.getEndTime(),
				boardReportId);
		try {
			saveReporterInHandler(generateBoardReporter(request), boardReportId);
			updateMetricsDataCompletedInHandler(request);
			log.info(
					"Successfully generate board report, _metrics: {}, _considerHoliday: {}, _startTime: {}, _endTime: {}, _boardReportId: {}",
					request.getMetrics(), request.getConsiderHoliday(), request.getStartTime(), request.getEndTime(),
					boardReportId);
		}
		catch (BaseException e) {
			handleException(request, boardReportId, e);
		}
	}

	public void generateDoraReport(GenerateReportRequest request) {
		removePreviousAsyncException(request.getPipelineReportId());
		removePreviousAsyncException(request.getSourceControlReportId());
		if (CollectionUtils.isNotEmpty(request.getPipelineMetrics())) {
			generatePipelineReport(request);
		}
		if (CollectionUtils.isNotEmpty(request.getPipelineMetrics())) {
			generateSourceControlReport(request);
		}
		generateCsvForDora(request);
	}

	private void handleException(GenerateReportRequest request, String reportId, BaseException e) {
		asyncExceptionHandler.put(reportId, e);
		if (List.of(401, 403, 404).contains(e.getStatus()))
			updateMetricsDataCompletedInHandler(request);
	}

	private void generatePipelineReport(GenerateReportRequest request) {
		String pipelineReportId = request.getPipelineReportId();
		log.info(
				"Start to generate pipeline report, _metrics: {}, _considerHoliday: {}, _startTime: {}, _endTime: {}, _pipelineReportId: {}",
				request.getPipelineMetrics(), request.getConsiderHoliday(), request.getStartTime(),
				request.getEndTime(), pipelineReportId);
		try {
			saveReporterInHandler(generatePipelineReporter(request), pipelineReportId);
			updateMetricsDataCompletedInHandler(request);
			log.info(
					"Successfully generate pipeline report, _metrics: {}, _considerHoliday: {}, _startTime: {}, _endTime: {}, _pipelineReportId: {}",
					request.getPipelineMetrics(), request.getConsiderHoliday(), request.getStartTime(),
					request.getEndTime(), pipelineReportId);
		}
		catch (BaseException e) {
			handleException(request, pipelineReportId, e);
		}
	}

	private void generateSourceControlReport(GenerateReportRequest request) {
		String sourceControlReportId = request.getSourceControlReportId();
		log.info(
				"Start to generate source control report, _metrics: {}, _considerHoliday: {}, _startTime: {}, _endTime: {}, _sourceControlReportId: {}",
				request.getSourceControlMetrics(), request.getConsiderHoliday(), request.getStartTime(),
				request.getEndTime(), sourceControlReportId);
		try {
			saveReporterInHandler(generateSourceControlReporter(request), sourceControlReportId);
			updateMetricsDataCompletedInHandler(request);
			log.info(
					"Successfully generate source control report, _metrics: {}, _considerHoliday: {}, _startTime: {}, _endTime: {}, _sourceControlReportId: {}",
					request.getSourceControlMetrics(), request.getConsiderHoliday(), request.getStartTime(),
					request.getEndTime(), sourceControlReportId);
		}
		catch (BaseException e) {
			handleException(request, sourceControlReportId, e);
		}
	}

	private void removePreviousAsyncException(String reportId) {
		asyncExceptionHandler.remove(reportId);
	}

	private synchronized ReportResponse generatePipelineReporter(GenerateReportRequest request) {
		workDay.changeConsiderHolidayMode(request.getConsiderHoliday());
		FetchedData fetchedData = fetchOriginalData(request);

		ReportResponse reportResponse = new ReportResponse(EXPORT_CSV_VALIDITY_TIME);

		request.getPipelineMetrics().forEach(metric -> {
			switch (metric) {
				case "deployment frequency" -> reportResponse.setDeploymentFrequency(
						deploymentFrequency.calculate(fetchedData.getBuildKiteData().getDeployTimesList(),
								Long.parseLong(request.getStartTime()), Long.parseLong(request.getEndTime())));
				case "change failure rate" -> reportResponse.setChangeFailureRate(
						changeFailureRate.calculate(fetchedData.getBuildKiteData().getDeployTimesList()));
				case "mean time to recovery" -> reportResponse.setMeanTimeToRecovery(
						meanToRecoveryCalculator.calculate(fetchedData.getBuildKiteData().getDeployTimesList()));
				default -> {
					// TODO
				}
			}
		});

		return reportResponse;
	}

	private synchronized ReportResponse generateBoardReporter(GenerateReportRequest request) {
		workDay.changeConsiderHolidayMode(request.getConsiderHoliday());
		FetchedData fetchedData = fetchOriginalData(request);

		ReportResponse reportResponse = new ReportResponse(EXPORT_CSV_VALIDITY_TIME);
		JiraBoardSetting jiraBoardSetting = request.getJiraBoardSetting();

		final CardCollection realDoneCardCollection = fetchedData.getCardCollectionInfo().getRealDoneCardCollection();
		request.getBoardMetrics().forEach(metric -> {
			switch (metric) {
				case "velocity" ->
					reportResponse.setVelocity(velocityCalculator.calculateVelocity(realDoneCardCollection));
				case "cycle time" -> reportResponse.setCycleTime(cycleTimeCalculator
					.calculateCycleTime(realDoneCardCollection, jiraBoardSetting.getBoardColumns()));
				case "classification" -> reportResponse.setClassificationList(
						classificationCalculator.calculate(jiraBoardSetting.getTargetFields(), realDoneCardCollection));
			}
		});

		return reportResponse;
	}

	private synchronized ReportResponse generateSourceControlReporter(GenerateReportRequest request) {
		workDay.changeConsiderHolidayMode(request.getConsiderHoliday());

		FetchedData fetchedData = fetchOriginalData(request);

		ReportResponse reportResponse = new ReportResponse(EXPORT_CSV_VALIDITY_TIME);

		request.getSourceControlMetrics().forEach(metric -> {
			switch (metric) {
				case "lead time for changes" -> reportResponse.setLeadTimeForChanges(
						leadTimeForChangesCalculator.calculate(fetchedData.getBuildKiteData().getPipelineLeadTimes()));
				default -> {
					// TODO
				}
			}
		});

		return reportResponse;
	}

	private FetchedData fetchOriginalData(GenerateReportRequest request) {
		FetchedData fetchedData = new FetchedData();
		if (CollectionUtils.isNotEmpty(request.getBoardMetrics())) {
			if (request.getJiraBoardSetting() == null)
				throw new BadRequestException("Failed to fetch Jira info due to Jira board setting is null.");
			fetchedData.setCardCollectionInfo(kanbanService.fetchDataFromKanban(request));
		}

		if (CollectionUtils.isNotEmpty(request.getSourceControlMetrics())) {
			if (request.getCodebaseSetting() == null)
				throw new BadRequestException("Failed to fetch Github info due to code base setting is null.");
			BuildKiteData buildKiteData = pipelineService.fetchGithubData(request);
			fetchedData.setBuildKiteData(buildKiteData);
		}

		if (CollectionUtils.isNotEmpty(request.getPipelineMetrics())) {
			if (request.getBuildKiteSetting() == null)
				throw new BadRequestException("Failed to fetch BuildKite info due to BuildKite setting is null.");
			FetchedData.BuildKiteData buildKiteData = pipelineService.fetchBuildKiteInfo(request);
			BuildKiteData cachedBuildKiteData = fetchedData.getBuildKiteData();
			if (cachedBuildKiteData != null) {
				List<PipelineLeadTime> pipelineLeadTimes = cachedBuildKiteData.getPipelineLeadTimes();
				buildKiteData.setPipelineLeadTimes(pipelineLeadTimes);
			}
			fetchedData.setBuildKiteData(buildKiteData);
		}

		return fetchedData;
	}

	private void generateCsvForDora(GenerateReportRequest request) {
		FetchedData fetchedData = fetchOriginalData(request);

		generateCSVForPipeline(request, fetchedData.getBuildKiteData());

	}

	private void generateCSVForPipeline(GenerateReportRequest request, BuildKiteData buildKiteData) {
		List<PipelineCSVInfo> pipelineData = pipelineService.generateCSVForPipelineWithCodebase(
				request.getCodebaseSetting(), request.getStartTime(), request.getEndTime(), buildKiteData,
				request.getBuildKiteSetting().getDeploymentEnvList());

		csvFileGenerator.convertPipelineDataToCSV(pipelineData, request.getCsvTimeStamp());
	}

	public void generateCSVForMetric(ReportResponse reportContent, String csvTimeStamp) {
		csvFileGenerator.convertMetricDataToCSV(reportContent, csvTimeStamp);
	}

	private void saveReporterInHandler(ReportResponse reportContent, String reportId) {
		asyncReportRequestHandler.putReport(reportId, reportContent);
	}

	public void initializeMetricsDataCompletedInHandler(GenerateReportRequest request) {
		MetricsDataCompleted metricsStatus = getMetricsStatus(request, Boolean.FALSE);
		String timeStamp = request.getCsvTimeStamp();
		MetricsDataCompleted previousMetricsCompleted = asyncReportRequestHandler.getMetricsDataCompleted(timeStamp);
		MetricsDataCompleted isMetricsDataCompleted = createMetricsDataCompleted(metricsStatus,
				previousMetricsCompleted);
		asyncMetricsDataHandler.putMetricsDataCompleted(timeStamp, isMetricsDataCompleted);
	}

	private MetricsDataCompleted createMetricsDataCompleted(MetricsDataCompleted metricProcess,
			MetricsDataCompleted previousMetricsCompleted) {
		return previousMetricsCompleted == null
				? MetricsDataCompleted.builder()
					.boardMetricsCompleted(metricProcess.boardMetricsCompleted())
					.pipelineMetricsCompleted(metricProcess.pipelineMetricsCompleted())
					.sourceControlMetricsCompleted(metricProcess.sourceControlMetricsCompleted())
					.build()
				: MetricsDataCompleted.builder()
					.boardMetricsCompleted(valueOrDefault(previousMetricsCompleted.boardMetricsCompleted(),
							metricProcess.boardMetricsCompleted()))
					.pipelineMetricsCompleted(valueOrDefault(previousMetricsCompleted.pipelineMetricsCompleted(),
							metricProcess.pipelineMetricsCompleted()))
					.sourceControlMetricsCompleted(
							valueOrDefault(previousMetricsCompleted.sourceControlMetricsCompleted(),
									metricProcess.sourceControlMetricsCompleted()))
					.build();

	}

	private void updateMetricsDataCompletedInHandler(GenerateReportRequest request) {
		MetricsDataCompleted metricsStatus = getMetricsStatus(request, Boolean.TRUE);
		String timeStamp = request.getCsvTimeStamp();
		MetricsDataCompleted previousMetricsCompleted = asyncReportRequestHandler.getMetricsDataCompleted(timeStamp);
		if (previousMetricsCompleted == null) {
			log.error("Failed to update metrics data completed through this timestamp.");
			throw new GenerateReportException("Failed to update metrics data completed through this timestamp.");
		}
		MetricsDataCompleted metricsDataCompleted = MetricsDataCompleted.builder()
			.boardMetricsCompleted(checkCurrentMetricsCompletedState(metricsStatus.boardMetricsCompleted(),
					previousMetricsCompleted.boardMetricsCompleted()))
			.pipelineMetricsCompleted(checkCurrentMetricsCompletedState(metricsStatus.pipelineMetricsCompleted(),
					previousMetricsCompleted.pipelineMetricsCompleted()))
			.sourceControlMetricsCompleted(
					checkCurrentMetricsCompletedState(metricsStatus.sourceControlMetricsCompleted(),
							previousMetricsCompleted.sourceControlMetricsCompleted()))
			.build();
		asyncMetricsDataHandler.putMetricsDataCompleted(timeStamp, metricsDataCompleted);
	}

	private Boolean checkCurrentMetricsCompletedState(Boolean exist, Boolean previousValue) {
		if (Boolean.TRUE.equals(exist) && Objects.nonNull(previousValue))
			return Boolean.TRUE;
		return previousValue;
	}

	private MetricsDataCompleted getMetricsStatus(GenerateReportRequest request, Boolean flag) {
		return MetricsDataCompleted.builder()
			.boardMetricsCompleted(CollectionUtils.isNotEmpty(request.getBoardMetrics()) ? flag : null)
			.pipelineMetricsCompleted(CollectionUtils.isNotEmpty(request.getPipelineMetrics()) ? flag : null)
			.sourceControlMetricsCompleted(CollectionUtils.isNotEmpty(request.getSourceControlMetrics()) ? flag : null)
			.build();
	}

	public boolean checkGenerateReportIsDone(String reportTimeStamp) {
		if (validateExpire(System.currentTimeMillis(), Long.parseLong(reportTimeStamp))) {
			throw new GenerateReportException("Failed to get report due to report time expires");
		}
		return asyncMetricsDataHandler.isReportReady(reportTimeStamp);
	}

	private ErrorInfo handleAsyncExceptionAndGetErrorInfo(BaseException exception) {
		if (Objects.nonNull(exception)) {
			int status = exception.getStatus();
			final String errorMessage = exception.getMessage();
			switch (status) {
				case 401, 403, 404 -> {
					return ErrorInfo.builder().status(status).errorMessage(errorMessage).build();
				}
				case 500 -> throw new GenerateReportException(errorMessage);
				case 503 -> throw new ServiceUnavailableException(errorMessage);
				default -> throw new RequestFailedException(status, errorMessage);
			}
		}
		return null;
	}

	private void deleteOldCSV(long currentTimeStamp, File directory) {
		File[] files = directory.listFiles();
		if (!ObjectUtils.isEmpty(files)) {
			for (File file : files) {
				String fileName = file.getName();
				String[] splitResult = fileName.split("\\s*\\-|\\.\\s*");
				String timeStamp = splitResult[1];
				if (validateExpire(currentTimeStamp, Long.parseLong(timeStamp)) && !file.delete()) {
					log.error("Failed to deleted expired CSV file, file name: {}", fileName);
				}
			}
		}
	}

	private boolean validateExpire(long currentTimeStamp, long timeStamp) {
		return timeStamp < currentTimeStamp - EXPORT_CSV_VALIDITY_TIME;
	}

	public Boolean deleteExpireCSV(Long currentTimeStamp, File directory) {
		try {
			deleteOldCSV(currentTimeStamp, directory);
			log.info("Successfully deleted expired CSV files, currentTimeStamp: {}", currentTimeStamp);
			return true;
		}
		catch (Exception exception) {
			Throwable cause = Optional.ofNullable(exception.getCause()).orElse(exception);
			log.error("Failed to deleted expired CSV files, currentTimeStamp：{}, exception: {}", currentTimeStamp,
					cause.getMessage());
			return false;
		}
	}

	public ReportResponse getReportFromHandler(String reportId) {
		return asyncReportRequestHandler.getReport(reportId);
	}

	public ReportResponse getComposedReportResponse(String reportId, boolean isReportReady) {
		ReportResponse boardReportResponse = getReportFromHandler(IdUtil.getBoardReportId(reportId));
		ReportResponse pipleineReportResponse = getReportFromHandler(IdUtil.getPipelineReportId(reportId));
		ReportResponse sourceControlReportResponse = getReportFromHandler(IdUtil.getSourceControlReportId(reportId));
		MetricsDataCompleted metricsDataCompleted = asyncReportRequestHandler.getMetricsDataCompleted(reportId);
		ReportMetricsError reportMetricsError = getReportErrorAndHandleAsyncException(reportId);

		return ReportResponse.builder()
			.velocity(getValueOrNull(boardReportResponse, ReportResponse::getVelocity))
			.classificationList(getValueOrNull(boardReportResponse, ReportResponse::getClassificationList))
			.cycleTime(getValueOrNull(boardReportResponse, ReportResponse::getCycleTime))
			.exportValidityTime(EXPORT_CSV_VALIDITY_TIME)
			.deploymentFrequency(getValueOrNull(pipleineReportResponse, ReportResponse::getDeploymentFrequency))
			.changeFailureRate(getValueOrNull(pipleineReportResponse, ReportResponse::getChangeFailureRate))
			.meanTimeToRecovery(getValueOrNull(pipleineReportResponse, ReportResponse::getMeanTimeToRecovery))
			.leadTimeForChanges(getValueOrNull(sourceControlReportResponse, ReportResponse::getLeadTimeForChanges))
			.boardMetricsCompleted(getValueOrNull(metricsDataCompleted, MetricsDataCompleted::boardMetricsCompleted))
			.pipelineMetricsCompleted(
					getValueOrNull(metricsDataCompleted, MetricsDataCompleted::pipelineMetricsCompleted))
			.sourceControlMetricsCompleted(
					getValueOrNull(metricsDataCompleted, MetricsDataCompleted::sourceControlMetricsCompleted))
			.allMetricsCompleted(isReportReady)
			.reportMetricsError(reportMetricsError)
			.build();
	}

	public ReportMetricsError getReportErrorAndHandleAsyncException(String reportId) {
		BaseException boardException = asyncExceptionHandler.get(IdUtil.getBoardReportId(reportId));
		BaseException pipelineException = asyncExceptionHandler.get(IdUtil.getPipelineReportId(reportId));
		BaseException sourceControlException = asyncExceptionHandler.get(IdUtil.getSourceControlReportId(reportId));
		return ReportMetricsError.builder()
			.boardMetricsError(handleAsyncExceptionAndGetErrorInfo(boardException))
			.pipelineMetricsError(handleAsyncExceptionAndGetErrorInfo(pipelineException))
			.sourceControlMetricsError(handleAsyncExceptionAndGetErrorInfo(sourceControlException))
			.build();
	}

}
