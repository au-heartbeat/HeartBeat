package heartbeat.service.report;

import heartbeat.client.dto.codebase.github.Author;
import heartbeat.client.dto.codebase.github.Commit;
import heartbeat.client.dto.codebase.github.CommitInfo;
import heartbeat.client.dto.codebase.github.Committer;
import heartbeat.client.dto.codebase.github.LeadTime;
import heartbeat.client.dto.codebase.github.PipelineLeadTime;
import heartbeat.client.dto.pipeline.buildkite.BuildKiteBuildInfo;
import heartbeat.client.dto.pipeline.buildkite.BuildKiteJob;
import heartbeat.client.dto.pipeline.buildkite.DeployInfo;
import heartbeat.controller.report.dto.request.ExportCSVRequest;
import heartbeat.controller.report.dto.response.LeadTimeInfo;
import heartbeat.controller.report.dto.response.PipelineCSVInfo;

import java.util.List;

public class PipelineCsvFixture {

	public static List<PipelineCSVInfo> MOCK_PIPELINE_CSV_DATA() {
		PipelineCSVInfo pipelineCsvInfo = PipelineCSVInfo.builder()
			.pipeLineName("Heartbeat")
			.stepName(":rocket: Deploy prod")
			.buildInfo(BuildKiteBuildInfo.builder()
				.commit("713b31878c756c205a6c03eac5be3ac7c7e6a227")
				.pipelineCreateTime("2023-05-10T06:17:21.844Z")
				.number(880)
				.jobs(List.of(BuildKiteJob.builder()
					.name(":rocket: Deploy prod")
					.state("passed")
					.startedAt("2023-05-10T06:42:47.498Z")
					.finishedAt("2023-05-10T06:43:02.653Z")
					.build()))
				.build())
			.commitInfo(CommitInfo.builder()
				.commit(Commit.builder()
					.author(Author.builder()
						.name("XXXX")
						.email("XXX@test.com")
						.date("2023-05-10T06:43:02.653Z")
						.build())
					.committer(Committer.builder()
						.name("XXXX")
						.email("XXX@test.com")
						.date("2023-05-10T06:43:02.653Z")
						.build())
					.build())
				.build())
			.leadTimeInfo(LeadTimeInfo.builder()
				.firstCommitTimeInPr("2023-05-08T07:18:18Z")
				.totalTime("8379303")
				.prMergedTime("1683793037000")
				.prDelayTime("16837")
				.prCreatedTime("168369327000")
				.jobFinishTime("1684793037000")
				.pipelineDelayTime("653037000")
				.build())
			.deployInfo(DeployInfo.builder()
				.state("passed")
				.jobFinishTime("1684793037000")
				.jobStartTime("168369327000")
				.build())
			.build();
		return List.of(pipelineCsvInfo);
	}

	public static ExportCSVRequest MOCK_EXPORT_CSV_REQUEST() {
		return ExportCSVRequest.builder().dataType("pipeline").csvTimeStamp("1685010080107").build();
	}

	public static PipelineLeadTime MOCK_PIPELINE_LEAD_TIME_DATA() {
		return PipelineLeadTime.builder()
			.pipelineStep("xx")
			.pipelineName("xx")
			.leadTimes(List.of(LeadTime.builder()
				.commitId("xx")
				.prCreatedTime(1658549100000L)
				.prMergedTime(1658549160000L)
				.firstCommitTimeInPr(1658549100000L)
				.jobFinishTime(1658549160000L)
				.pipelineCreateTime(1658549100000L)
				.prDelayTime(60000L)
				.pipelineDelayTime(60000)
				.totalTime(120000)
				.build()))
			.build();

	}

}
