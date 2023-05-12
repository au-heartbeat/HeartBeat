package heartbeat.service.report;

import heartbeat.client.dto.pipeline.buildkite.DeployTimes;
import heartbeat.controller.report.dto.response.AvgChangeFailureRate;
import heartbeat.controller.report.dto.response.ChangeFailureRate;
import heartbeat.controller.report.dto.response.ChangeFailureRateOfPipeline;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.text.DecimalFormat;
import java.util.List;

@RequiredArgsConstructor
@Component
public class ChangeFailureRateCalculator {

	private static final String FORMAT_4_DECIMALS = "0.0000";

	private int totalCount = 0;

	private int totalFailureCount = 0;

	public ChangeFailureRate calculate(List<DeployTimes> deployTimesList) {
		DecimalFormat decimalFormat = new DecimalFormat(FORMAT_4_DECIMALS);

		List<ChangeFailureRateOfPipeline> changeFailureRateOfPipelines = deployTimesList.stream().map(item -> {
			int failedTimesOfPipeline = item.getFailed().size();
			int passedTimesOfPipeline = item.getPassed().size();
			int totalTimesOfPipeline = failedTimesOfPipeline + passedTimesOfPipeline;
			float failureRateOfPipeline = (float) failedTimesOfPipeline / totalTimesOfPipeline;
			totalCount += totalTimesOfPipeline;
			totalFailureCount += failedTimesOfPipeline;

			return ChangeFailureRateOfPipeline.builder()
				.name(item.getPipelineName())
				.step(item.getPipelineStep())
				.failedTimesOfPipeline(failedTimesOfPipeline)
				.totalTimesOfPipeline(totalTimesOfPipeline)
				.failureRate(Float.parseFloat(decimalFormat.format(failureRateOfPipeline)))
				.build();
		}).toList();

		float avgFailureRate = (float) totalFailureCount / totalCount;
		AvgChangeFailureRate avgChangeFailureRate = AvgChangeFailureRate.builder()
			.totalTimes(totalCount)
			.totalFailedTimes(totalFailureCount)
			.failureRate(Float.parseFloat(decimalFormat.format(avgFailureRate)))
			.build();

		return ChangeFailureRate.builder()
			.avgChangeFailureRate(avgChangeFailureRate)
			.changeFailureRateOfPipelines(changeFailureRateOfPipelines)
			.build();
	}

}
