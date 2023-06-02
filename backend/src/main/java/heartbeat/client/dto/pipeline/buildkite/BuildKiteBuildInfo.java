package heartbeat.client.dto.pipeline.buildkite;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import heartbeat.util.TimeUtil;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BuildKiteBuildInfo {

	private List<BuildKiteJob> jobs;

	private String commit;

	@JsonProperty("created_at")
	private String pipelineCreateTime;

	private int number;

	public DeployInfo mapToDeployInfo(String step, String state, String startTime, String endTime) {
		Instant startDate = Instant.ofEpochMilli(Long.parseLong(startTime));
		Instant endDate = Instant.ofEpochMilli(Long.parseLong(endTime));
		BuildKiteJob job = this.jobs.stream()
			.filter(item -> Objects.equals(item.getName(), step) && Objects.equals(state, item.getState()))
			.filter(item -> {
				Instant time = Instant.parse(item.getFinishedAt());
				return TimeUtil.isAfterAndEqual(startDate, time) && TimeUtil.isBeforeAndEqual(endDate, time);
			})
			.findFirst()
			.orElse(null);

		if (this.pipelineCreateTime == null || job == null || job.getStartedAt() == null
				|| job.getFinishedAt() == null) {
			return DeployInfo.builder().build();
		}

		return new DeployInfo(this.pipelineCreateTime, job.getStartedAt(), job.getFinishedAt(), this.commit,
				job.getState());
	}

}
