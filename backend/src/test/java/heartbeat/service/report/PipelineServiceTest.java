package heartbeat.service.report;

import heartbeat.client.dto.codebase.github.CommitInfo;
import heartbeat.client.dto.codebase.github.LeadTime;
import heartbeat.client.dto.codebase.github.PipelineLeadTime;
import heartbeat.client.dto.pipeline.buildkite.BuildKiteBuildInfo;
import heartbeat.client.dto.pipeline.buildkite.BuildKiteJob;
import heartbeat.client.dto.pipeline.buildkite.DeployInfo;
import heartbeat.client.dto.pipeline.buildkite.DeployTimes;
import heartbeat.controller.pipeline.dto.request.DeploymentEnvironment;
import heartbeat.controller.report.dto.request.BuildKiteSetting;
import heartbeat.controller.report.dto.request.CodebaseSetting;
import heartbeat.controller.report.dto.request.GenerateReportRequest;
import heartbeat.controller.report.dto.response.LeadTimeInfo;
import heartbeat.controller.report.dto.response.PipelineCSVInfo;
import heartbeat.service.pipeline.buildkite.BuildKiteService;
import heartbeat.service.report.calculator.model.FetchedData;
import heartbeat.service.source.github.GitHubService;
import org.assertj.core.util.Lists;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class PipelineServiceTest {

	@InjectMocks
	private PipelineService pipelineService;

	@Mock
	private BuildKiteService buildKiteService;

	@Mock
	private GitHubService gitHubService;

	@Nested
	class FetchGithubData {

		@Test
		void shouldReturnEmptyBuildInfosListAndEmptyLeadTimeWhenDeploymentEnvironmentsIsEmpty() {
			GenerateReportRequest request = GenerateReportRequest.builder()
				.buildKiteSetting(BuildKiteSetting.builder().deploymentEnvList(new ArrayList()).build())
				.metrics(new ArrayList<>())
				.build();
			FetchedData.BuildKiteData result = pipelineService.fetchGithubData(request);

			assertEquals(0, result.getBuildInfosList().size());
			verify(buildKiteService, never()).countDeployTimes(any(), any(), any(), any());
		}

		@Test
		void shouldReturnEmptyPipelineLeadTimeWhenCodebaseSettingIsEmpty() {
			GenerateReportRequest request = GenerateReportRequest.builder()
				.buildKiteSetting(BuildKiteSetting.builder().deploymentEnvList(new ArrayList()).build())
				.metrics(new ArrayList<>())
				.build();
			FetchedData.BuildKiteData result = pipelineService.fetchGithubData(request);

			assertEquals(0, result.getPipelineLeadTimes().size());
			verify(gitHubService, never()).fetchPipelinesLeadTime(any(), any(), any());
		}

		@Test
		void shouldGetPipelineLeadTimeFromGithubServiceAndBuildkiteServiceWhenCodebaseSettingIsNotEmpty() {
			List<BuildKiteBuildInfo> fakeBuildKiteBuildInfos = new ArrayList<>();
			String startTime = "startTime";
			String endTime = "endTime";
			String token = "token";
			GenerateReportRequest request = GenerateReportRequest.builder()
				.buildKiteSetting(BuildKiteSetting.builder()
					.deploymentEnvList(List.of(DeploymentEnvironment.builder().id("env1").repository("repo1").build(),
							DeploymentEnvironment.builder().id("env2").repository("repo2").build()))
					.build())
				.startTime(startTime)
				.endTime(endTime)
				.codebaseSetting(CodebaseSetting.builder().token(token).build())
				.metrics(new ArrayList<>())
				.build();

			when(buildKiteService.fetchPipelineBuilds(eq(token), any(), eq(startTime), eq(endTime)))
				.thenReturn(fakeBuildKiteBuildInfos);
			when(buildKiteService.countDeployTimes(any(), eq(fakeBuildKiteBuildInfos), eq(startTime), eq(endTime)))
				.thenReturn(DeployTimes.builder().build());
			when(gitHubService.fetchPipelinesLeadTime(any(), any(), eq(token)))
				.thenReturn(List.of(PipelineLeadTime.builder().build()));

			FetchedData.BuildKiteData result = pipelineService.fetchGithubData(request);

			assertEquals(1, result.getPipelineLeadTimes().size());
			assertEquals(2, result.getBuildInfosList().size());
			assertEquals(2, result.getDeployTimesList().size());
			verify(buildKiteService, times(2)).countDeployTimes(any(), any(), any(), any());
			verify(buildKiteService, times(2)).countDeployTimes(any(), any(), any(), any());
			verify(gitHubService, times(1)).fetchPipelinesLeadTime(any(), any(), eq(token));
		}

		@Test
		void shouldFilterAuthorByInputCrews() {
			List<BuildKiteBuildInfo> fakeBuildKiteBuildInfos = List.of(
					BuildKiteBuildInfo.builder()
						.author(BuildKiteBuildInfo.Author.builder().name("test-author1").build())
						.build(),
					BuildKiteBuildInfo.builder()
						.author(BuildKiteBuildInfo.Author.builder().name("test-author2").build())
						.build());
			String startTime = "startTime";
			String endTime = "endTime";
			String token = "token";
			GenerateReportRequest request = GenerateReportRequest.builder()
				.buildKiteSetting(BuildKiteSetting.builder()
					.deploymentEnvList(List.of(DeploymentEnvironment.builder().id("env1").repository("repo1").build()))
					.pipelineCrews(List.of("test-author1"))
					.build())
				.startTime(startTime)
				.endTime(endTime)
				.codebaseSetting(CodebaseSetting.builder().token(token).build())
				.metrics(new ArrayList<>())
				.build();

			when(buildKiteService.fetchPipelineBuilds(eq(token), any(), eq(startTime), eq(endTime)))
				.thenReturn(fakeBuildKiteBuildInfos);
			when(buildKiteService.countDeployTimes(any(), eq(fakeBuildKiteBuildInfos), eq(startTime), eq(endTime)))
				.thenReturn(DeployTimes.builder().build());
			when(gitHubService.fetchPipelinesLeadTime(any(), any(), eq(token)))
				.thenReturn(List.of(PipelineLeadTime.builder().build()));

			FetchedData.BuildKiteData result = pipelineService.fetchGithubData(request);

			assertEquals(1, result.getPipelineLeadTimes().size());
			assertEquals(1, result.getBuildInfosList().size());
			assertEquals(0, result.getBuildInfosList().get(0).getValue().size());
			assertEquals(1, result.getDeployTimesList().size());
			verify(buildKiteService, times(1)).fetchPipelineBuilds(any(), any(), any(), any());
			verify(buildKiteService, times(1)).countDeployTimes(any(), any(), any(), any());
			verify(gitHubService, times(1)).fetchPipelinesLeadTime(any(), any(), eq(token));
		}

	}

	@Nested
	class FetchBuildKiteInfo {

		@Test
		void shouldReturnEmptyWhenDeploymentEnvListIsEmpty() {
			GenerateReportRequest request = GenerateReportRequest.builder()
				.buildKiteSetting(BuildKiteSetting.builder().deploymentEnvList(new ArrayList()).build())
				.metrics(new ArrayList<>())
				.build();
			FetchedData.BuildKiteData result = pipelineService.fetchBuildKiteInfo(request);

			assertEquals(0, result.getDeployTimesList().size());
			assertEquals(0, result.getBuildInfosList().size());
			verify(buildKiteService, never()).fetchPipelineBuilds(any(), any(), any(), any());
			verify(buildKiteService, never()).countDeployTimes(any(), any(), any(), any());
		}

		@Test
		void shouldReturnValueWhenDeploymentEnvListIsNotEmpty() {
			List<BuildKiteBuildInfo> fakeBuildKiteBuildInfos = List.of(BuildKiteBuildInfo.builder()
				.author(BuildKiteBuildInfo.Author.builder().name("someone").build())
				.build());
			String startTime = "startTime";
			String endTime = "endTime";
			String token = "token";
			GenerateReportRequest request = GenerateReportRequest.builder()
				.buildKiteSetting(BuildKiteSetting.builder()
					.token(token)
					.pipelineCrews(List.of("someone"))
					.deploymentEnvList(List.of(DeploymentEnvironment.builder().id("env1").repository("repo1").build()))
					.build())
				.metrics(new ArrayList<>())
				.startTime(startTime)
				.endTime(endTime)
				.build();

			when(buildKiteService.fetchPipelineBuilds(eq(token), any(), eq(startTime), eq(endTime)))
				.thenReturn(fakeBuildKiteBuildInfos);
			when(buildKiteService.countDeployTimes(any(), eq(fakeBuildKiteBuildInfos), eq(startTime), eq(endTime)))
				.thenReturn(DeployTimes.builder().build());

			FetchedData.BuildKiteData result = pipelineService.fetchBuildKiteInfo(request);

			assertEquals(result.getDeployTimesList().size(), 1);
			assertEquals(result.getBuildInfosList().size(), 1);
			verify(buildKiteService, times(1)).fetchPipelineBuilds(any(), any(), any(), any());
			verify(buildKiteService, times(1)).countDeployTimes(any(), any(), any(), any());
		}

		@Test
		void shouldFilterAuthorByInputCrews() {
			List<BuildKiteBuildInfo> fakeBuildKiteBuildInfos = List.of(
					BuildKiteBuildInfo.builder()
						.author(BuildKiteBuildInfo.Author.builder().name("test-author1").build())
						.build(),
					BuildKiteBuildInfo.builder()
						.author(BuildKiteBuildInfo.Author.builder().name("test-author2").build())
						.build());
			String startTime = "startTime";
			String endTime = "endTime";
			String token = "token";
			GenerateReportRequest request = GenerateReportRequest.builder()
				.buildKiteSetting(BuildKiteSetting.builder()
					.deploymentEnvList(List.of(DeploymentEnvironment.builder().id("env1").repository("repo1").build()))
					.pipelineCrews(List.of("test-author1"))
					.build())
				.startTime(startTime)
				.endTime(endTime)
				.codebaseSetting(CodebaseSetting.builder().token(token).build())
				.metrics(new ArrayList<>())
				.build();

			when(buildKiteService.fetchPipelineBuilds(eq(token), any(), eq(startTime), eq(endTime)))
				.thenReturn(fakeBuildKiteBuildInfos);
			when(buildKiteService.countDeployTimes(any(), eq(fakeBuildKiteBuildInfos), eq(startTime), eq(endTime)))
				.thenReturn(DeployTimes.builder().build());

			FetchedData.BuildKiteData result = pipelineService.fetchBuildKiteInfo(request);

			assertEquals(1, result.getBuildInfosList().size());
			assertEquals(0, result.getBuildInfosList().get(0).getValue().size());
			assertEquals(1, result.getDeployTimesList().size());
			verify(buildKiteService, times(1)).fetchPipelineBuilds(any(), any(), any(), any());
			verify(buildKiteService, times(1)).countDeployTimes(any(), any(), any(), any());
		}

	}

	@Nested
	class GenerateCSVForPipelineWithCodebase {

		@Test
		void shouldReturnEmptyWhenDeploymentEnvironmentsIsEmpty() {
			String startTime = "startTime";
			String endTime = "endTime";
			List<PipelineCSVInfo> result = pipelineService.generateCSVForPipelineWithCodebase(
					CodebaseSetting.builder().build(), startTime, endTime, FetchedData.BuildKiteData.builder().build(),
					Lists.list());

			assertEquals(0, result.size());
			verify(buildKiteService, never()).getPipelineStepNames(any());
		}

		@Test
		void shouldReturnEmptyWhenNoBuildInfoFoundForDeploymentEnvironment() {
			String startTime = "startTime";
			String endTime = "endTime";
			List<PipelineCSVInfo> result = pipelineService.generateCSVForPipelineWithCodebase(
					CodebaseSetting.builder().build(), startTime, endTime,
					FetchedData.BuildKiteData.builder().buildInfosList(List.of(Map.entry("env1", List.of()))).build(),
					List.of(DeploymentEnvironment.builder().id("env1").build()));

			assertEquals(0, result.size());
			verify(buildKiteService, never()).getPipelineStepNames(any());
		}

		@Test
		void shouldReturnEmptyWhenPipelineStepsIsEmpty() {
			String startTime = "startTime";
			String endTime = "endTime";
			List<BuildKiteBuildInfo> kiteBuildInfos = List.of(BuildKiteBuildInfo.builder().build());
			when(buildKiteService.getPipelineStepNames(eq(kiteBuildInfos))).thenReturn(List.of());

			List<PipelineCSVInfo> result = pipelineService.generateCSVForPipelineWithCodebase(
					CodebaseSetting.builder().build(), startTime, endTime,
					FetchedData.BuildKiteData.builder()
						.buildInfosList(List.of(Map.entry("env1", kiteBuildInfos)))
						.build(),
					List.of(DeploymentEnvironment.builder().id("env1").build()));

			assertEquals(0, result.size());
			verify(buildKiteService, times(1)).getPipelineStepNames(any());
		}

		@Test
		void shouldReturnEmptyWhenBuildJobIsEmpty() {
			String startTime = "startTime";
			String endTime = "endTime";
			List<BuildKiteBuildInfo> kiteBuildInfos = List.of(BuildKiteBuildInfo.builder().build());
			when(buildKiteService.getPipelineStepNames(eq(kiteBuildInfos))).thenReturn(List.of("check"));
			when(buildKiteService.getBuildKiteJob(any(), any(), any(), eq(startTime), eq(endTime))).thenReturn(null);
			when(buildKiteService.getStepsBeforeEndStep(any(), any())).thenReturn(List.of("check"));
			List<PipelineCSVInfo> result = pipelineService.generateCSVForPipelineWithCodebase(
					CodebaseSetting.builder().build(), startTime, endTime,
					FetchedData.BuildKiteData.builder()
						.buildInfosList(List.of(Map.entry("env1", kiteBuildInfos)))
						.build(),
					List.of(DeploymentEnvironment.builder().id("env1").build()));

			assertEquals(0, result.size());
			verify(buildKiteService, times(1)).getPipelineStepNames(any());
			verify(buildKiteService, times(1)).getBuildKiteJob(any(), any(), any(), eq(startTime), eq(endTime));
		}

		@Test
		void shouldFilterOutInvalidBuildOfCommentIsEmtpy() {
			String startTime = "startTime";
			String endTime = "endTime";
			List<BuildKiteBuildInfo> kiteBuildInfos = List.of(BuildKiteBuildInfo.builder().commit("").build());
			when(buildKiteService.getPipelineStepNames(eq(kiteBuildInfos))).thenReturn(List.of("check"));
			when(buildKiteService.getStepsBeforeEndStep(any(), any())).thenReturn(List.of("check"));
			when(buildKiteService.getBuildKiteJob(any(), any(), any(), eq(startTime), eq(endTime)))
				.thenReturn(BuildKiteJob.builder().build());

			List<PipelineCSVInfo> result = pipelineService.generateCSVForPipelineWithCodebase(
					CodebaseSetting.builder().build(), startTime, endTime,
					FetchedData.BuildKiteData.builder()
						.buildInfosList(List.of(Map.entry("env1", kiteBuildInfos)))
						.build(),
					List.of(DeploymentEnvironment.builder().id("env1").build()));

			assertEquals(0, result.size());
			verify(buildKiteService, times(1)).getPipelineStepNames(any());
			verify(buildKiteService, times(1)).getBuildKiteJob(any(), any(), any(), any(), any());
		}

		@Test
		void shouldGenerateValueWithoutCommitWhenCodebaseSettingIsEmpty() {
			String startTime = "startTime";
			String endTime = "endTime";
			List<BuildKiteBuildInfo> kiteBuildInfos = List.of(BuildKiteBuildInfo.builder().commit("commit").build());
			when(buildKiteService.getPipelineStepNames(eq(kiteBuildInfos))).thenReturn(List.of("check"));
			when(buildKiteService.getStepsBeforeEndStep(any(), any())).thenReturn(List.of("check"));
			when(buildKiteService.getBuildKiteJob(any(), any(), any(), eq(startTime), eq(endTime)))
				.thenReturn(BuildKiteJob.builder().build());
			when(buildKiteService.mapToDeployInfo(any(), any(), any(), eq(startTime), eq(endTime)))
				.thenReturn(DeployInfo.builder().jobName("test").build());

			List<PipelineCSVInfo> result = pipelineService.generateCSVForPipelineWithCodebase(null, startTime, endTime,
					FetchedData.BuildKiteData.builder()
						.buildInfosList(List.of(Map.entry("env1", kiteBuildInfos)))
						.build(),
					List.of(DeploymentEnvironment.builder().id("env1").build()));

			assertEquals(1, result.size());
			assertEquals(null, result.get(0).getCommitInfo());
			verify(buildKiteService, times(1)).getPipelineStepNames(any());
			verify(buildKiteService, times(1)).getBuildKiteJob(any(), any(), any(), any(), any());
		}

		@Test
		void shouldGenerateValueWithoutCommitWhenCodebaseSettingTokenIsEmpty() {
			String startTime = "startTime";
			String endTime = "endTime";
			List<BuildKiteBuildInfo> kiteBuildInfos = List.of(BuildKiteBuildInfo.builder().commit("commit").build());
			when(buildKiteService.getPipelineStepNames(eq(kiteBuildInfos))).thenReturn(List.of("check"));
			when(buildKiteService.getStepsBeforeEndStep(any(), any())).thenReturn(List.of("check"));
			when(buildKiteService.getBuildKiteJob(any(), any(), any(), eq(startTime), eq(endTime)))
				.thenReturn(BuildKiteJob.builder().build());
			when(buildKiteService.mapToDeployInfo(any(), any(), any(), eq(startTime), eq(endTime)))
				.thenReturn(DeployInfo.builder().jobName("test").build());

			List<PipelineCSVInfo> result = pipelineService.generateCSVForPipelineWithCodebase(
					CodebaseSetting.builder().build(), startTime, endTime,
					FetchedData.BuildKiteData.builder()
						.buildInfosList(List.of(Map.entry("env1", kiteBuildInfos)))
						.build(),
					List.of(DeploymentEnvironment.builder().id("env1").build()));

			assertEquals(1, result.size());
			assertEquals(null, result.get(0).getCommitInfo());
			verify(buildKiteService, times(1)).getPipelineStepNames(any());
			verify(buildKiteService, times(1)).getBuildKiteJob(any(), any(), any(), any(), any());
		}

		@Test
		void shouldGenerateValueWithoutCommitWhenCommitIdIsEmpty() {
			String startTime = "startTime";
			String endTime = "endTime";
			List<BuildKiteBuildInfo> kiteBuildInfos = List.of(BuildKiteBuildInfo.builder().commit("commit").build());
			when(buildKiteService.getPipelineStepNames(eq(kiteBuildInfos))).thenReturn(List.of("check"));
			when(buildKiteService.getStepsBeforeEndStep(any(), any())).thenReturn(List.of("check"));
			when(buildKiteService.getBuildKiteJob(any(), any(), any(), eq(startTime), eq(endTime)))
				.thenReturn(BuildKiteJob.builder().build());
			when(buildKiteService.mapToDeployInfo(any(), any(), any(), eq(startTime), eq(endTime)))
				.thenReturn(DeployInfo.builder().jobName("test").build());

			List<PipelineCSVInfo> result = pipelineService.generateCSVForPipelineWithCodebase(
					CodebaseSetting.builder().token("token").build(), startTime, endTime,
					FetchedData.BuildKiteData.builder()
						.buildInfosList(List.of(Map.entry("env1", kiteBuildInfos)))
						.build(),
					List.of(DeploymentEnvironment.builder().id("env1").build()));

			assertEquals(1, result.size());
			assertEquals(null, result.get(0).getCommitInfo());
			verify(buildKiteService, times(1)).getPipelineStepNames(any());
			verify(buildKiteService, times(1)).getBuildKiteJob(any(), any(), any(), any(), any());
		}

		@Test
		void shouldGenerateValueHasCommit() {
			String startTime = "startTime";
			String endTime = "endTime";
			List<BuildKiteBuildInfo> kiteBuildInfos = List.of(BuildKiteBuildInfo.builder().commit("commit").build());
			CommitInfo fakeCommitInfo = CommitInfo.builder().build();
			when(buildKiteService.getPipelineStepNames(eq(kiteBuildInfos))).thenReturn(List.of("check"));
			when(buildKiteService.getStepsBeforeEndStep(any(), any())).thenReturn(List.of("check"));
			when(buildKiteService.getBuildKiteJob(any(), any(), any(), eq(startTime), eq(endTime)))
				.thenReturn(BuildKiteJob.builder().build());
			DeployInfo fakeDeploy = DeployInfo.builder().commitId("commitId").jobName("test").build();
			when(buildKiteService.mapToDeployInfo(any(), any(), any(), any(), any())).thenReturn(fakeDeploy);
			when(gitHubService.fetchCommitInfo(any(), any(), any())).thenReturn(fakeCommitInfo);

			List<PipelineCSVInfo> result = pipelineService.generateCSVForPipelineWithCodebase(
					CodebaseSetting.builder().token("token").build(), startTime, endTime,
					FetchedData.BuildKiteData.builder()
						.buildInfosList(List.of(Map.entry("env1", kiteBuildInfos)))
						.build(),
					List.of(DeploymentEnvironment.builder().id("env1").name("env-name").build()));

			assertEquals(1, result.size());
			PipelineCSVInfo pipelineCSVInfo = result.get(0);
			assertEquals("env-name", pipelineCSVInfo.getPipeLineName());
			assertEquals(fakeCommitInfo, pipelineCSVInfo.getCommitInfo());
			assertEquals(fakeDeploy, pipelineCSVInfo.getDeployInfo());
			verify(buildKiteService, times(1)).getPipelineStepNames(any());
			verify(buildKiteService, times(1)).getBuildKiteJob(any(), any(), any(), any(), any());
		}

		@Test
		void shouldGenerateValueWithLeadTimeWhenLeadTimeExisting() {
			String startTime = "startTime";
			String endTime = "endTime";
			List<BuildKiteBuildInfo> kiteBuildInfos = List.of(BuildKiteBuildInfo.builder().commit("commit").build());
			CommitInfo fakeCommitInfo = CommitInfo.builder().build();
			when(buildKiteService.getPipelineStepNames(eq(kiteBuildInfos))).thenReturn(List.of("check"));
			when(buildKiteService.getStepsBeforeEndStep(any(), any())).thenReturn(List.of("check"));
			when(buildKiteService.getBuildKiteJob(any(), any(), any(), eq(startTime), eq(endTime)))
				.thenReturn(BuildKiteJob.builder().build());
			DeployInfo fakeDeploy = DeployInfo.builder().commitId("commitId").jobName("test").build();
			when(buildKiteService.mapToDeployInfo(any(), any(), any(), any(), any())).thenReturn(fakeDeploy);
			when(gitHubService.fetchCommitInfo(any(), any(), any())).thenReturn(fakeCommitInfo);

			List<PipelineCSVInfo> result = pipelineService.generateCSVForPipelineWithCodebase(
					CodebaseSetting.builder().token("token").build(), startTime, endTime,
					FetchedData.BuildKiteData.builder()
						.pipelineLeadTimes(List.of(PipelineLeadTime.builder()
							.leadTimes(List.of(LeadTime.builder().commitId("commitId").build()))
							.pipelineName("env-name")
							.build()))
						.buildInfosList(List.of(Map.entry("env1", kiteBuildInfos)))
						.build(),
					List.of(DeploymentEnvironment.builder().id("env1").name("env-name").build()));

			assertEquals(1, result.size());
			PipelineCSVInfo pipelineCSVInfo = result.get(0);
			assertEquals("env-name", pipelineCSVInfo.getPipeLineName());
			assertEquals(fakeCommitInfo, pipelineCSVInfo.getCommitInfo());
			assertEquals(fakeDeploy, pipelineCSVInfo.getDeployInfo());
			verify(buildKiteService, times(1)).getPipelineStepNames(any());
			verify(buildKiteService, times(1)).getBuildKiteJob(any(), any(), any(), any(), any());
		}

	}

}
