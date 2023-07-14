package heartbeat.service.source.github;

import heartbeat.client.GitHubFeignClient;
import heartbeat.client.dto.codebase.github.CommitInfo;
import heartbeat.client.dto.codebase.github.GitHubOrganizationsInfo;
import heartbeat.client.dto.codebase.github.GitHubRepo;
import heartbeat.client.dto.codebase.github.LeadTime;
import heartbeat.client.dto.codebase.github.PipelineLeadTime;
import heartbeat.client.dto.codebase.github.PullRequestInfo;
import heartbeat.client.dto.pipeline.buildkite.DeployInfo;
import heartbeat.client.dto.pipeline.buildkite.DeployTimes;
import heartbeat.controller.source.dto.GitHubResponse;
import heartbeat.exception.BaseException;
import heartbeat.exception.InternalServerErrorException;
import heartbeat.service.source.github.model.PipelineInfoOfRepository;
import heartbeat.util.GithubUtil;
import heartbeat.util.TokenUtil;
import jakarta.annotation.PreDestroy;

import java.time.Instant;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Log4j2
public class GitHubService {

	private final ThreadPoolTaskExecutor customTaskExecutor;

	private final GitHubFeignClient gitHubFeignClient;

	@PreDestroy
	public void shutdownExecutor() {
		customTaskExecutor.shutdown();
	}

	public GitHubResponse verifyToken(String githubToken) {
		try {
			String token = "token " + githubToken;
			String maskToken = TokenUtil.mask(token);
			log.info("Start to query repository_url by token, token: {}", maskToken);
			CompletableFuture<List<GitHubRepo>> githubReposByUserFuture = CompletableFuture
				.supplyAsync(() -> gitHubFeignClient.getAllRepos(token), customTaskExecutor);

			log.info("Start to query organizations_token: {}", maskToken);
			CompletableFuture<List<GitHubOrganizationsInfo>> githubOrganizationsFuture = CompletableFuture
				.supplyAsync(() -> gitHubFeignClient.getGithubOrganizationsInfo(token), customTaskExecutor);

			return githubReposByUserFuture
				.thenCombineAsync(githubOrganizationsFuture, (githubReposByUser, githubOrganizations) -> {
					log.info("Successfully get repository_token: {}, githubReposByUser: {}", maskToken,
							githubReposByUser);
					log.info("Successfully get organizations_token: {} organizations: {}", maskToken,
							githubOrganizations);
					List<String> githubReposMapped = githubReposByUser.stream().map(GitHubRepo::getHtmlUrl).toList();
					LinkedHashSet<String> githubRepos = new LinkedHashSet<>(githubReposMapped);
					CompletableFuture<Set<String>> githubReposByOrganizations = getAllGitHubReposAsync(token,
							githubOrganizations);
					Set<String> allGitHubRepos = githubReposByOrganizations.join();
					log.info("Successfully get all repositories_token: {}, repos: {}", maskToken, allGitHubRepos);
					githubRepos.addAll(allGitHubRepos);
					return GitHubResponse.builder().githubRepos(githubRepos).build();
				}, customTaskExecutor)
				.join();
		}
		catch (RuntimeException e) {
			Throwable cause = Optional.ofNullable(e.getCause()).orElse(e);
			log.error("Failed to call GitHub with token_error: {} ", cause.getMessage());
			if (cause instanceof BaseException baseException) {
				throw baseException;
			}
			throw new InternalServerErrorException(
					String.format("Failed to call GitHub with token_error: %s", cause.getMessage()));
		}
	}

	private CompletableFuture<Set<String>> getAllGitHubReposAsync(String token,
			List<GitHubOrganizationsInfo> gitHubOrganizations) {
		String maskToken = TokenUtil.mask(token);
		List<CompletableFuture<List<String>>> repoFutures = gitHubOrganizations.stream()
			.map(GitHubOrganizationsInfo::getLogin)
			.map(org -> CompletableFuture.supplyAsync(() -> {
				log.info("Start to query repository by organization_token: {}, gitHubOrganization: {}", maskToken, org);
				List<String> repos = gitHubFeignClient.getReposByOrganizationName(org, token)
					.stream()
					.map(GitHubRepo::getHtmlUrl)
					.toList();
				log.info("End to queried repository by organization_token: {}, gitHubOrganization: {}", maskToken, org);
				return repos;
			}, customTaskExecutor))
			.toList();
		return CompletableFuture.allOf(repoFutures.toArray(new CompletableFuture[0]))
			.thenApply(v -> repoFutures.stream()
				.map(CompletableFuture::join)
				.flatMap(Collection::stream)
				.collect(Collectors.toSet()));
	}

	public List<PipelineLeadTime> fetchPipelinesLeadTime(List<DeployTimes> deployTimes,
			Map<String, String> repositories, String token) {
		try {
			String realToken = "Bearer " + token;
			List<PipelineInfoOfRepository> pipelineInfoOfRepositories = getInfoOfRepositories(deployTimes,
					repositories);

			List<CompletableFuture<PipelineLeadTime>> pipelineLeadTimeFutures = pipelineInfoOfRepositories.stream()
				.map(item -> {
					if (item.getPassedDeploy() == null || item.getPassedDeploy().isEmpty()) {
						return CompletableFuture.completedFuture(PipelineLeadTime.builder().build());
					}

					List<CompletableFuture<LeadTime>> leadTimeFutures = getLeadTimeFutures(realToken, item);

					CompletableFuture<List<LeadTime>> allLeadTimesFuture = CompletableFuture
						.allOf(leadTimeFutures.toArray(new CompletableFuture[0]))
						.thenApply(v -> leadTimeFutures.stream()
							.map(CompletableFuture::join)
							.collect(Collectors.toList()));

					return allLeadTimesFuture.thenApply(leadTimes -> PipelineLeadTime.builder()
						.pipelineName(item.getPipelineName())
						.pipelineStep(item.getPipelineStep())
						.leadTimes(leadTimes)
						.build());
				})
				.toList();

			return pipelineLeadTimeFutures.stream().map(CompletableFuture::join).collect(Collectors.toList());
		}
		catch (RuntimeException e) {
			Throwable cause = Optional.ofNullable(e.getCause()).orElse(e);
			log.error("Failed to get pipeline leadTimes_error: {}", cause.getMessage());
			if (cause instanceof BaseException baseException) {
				throw baseException;
			}
			throw new InternalServerErrorException(
					String.format("Failed to get pipeline leadTimes, cause is: %s", cause.getMessage()));
		}

	}

	private List<CompletableFuture<LeadTime>> getLeadTimeFutures(String realToken, PipelineInfoOfRepository item) {
		return item.getPassedDeploy().stream().map(deployInfo -> {
			CompletableFuture<List<PullRequestInfo>> pullRequestInfoFuture = CompletableFuture
				.supplyAsync(() -> gitHubFeignClient.getPullRequestListInfo(item.getRepository(),
						deployInfo.getCommitId(), realToken));
			return pullRequestInfoFuture
				.thenApply(pullRequestInfos -> getLeadTimeByPullRequest(realToken, item, deployInfo, pullRequestInfos));
		}).toList();
	}

	private List<PipelineInfoOfRepository> getInfoOfRepositories(List<DeployTimes> deployTimes,
			Map<String, String> repositories) {
		return deployTimes.stream().map(deployTime -> {
			String repository = GithubUtil.getGithubUrlFullName(repositories.get(deployTime.getPipelineId()));
			return PipelineInfoOfRepository.builder()
				.repository(repository)
				.passedDeploy(deployTime.getPassed())
				.pipelineStep(deployTime.getPipelineStep())
				.pipelineName(deployTime.getPipelineName())
				.build();
		}).toList();
	}

	private LeadTime getLeadTimeByPullRequest(String realToken, PipelineInfoOfRepository item, DeployInfo deployInfo,
			List<PullRequestInfo> pullRequestInfos) {
		LeadTime noMergeDelayTime = parseNoMergeLeadTime(deployInfo);

		if (pullRequestInfos.isEmpty()) {
			return noMergeDelayTime;
		}

		Optional<PullRequestInfo> mergedPull = pullRequestInfos.stream()
			.filter(gitHubPull -> gitHubPull.getMergedAt() != null)
			.findFirst();

		if (mergedPull.isEmpty()) {
			return noMergeDelayTime;
		}

		List<CommitInfo> commitInfos = gitHubFeignClient.getPullRequestCommitInfo(item.getRepository(),
				mergedPull.get().getNumber().toString(), realToken);
		CommitInfo firstCommitInfo = commitInfos.get(0);
		return mapLeadTimeWithInfo(mergedPull.get(), deployInfo, firstCommitInfo);
	}

	private LeadTime parseNoMergeLeadTime(DeployInfo deployInfo) {
		long jobFinishTime = Instant.parse(deployInfo.getJobFinishTime()).toEpochMilli();
		long jobStartTime = Instant.parse(deployInfo.getJobStartTime()).toEpochMilli();
		long pipelineCreateTime = Instant.parse(deployInfo.getPipelineCreateTime()).toEpochMilli();

		return LeadTime.builder()
			.commitId(deployInfo.getCommitId())
			.pipelineCreateTime(pipelineCreateTime)
			.jobFinishTime(jobFinishTime)
			.pipelineDelayTime(jobFinishTime - jobStartTime)
			.totalTime(jobFinishTime - jobStartTime)
			.prDelayTime(0L)
			.build();
	}

	public LeadTime mapLeadTimeWithInfo(PullRequestInfo pullRequestInfo, DeployInfo deployInfo, CommitInfo commitInfo) {
		if (pullRequestInfo.getMergedAt() == null) {
			return null;
		}
		long prCreatedTime = Instant.parse(pullRequestInfo.getCreatedAt()).toEpochMilli();
		long prMergedTime = Instant.parse(pullRequestInfo.getMergedAt()).toEpochMilli();
		long jobFinishTime = Instant.parse(deployInfo.getJobFinishTime()).toEpochMilli();
		long pipelineCreateTime = Instant.parse(deployInfo.getPipelineCreateTime()).toEpochMilli();
		long firstCommitTimeInPr;
		if (commitInfo.getCommit() != null && commitInfo.getCommit().getCommitter() != null
				&& commitInfo.getCommit().getCommitter().getDate() != null) {
			firstCommitTimeInPr = Instant.parse(commitInfo.getCommit().getCommitter().getDate()).toEpochMilli();
		}
		else {
			firstCommitTimeInPr = 0;
		}

		long pipelineDelayTime = jobFinishTime - prMergedTime;
		long prDelayTime;
		long totalTime;
		if (firstCommitTimeInPr > 0) {
			prDelayTime = prMergedTime - firstCommitTimeInPr;
		}
		else {
			prDelayTime = prMergedTime - prCreatedTime;
		}
		totalTime = prDelayTime + pipelineDelayTime;

		return LeadTime.builder()
			.pipelineDelayTime(pipelineDelayTime)
			.prDelayTime(prDelayTime)
			.firstCommitTimeInPr(firstCommitTimeInPr)
			.prMergedTime(prMergedTime)
			.totalTime(totalTime)
			.prCreatedTime(prCreatedTime)
			.commitId(deployInfo.getCommitId())
			.jobFinishTime(jobFinishTime)
			.pipelineCreateTime(pipelineCreateTime)
			.build();
	}

	public CommitInfo fetchCommitInfo(String commitId, String repositoryId, String token) {
		String maskToken = TokenUtil.mask(token);
		try {
			String realToken = "Bearer " + token;
			log.info("Start to get commit info_token: {},repoId: {},commitId: {}", maskToken, repositoryId, commitId);
			CommitInfo commitInfo = gitHubFeignClient.getCommitInfo(repositoryId, commitId, realToken);
			log.info("Successfully get commit info_commitInfo_token: {}, commit: {}", maskToken,
					commitInfo.getCommit());
			return commitInfo;
		}
		catch (RuntimeException e) {
			Throwable cause = Optional.ofNullable(e.getCause()).orElse(e);
			log.error("Failed to get commit info_token: {}, error: {}", maskToken, cause.getMessage());
			if (cause instanceof BaseException baseException) {
				throw baseException;
			}
			throw new InternalServerErrorException(
					String.format("Failed to get commit info_token: %s,cause is: %s", maskToken, cause.getMessage()));
		}
	}

}
