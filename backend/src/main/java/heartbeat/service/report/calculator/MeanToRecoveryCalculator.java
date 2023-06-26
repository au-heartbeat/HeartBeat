package heartbeat.service.report.calculator;

import heartbeat.client.dto.pipeline.buildkite.DeployInfo;
import heartbeat.client.dto.pipeline.buildkite.DeployTimes;
import heartbeat.controller.report.dto.response.AvgMeanTimeToRecovery;
import heartbeat.controller.report.dto.response.MeanTimeToRecovery;
import heartbeat.controller.report.dto.response.MeanTimeToRecoveryOfPipeline;
import heartbeat.controller.report.dto.response.TotalTimeAndRecoveryTimes;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Component
public class MeanToRecoveryCalculator {

	public MeanTimeToRecovery calculate(List<DeployTimes> deployTimes) {
		List<MeanTimeToRecoveryOfPipeline> meanTimeRecoveryPipelines = deployTimes.stream()
			.map(this::convertToMeanTimeToRecoveryOfPipeline)
			.collect(Collectors.toList());

		double avgMeanTimeToRecovery = meanTimeRecoveryPipelines.stream()
			.mapToDouble(MeanTimeToRecoveryOfPipeline::getMeanTimeToRecovery)
			.average()
			.orElse(0);
		AvgMeanTimeToRecovery avgMeanTimeToRecoveryObj = new AvgMeanTimeToRecovery(
				getFormattedTime(avgMeanTimeToRecovery));

		return new MeanTimeToRecovery(avgMeanTimeToRecoveryObj, meanTimeRecoveryPipelines);
	}

	private double getFormattedTime(double time) {
		BigDecimal decimal = new BigDecimal(String.valueOf(time));
		return decimal.setScale(1, RoundingMode.HALF_UP).doubleValue();
	}

	private MeanTimeToRecoveryOfPipeline convertToMeanTimeToRecoveryOfPipeline(DeployTimes deploy) {
		if (deploy.getFailed().isEmpty()) {
			return new MeanTimeToRecoveryOfPipeline(deploy.getPipelineName(), deploy.getPipelineStep(), 0);
		}
		else {
			TotalTimeAndRecoveryTimes result = getTotalRecoveryTimeAndRecoveryTimes(deploy);
			double meanTimeToRecovery = 0;
			if (result.getRecoveryTimes() != 0) {
				meanTimeToRecovery = result.getTotalTimeToRecovery() / result.getRecoveryTimes();
			}
			return new MeanTimeToRecoveryOfPipeline(deploy.getPipelineName(), deploy.getPipelineStep(),
					getFormattedTime(meanTimeToRecovery));
		}
	}

	private TotalTimeAndRecoveryTimes getTotalRecoveryTimeAndRecoveryTimes(DeployTimes deploy) {
		List<DeployInfo> sortedJobs = new ArrayList<>(deploy.getFailed());
		sortedJobs.addAll(deploy.getPassed());
		sortedJobs.sort(Comparator.comparing(DeployInfo::getPipelineCreateTime));

		long totalTimeToRecovery = 0;
		long failedJobCreateTime = 0;
		int recoveryTimes = 0;

		for (DeployInfo job : sortedJobs) {
			long pipelineCreateTime = Instant.parse(job.getPipelineCreateTime()).toEpochMilli();
			if ("passed".equals(job.getState()) && failedJobCreateTime != 0) {
				totalTimeToRecovery += pipelineCreateTime - failedJobCreateTime;
				failedJobCreateTime = 0;
				recoveryTimes++;
			}
			if ("failed".equals(job.getState()) && failedJobCreateTime == 0) {
				failedJobCreateTime = pipelineCreateTime;
			}
		}

		return new TotalTimeAndRecoveryTimes(totalTimeToRecovery, recoveryTimes);
	}

}
