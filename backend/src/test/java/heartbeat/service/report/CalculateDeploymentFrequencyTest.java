package heartbeat.service.report;

import heartbeat.client.dto.pipeline.buildkite.DeployInfo;
import heartbeat.client.dto.pipeline.buildkite.DeployTimes;
import heartbeat.controller.report.dto.response.AvgDeploymentFrequency;
import heartbeat.controller.report.dto.response.DeploymentFrequency;
import heartbeat.service.pipeline.buildkite.builder.DeployTimesBuilder;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CalculateDeploymentFrequencyTest {

	public static final String JOB_FINISH_TIME_2022 = "2022-09-08T22:45:33.981Z";

	public static final String JOB_FINISH_TIME_2023 = "2023-09-08T22:45:33.981Z";

	public static final String PASSED_STATE = "passed";

	public static final String START_TIME = "0000000000000";

	public static final String END_TIME = "1662739199000";

	@InjectMocks
	private DeploymentFrequencyCalculator deploymentFrequency;

	@Mock
	private WorkDay workDay;

	@Test
	public void testCalculateDeploymentFrequency() {
		DeployTimes mockedDeployTimes = DeployTimesBuilder.withDefault()
			.withPassed(List.of(DeployInfo.builder().jobFinishTime(JOB_FINISH_TIME_2022).state(PASSED_STATE).build(),
					DeployInfo.builder().jobFinishTime(JOB_FINISH_TIME_2023).state(PASSED_STATE).build()))
			.build();
		DeploymentFrequency expectedDeploymentFrequency = DeploymentFrequency.builder()
			.avgDeploymentFrequency(AvgDeploymentFrequency.builder().deploymentFrequency(0.1F).build())
			.build();

		when(workDay.calculateWorkDaysBetween(anyLong(), anyLong())).thenReturn(10);

		DeploymentFrequency deploymentFrequency = this.deploymentFrequency.calculate(List.of(mockedDeployTimes),
				Long.parseLong(START_TIME), Long.parseLong(END_TIME));

		assertThat(deploymentFrequency.getAvgDeploymentFrequency())
			.isEqualTo(expectedDeploymentFrequency.getAvgDeploymentFrequency());
	}

	@Test
	public void testCalculateDeploymentFrequencyWhenWorkDayIsZero() {
		DeployTimes mockedDeployTimes = DeployTimesBuilder.withDefault()
			.withPassed(List.of(DeployInfo.builder().jobFinishTime(JOB_FINISH_TIME_2022).state(PASSED_STATE).build()))
			.build();
		DeploymentFrequency expectedDeploymentFrequency = DeploymentFrequency.builder()
			.avgDeploymentFrequency(AvgDeploymentFrequency.builder().deploymentFrequency(0.0F).build())
			.build();

		when(workDay.calculateWorkDaysBetween(anyLong(), anyLong())).thenReturn(0);

		DeploymentFrequency deploymentFrequency = this.deploymentFrequency.calculate(List.of(mockedDeployTimes),
				Long.parseLong(START_TIME), Long.parseLong(START_TIME));

		assertThat(deploymentFrequency.getAvgDeploymentFrequency())
			.isEqualTo(expectedDeploymentFrequency.getAvgDeploymentFrequency());
	}

	@Test
	public void testCalculateDeploymentFrequencyWhenPassedDeployInfoIsEmpty() {
		DeployTimes mockedDeployTimes = DeployTimesBuilder.withDefault().withPassed(Collections.emptyList()).build();
		DeploymentFrequency expectedDeploymentFrequency = DeploymentFrequency.builder()
			.avgDeploymentFrequency(AvgDeploymentFrequency.builder().deploymentFrequency(0.0F).build())
			.build();

		when(workDay.calculateWorkDaysBetween(anyLong(), anyLong())).thenReturn(10);

		DeploymentFrequency deploymentFrequency = this.deploymentFrequency.calculate(List.of(mockedDeployTimes),
				Long.parseLong(START_TIME), Long.parseLong(END_TIME));

		assertThat(deploymentFrequency.getAvgDeploymentFrequency())
			.isEqualTo(expectedDeploymentFrequency.getAvgDeploymentFrequency());
	}

	@Test
	public void testCalculateDeploymentFrequencyWhenHaveTwoDeployInfo() {
		DeployTimes mockedDeployTimes = DeployTimesBuilder.withDefault()
			.withPassed(List.of(DeployInfo.builder().jobFinishTime(JOB_FINISH_TIME_2022).state(PASSED_STATE).build(),
					DeployInfo.builder().jobFinishTime(JOB_FINISH_TIME_2022).state(PASSED_STATE).build()))
			.build();
		DeploymentFrequency expectedDeploymentFrequency = DeploymentFrequency.builder()
			.avgDeploymentFrequency(AvgDeploymentFrequency.builder().deploymentFrequency(0.2F).build())
			.build();

		when(workDay.calculateWorkDaysBetween(anyLong(), anyLong())).thenReturn(10);

		DeploymentFrequency deploymentFrequency = this.deploymentFrequency.calculate(List.of(mockedDeployTimes),
				Long.parseLong(START_TIME), Long.parseLong(END_TIME));

		assertThat(deploymentFrequency.getAvgDeploymentFrequency())
			.isEqualTo(expectedDeploymentFrequency.getAvgDeploymentFrequency());
	}

	@Test
	public void testCalculateDeploymentFrequencyWhenDeployTimesIsEmpty() {
		DeploymentFrequency expectedDeploymentFrequency = DeploymentFrequency.builder()
			.avgDeploymentFrequency(AvgDeploymentFrequency.builder().deploymentFrequency(0.0F).build())
			.build();
		when(workDay.calculateWorkDaysBetween(anyLong(), anyLong())).thenReturn(10);

		DeploymentFrequency deploymentFrequency = this.deploymentFrequency.calculate(Collections.emptyList(),
				Long.parseLong(START_TIME), Long.parseLong(END_TIME));

		assertThat(deploymentFrequency.getAvgDeploymentFrequency())
			.isEqualTo(expectedDeploymentFrequency.getAvgDeploymentFrequency());
	}

}
