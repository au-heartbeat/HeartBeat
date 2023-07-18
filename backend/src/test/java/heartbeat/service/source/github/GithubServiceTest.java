package heartbeat.service.source.github;

import heartbeat.client.GitHubFeignClient;
import heartbeat.client.dto.codebase.github.Author;
import heartbeat.client.dto.codebase.github.Commit;
import heartbeat.client.dto.codebase.github.CommitInfo;
import heartbeat.client.dto.codebase.github.Committer;
import heartbeat.client.dto.codebase.github.GitHubOrganizationsInfo;
import heartbeat.client.dto.codebase.github.GitHubRepo;
import heartbeat.client.dto.codebase.github.LeadTime;
import heartbeat.client.dto.codebase.github.PipelineLeadTime;
import heartbeat.client.dto.codebase.github.PullRequestInfo;
import heartbeat.client.dto.pipeline.buildkite.DeployInfo;
import heartbeat.client.dto.pipeline.buildkite.DeployTimes;
import heartbeat.exception.InternalServerErrorException;
import heartbeat.exception.RateLimitExceededException;
import heartbeat.exception.UnauthorizedException;
import heartbeat.service.source.github.model.PipelineInfoOfRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletionException;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GithubServiceTest {

	@Mock
	GitHubFeignClient gitHubFeignClient;

	@InjectMocks
	GitHubService githubService;

	@Mock
	PullRequestInfo pullRequestInfo;

	@Mock
	PipelineInfoOfRepository pipelineInfoOfRepository;

	@Mock
	DeployInfo deployInfo;

	@Mock
	CommitInfo commitInfo;

	@Mock
	List<DeployTimes> deployTimes;

	@Mock
	List<PipelineLeadTime> pipelineLeadTimes;

	@Mock
	Map<String, String> repositoryMap;

	ThreadPoolTaskExecutor executor;

	@BeforeEach
	public void setUp() {
		githubService = new GitHubService(executor = getTaskExecutor(), gitHubFeignClient);
		pullRequestInfo = PullRequestInfo.builder()
			.mergedAt("2022-07-23T04:04:00.000+00:00")
			.createdAt("2022-07-23T04:03:00.000+00:00")
			.number(1)
			.build();
		deployInfo = DeployInfo.builder()
			.commitId("111")
			.pipelineCreateTime("2022-07-23T04:05:00.000+00:00")
			.jobStartTime("2022-07-23T04:04:00.000+00:00")
			.jobFinishTime("2022-07-23T04:06:00.000+00:00")
			.state("passed")
			.build();
		commitInfo = CommitInfo.builder()
			.commit(Commit.builder()
				.committer(Committer.builder().date("2022-07-23T04:03:00.000+00:00").build())
				.build())
			.build();

		deployTimes = List.of(DeployTimes.builder()
			.pipelineId("fs-platform-onboarding")
			.pipelineName("Name")
			.pipelineStep("Step")
			.passed(List.of(DeployInfo.builder()
				.pipelineCreateTime("2022-07-23T04:05:00.000+00:00")
				.jobStartTime("2022-07-23T04:04:00.000+00:00")
				.jobFinishTime("2022-07-23T04:06:00.000+00:00")
				.commitId("111")
				.state("passed")
				.build()))
			.build());

		pipelineLeadTimes = List.of(PipelineLeadTime.builder()
			.pipelineName("Name")
			.pipelineStep("Step")
			.leadTimes(List.of(LeadTime.builder()
				.commitId("111")
				.prCreatedTime(1658548980000L)
				.prMergedTime(1658549040000L)
				.firstCommitTimeInPr(1658548980000L)
				.jobFinishTime(1658549160000L)
				.pipelineDelayTime(1658549100000L)
				.pipelineCreateTime(1658549100000L)
				.prDelayTime(60000L)
				.pipelineDelayTime(120000)
				.totalTime(180000)
				.build()))
			.build());

		repositoryMap = new HashMap<>();
		repositoryMap.put("fs-platform-payment-selector", "https://github.com/XXXX-fs/fs-platform-onboarding");
		repositoryMap.put("fs-platform-onboarding", "https://github.com/XXXX-fs/fs-platform-onboarding");

		pipelineInfoOfRepository = PipelineInfoOfRepository.builder()
			.repository("https://github.com/XXXX-fs/fs-platform-onboarding")
			.passedDeploy(deployTimes.get(0).getPassed())
			.pipelineStep(deployTimes.get(0).getPipelineStep())
			.pipelineName(deployTimes.get(0).getPipelineName())
			.build();
	}

	@AfterEach
	public void tearDown() {
		executor.shutdown();
	}

	public ThreadPoolTaskExecutor getTaskExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(10);
		executor.setMaxPoolSize(100);
		executor.setQueueCapacity(500);
		executor.setKeepAliveSeconds(60);
		executor.setThreadNamePrefix("Heartbeat-");
		executor.initialize();
		return executor;
	}

	@Test
	void shouldReturnNonRedundantGithubReposWhenCallGithubFeignClientApi() {
		String githubToken = "123456";
		String token = "token " + githubToken;
		when(gitHubFeignClient.getAllRepos(token)).thenReturn(List.of(GitHubRepo.builder().htmlUrl("11111").build(),
				GitHubRepo.builder().htmlUrl("22222").build(), GitHubRepo.builder().htmlUrl("33333").build()));

		when(gitHubFeignClient.getGithubOrganizationsInfo(token))
			.thenReturn(List.of(GitHubOrganizationsInfo.builder().login("org1").build(),
					GitHubOrganizationsInfo.builder().login("org2").build()));

		when(gitHubFeignClient.getReposByOrganizationName("org1", token))
			.thenReturn(List.of(GitHubRepo.builder().htmlUrl("22222").build(),
					GitHubRepo.builder().htmlUrl("33333").build(), GitHubRepo.builder().htmlUrl("44444").build()));

		final var response = githubService.verifyToken(githubToken);
		githubService.shutdownExecutor();
		assertThat(response.getGithubRepos()).hasSize(4);
		assertThat(response.getGithubRepos())
			.isEqualTo(new LinkedHashSet<>(List.of("11111", "22222", "33333", "44444")));
	}

	@Test
	void shouldReturnUnauthorizedStatusWhenCallGithubFeignClientApiWithWrongToken() {
		String wrongGithubToken = "123456";
		String token = "token " + wrongGithubToken;

		when(gitHubFeignClient.getAllRepos(token))
			.thenThrow(new CompletionException(new UnauthorizedException("Bad credentials")));

		assertThatThrownBy(() -> githubService.verifyToken(wrongGithubToken)).isInstanceOf(UnauthorizedException.class)
			.hasMessageContaining("Bad credentials");
	}

	@Test
    void shouldThrowExceptionWhenVerifyGitHubThrowUnExpectedException() {

        when(gitHubFeignClient.getAllRepos(anyString()))
                .thenThrow(new CompletionException(new Exception("UnExpected Exception")));
        when(gitHubFeignClient.getGithubOrganizationsInfo(anyString()))
                .thenThrow(new CompletionException(new Exception("UnExpected Exception")));
        when(gitHubFeignClient.getReposByOrganizationName(anyString(), anyString()))
                .thenThrow(new CompletionException(new Exception("UnExpected Exception")));

        assertThatThrownBy(() -> githubService.verifyToken("mockToken")).isInstanceOf(InternalServerErrorException.class)
                .hasMessageContaining("UnExpected Exception");
    }

	@Test
	void shouldReturnNullWhenMergeTimeIsNull() {
		PullRequestInfo pullRequestInfo = PullRequestInfo.builder().build();
		DeployInfo deployInfo = DeployInfo.builder().build();
		CommitInfo commitInfo = CommitInfo.builder().build();
		LeadTime result = githubService.mapLeadTimeWithInfo(pullRequestInfo, deployInfo, commitInfo);

		assertNull(result);
	}

	@Test
	void shouldReturnLeadTimeWhenMergedTimeIsNotNull() {
		LeadTime result = githubService.mapLeadTimeWithInfo(pullRequestInfo, deployInfo, commitInfo);
		LeadTime expect = LeadTime.builder()
			.commitId("111")
			.prCreatedTime(1658548980000L)
			.prMergedTime(1658549040000L)
			.firstCommitTimeInPr(1658548980000L)
			.jobFinishTime(1658549160000L)
			.pipelineDelayTime(1658549100000L)
			.pipelineCreateTime(1658549100000L)
			.prDelayTime(60000L)
			.pipelineDelayTime(120000)
			.totalTime(180000)
			.build();

		assertEquals(expect, result);
	}

	@Test
	void CommitTimeInPrShouldBeZeroWhenCommitInfoIsNull() {
		commitInfo = CommitInfo.builder().build();
		LeadTime result = githubService.mapLeadTimeWithInfo(pullRequestInfo, deployInfo, commitInfo);
		LeadTime expect = LeadTime.builder()
			.commitId("111")
			.prCreatedTime(1658548980000L)
			.prMergedTime(1658549040000L)
			.firstCommitTimeInPr(0L)
			.jobFinishTime(1658549160000L)
			.pipelineDelayTime(1658549100000L)
			.pipelineCreateTime(1658549100000L)
			.prDelayTime(60000L)
			.pipelineDelayTime(120000)
			.totalTime(180000)
			.build();

		assertEquals(expect, result);
	}

	@Test
	void shouldReturnFirstCommitTimeInPrZeroWhenCommitInfoIsNull() {
		commitInfo = CommitInfo.builder().build();
		LeadTime result = githubService.mapLeadTimeWithInfo(pullRequestInfo, deployInfo, commitInfo);
		LeadTime expect = LeadTime.builder()
			.commitId("111")
			.prCreatedTime(1658548980000L)
			.prMergedTime(1658549040000L)
			.firstCommitTimeInPr(0L)
			.jobFinishTime(1658549160000L)
			.pipelineDelayTime(1658549100000L)
			.pipelineCreateTime(1658549100000L)
			.prDelayTime(60000L)
			.pipelineDelayTime(120000)
			.totalTime(180000L)
			.build();

		assertEquals(expect, result);
	}

	@Test
	void shouldReturnPipeLineLeadTimeWhenDeployITimesIsNotEmpty() {
		String mockToken = "mockToken";

		when(gitHubFeignClient.getPullRequestListInfo(any(), any(), any())).thenReturn(List.of(pullRequestInfo));

		when(gitHubFeignClient.getPullRequestCommitInfo(any(), any(), any())).thenReturn(List.of(commitInfo));
		List<PipelineLeadTime> result = githubService.fetchPipelinesLeadTime(deployTimes, repositoryMap, mockToken);

		assertEquals(pipelineLeadTimes, result);
	}

	@Test
	void shouldReturnEmptyLeadTimeWhenDeployTimesIsEmpty() {
		String mockToken = "mockToken";

		when(gitHubFeignClient.getPullRequestListInfo(any(), any(), any())).thenReturn(List.of(pullRequestInfo));

		when(gitHubFeignClient.getPullRequestCommitInfo(any(), any(), any())).thenReturn(List.of(commitInfo));
		List<DeployTimes> emptyDeployTimes = List.of(DeployTimes.builder().build());
		List<PipelineLeadTime> result = githubService.fetchPipelinesLeadTime(emptyDeployTimes, repositoryMap,
				mockToken);
		List<PipelineLeadTime> expect = List.of(PipelineLeadTime.builder().build());

		assertEquals(expect, result);
	}

	@Test
	void shouldReturnEmptyMergeLeadTimeWhenPullRequestInfoIsEmpty() {
		String mockToken = "mockToken";

		when(gitHubFeignClient.getPullRequestListInfo(any(), any(), any())).thenReturn(List.of());

		when(gitHubFeignClient.getPullRequestCommitInfo(any(), any(), any())).thenReturn(List.of());
		List<PipelineLeadTime> result = githubService.fetchPipelinesLeadTime(deployTimes, repositoryMap, mockToken);

		List<PipelineLeadTime> expect = List.of(PipelineLeadTime.builder()
			.pipelineStep("Step")
			.pipelineName("Name")
			.leadTimes(List.of(LeadTime.builder()
				.commitId("111")
				.jobFinishTime(1658549160000L)
				.pipelineCreateTime(1658549100000L)
				.prDelayTime(0L)
				.pipelineDelayTime(120000)
				.totalTime(120000)
				.build()))
			.build());

		assertEquals(expect, result);
	}

	@Test
	void shouldReturnEmptyMergeLeadTimeWhenMergeTimeIsEmpty() {
		String mockToken = "mockToken";
		pullRequestInfo.setMergedAt(null);
		when(gitHubFeignClient.getPullRequestListInfo(any(), any(), any())).thenReturn(List.of(pullRequestInfo));

		when(gitHubFeignClient.getPullRequestCommitInfo(any(), any(), any())).thenReturn(List.of());
		List<PipelineLeadTime> result = githubService.fetchPipelinesLeadTime(deployTimes, repositoryMap, mockToken);

		List<PipelineLeadTime> expect = List.of(PipelineLeadTime.builder()
			.pipelineStep("Step")
			.pipelineName("Name")
			.leadTimes(List.of(LeadTime.builder()
				.commitId("111")
				.jobFinishTime(1658549160000L)
				.pipelineCreateTime(1658549100000L)
				.prDelayTime(0L)
				.pipelineDelayTime(120000)
				.totalTime(120000)
				.build()))
			.build());

		assertEquals(expect, result);
	}

	@Test
	void shouldThrowExceptionIfGetPullRequestListInfoHasExceptionWhenFetchPipelinesLeadTime() {
		String mockToken = "mockToken";
		pullRequestInfo.setMergedAt(null);
		when(gitHubFeignClient.getPullRequestListInfo(any(), any(), any()))
			.thenThrow(new CompletionException(new Exception("UnExpected Exception")));
		when(gitHubFeignClient.getPullRequestCommitInfo(any(), any(), any())).thenReturn(List.of());

		assertThatThrownBy(() -> githubService.fetchPipelinesLeadTime(deployTimes, repositoryMap, mockToken))
			.isInstanceOf(InternalServerErrorException.class)
			.hasMessageContaining("UnExpected Exception");
	}

	@Test
	void shouldThrowCompletableExceptionIfGetPullRequestListInfoHasExceptionWhenFetchPipelinesLeadTime() {
		String mockToken = "mockToken";
		pullRequestInfo.setMergedAt(null);
		when(gitHubFeignClient.getPullRequestListInfo(any(), any(), any()))
			.thenThrow(new CompletionException(new UnauthorizedException("Bad credentials")));
		when(gitHubFeignClient.getPullRequestCommitInfo(any(), any(), any())).thenReturn(List.of());

		assertThatThrownBy(() -> githubService.fetchPipelinesLeadTime(deployTimes, repositoryMap, mockToken))
			.isInstanceOf(UnauthorizedException.class)
			.hasMessageContaining("Bad credentials");
	}

	@Test
	public void shouldFetchCommitInfo() {
		CommitInfo commitInfo = CommitInfo.builder()
			.commit(Commit.builder()
				.author(Author.builder().name("XXXX").email("XXX@test.com").date("2023-05-10T06:43:02.653Z").build())
				.committer(
						Committer.builder().name("XXXX").email("XXX@test.com").date("2023-05-10T06:43:02.653Z").build())
				.build())
			.build();
		when(gitHubFeignClient.getCommitInfo(anyString(), anyString(), anyString())).thenReturn(commitInfo);

		CommitInfo result = githubService.fetchCommitInfo("12344", "org/repo", "mockToken");

		assertEquals(result, commitInfo);
	}

	@Test
    public void shouldThrowRateLimitExceededExceptionWhenFetchCommitInfoRateLimit() {
        when(gitHubFeignClient.getCommitInfo(anyString(), anyString(), anyString()))
                .thenThrow(new RateLimitExceededException("request forbidden"));

        assertThatThrownBy(() -> githubService.fetchCommitInfo("12344", "org/repo", "mockToken"))
                .isInstanceOf(RateLimitExceededException.class)
                .hasMessageContaining("request forbidden");
    }

	@Test
	public void shouldThrowInternalServerErrorExceptionWhenFetchCommitInfo500Exception() {
		CommitInfo commitInfo = CommitInfo.builder()
			.commit(Commit.builder()
				.author(Author.builder().name("XXXX").email("XXX@test.com").date("2023-05-10T06:43:02.653Z").build())
				.committer(
						Committer.builder().name("XXXX").email("XXX@test.com").date("2023-05-10T06:43:02.653Z").build())
				.build())
			.build();

		when(gitHubFeignClient.getCommitInfo(anyString(), anyString(), anyString())).thenReturn(commitInfo);

		assertThatThrownBy(() -> githubService.fetchCommitInfo("12344", "org/repo", ""))
			.isInstanceOf(InternalServerErrorException.class)
			.hasMessageContaining("Failed to get commit info_repositoryId");
	}

}
