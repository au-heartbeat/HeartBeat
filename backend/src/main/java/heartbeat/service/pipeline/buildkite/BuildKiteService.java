package heartbeat.service.pipeline.buildkite;

import feign.FeignException;
import heartbeat.client.BuildKiteFeignClient;
import heartbeat.client.dto.pipeline.buildKite.BuildKiteBuildInfo;
import heartbeat.client.dto.pipeline.buildKite.BuildKiteJob;
import heartbeat.client.dto.pipeline.buildKite.BuildKiteOrganizationsInfo;
import heartbeat.client.dto.pipeline.buildKite.BuildKiteTokenInfo;
import heartbeat.controller.pipeline.vo.request.PipelineParam;
import heartbeat.controller.pipeline.vo.request.PipelineStepsParam;
import heartbeat.controller.pipeline.vo.response.BuildKiteResponse;
import heartbeat.controller.pipeline.vo.response.Pipeline;
import heartbeat.controller.pipeline.vo.response.PipelineStepsResponse;
import heartbeat.controller.pipeline.vo.response.PipelineTransformer;
import heartbeat.exception.PermissionDenyException;
import heartbeat.exception.RequestFailedException;
import heartbeat.util.TokenUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Log4j2
public class BuildKiteService {

	private static final List<String> permissions = List.of("read_builds", "read_organizations", "read_pipelines");

	public static final String BUILD_KITE_LINK_HEADER = HttpHeaders.LINK;

	private final BuildKiteFeignClient buildKiteFeignClient;

	public BuildKiteResponse fetchPipelineInfo(PipelineParam pipelineParam) {
		try {
			String buildKiteToken = "Bearer " + pipelineParam.getToken();
			log.info("[BuildKite] Start to query token permissions" + TokenUtil.mask(pipelineParam.getToken()));
			BuildKiteTokenInfo buildKiteTokenInfo = buildKiteFeignClient.getTokenInfo(buildKiteToken);
			log.info("[BuildKite] Successfully get permissions" + buildKiteTokenInfo);
			verifyToken(buildKiteTokenInfo);
			log.info("[BuildKite] Start to query organizations");
			List<BuildKiteOrganizationsInfo> buildKiteOrganizationsInfo = buildKiteFeignClient
				.getBuildKiteOrganizationsInfo(buildKiteToken);
			log.info("[BuildKite] Successfully get organizations slug:" + buildKiteOrganizationsInfo);

			log.info("[BuildKite] Start to query buildKite pipelineInfo by organizations slug:"
					+ buildKiteOrganizationsInfo);
			List<Pipeline> buildKiteInfoList = buildKiteOrganizationsInfo.stream()
				.flatMap(org -> buildKiteFeignClient
					.getPipelineInfo(buildKiteToken, org.getSlug(), "1", "100", pipelineParam.getStartTime(),
							pipelineParam.getEndTime())
					.stream()
					.map(pipeline -> PipelineTransformer.fromBuildKitePipelineDto(pipeline, org.getSlug(),
							org.getName())))
				.collect(Collectors.toList());
			log.info("[BuildKite] Successfully get buildKite pipelineInfo, pipelineInfoList size is:"
					+ buildKiteInfoList.size());

			return BuildKiteResponse.builder().pipelineList(buildKiteInfoList).build();
		}
		catch (FeignException e) {
			log.error("[BuildKite] Failed when call BuildKite", e);
			throw new RequestFailedException(e);
		}
	}

	private void verifyToken(BuildKiteTokenInfo buildKiteTokenInfo) {
		for (String permission : permissions) {
			if (!buildKiteTokenInfo.getScopes().contains(permission)) {
				log.error("Failed to call BuildKite, because of insufficient permission, current permissions: {}",
						buildKiteTokenInfo.getScopes());
				throw new PermissionDenyException(403, "Permission deny!");
			}
		}
	}

	public PipelineStepsResponse fetchPipelineSteps(String token, String organizationId, String pipelineId,
			PipelineStepsParam stepsParam) {
		try {
			String partialToken = token.substring(0, token.length() / 2);
			List<BuildKiteBuildInfo> buildKiteBuildInfos = fetchPipelineStepsByPage(token, organizationId, pipelineId,
					stepsParam, partialToken);

			List<String> buildSteps = buildKiteBuildInfos.stream()
				.flatMap(buildKiteBuildInfo -> buildKiteBuildInfo.getJobs().stream())
				.filter(job -> job != null && job.getName() != null && !job.getName().isEmpty())
				.sorted(Comparator.comparing(BuildKiteJob::getName))
				.map(BuildKiteJob::getName)
				.distinct()
				.toList();
			log.info("[BuildKite] Successfully get pipeline steps, finally build steps_buildSteps:{}", buildSteps);
			return PipelineStepsResponse.builder()
				.pipelineId(pipelineId)
				.steps(buildSteps)
				.name(stepsParam.getOrgName())
				.orgName(stepsParam.getOrgName())
				.repository(stepsParam.getRepository())
				.orgId(organizationId)
				.build();
		}
		catch (CompletionException e) {
			RequestFailedException requestFailedException = (RequestFailedException) e.getCause();
			if (requestFailedException.getStatus() == HttpStatus.NOT_FOUND.value()) {
				throw new RequestFailedException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Server Error");
			}
			throw requestFailedException;
		}
	}

	private List<BuildKiteBuildInfo> fetchPipelineStepsByPage(String token, String orgId, String pipelineId,
			PipelineStepsParam stepsParam, String partialToken) {
		String page = "1";
		String perPage = "100";
		log.info(
				"[BuildKite] Start to paginated pipeline steps info_token: {},orgId: {},pipelineId: {},stepsParam: {},page:{}",
				partialToken, orgId, pipelineId, stepsParam, page);
		ResponseEntity<List<BuildKiteBuildInfo>> pipelineStepsInfo = buildKiteFeignClient.getPipelineSteps(token, orgId,
				pipelineId, page, perPage, stepsParam.getStartTime(), stepsParam.getEndTime());
		log.info(
				"[BuildKite] Successfully get paginated pipeline steps info_token:{},orgId: {},pipelineId: {},result status code: {},page:{}",
				partialToken, orgId, pipelineId, pipelineStepsInfo.getStatusCode(), page);

		int totalPage = parseTotalPage(pipelineStepsInfo.getHeaders().get(BUILD_KITE_LINK_HEADER));
		log.info("[BuildKite] Successfully parse the total page_total page: {}", totalPage);

		List<BuildKiteBuildInfo> firstPageStepsInfo = pipelineStepsInfo.getBody();
		List<BuildKiteBuildInfo> pageStepsInfo = new ArrayList<>();
		if (firstPageStepsInfo != null) {
			pageStepsInfo.addAll(firstPageStepsInfo);
		}
		if (totalPage != 1) {
			Stream<CompletableFuture<List<BuildKiteBuildInfo>>> futureStream = IntStream.range(1, totalPage + 1)
				.mapToObj(currentPage -> getBuildKiteStepsAsync(token, orgId, pipelineId, stepsParam, perPage,
						currentPage, partialToken));
			List<BuildKiteBuildInfo> buildKiteBuildInfos = futureStream.map(CompletableFuture::join)
				.flatMap(Collection::stream)
				.toList();
			pageStepsInfo.addAll(buildKiteBuildInfos);
		}
		return pageStepsInfo;
	}

	private CompletableFuture<List<BuildKiteBuildInfo>> getBuildKiteStepsAsync(String token, String organizationId,
			String pipelineId, PipelineStepsParam stepsParam, String perPage, int page, String partialToken) {
		return CompletableFuture.supplyAsync(() -> {
			try {
				log.info(
						"[BuildKite] Start to paginated pipeline steps info_token: {},orgId: {},pipelineId: {},stepsParam: {},page:{}",
						partialToken, organizationId, pipelineId, stepsParam, page);
				List<BuildKiteBuildInfo> pipelineStepsInfo = buildKiteFeignClient.getPipelineStepsInfo(token,
						organizationId, pipelineId, String.valueOf(page), perPage, stepsParam.getStartTime(),
						stepsParam.getEndTime());
				log.info(
						"[BuildKite] Successfully get paginated pipeline steps info_token:{},orgId: {},pipelineId: {},pipeline steps size: {},page:{}",
						partialToken, organizationId, pipelineId, pipelineStepsInfo.size(), page);
				return pipelineStepsInfo;
			}
			catch (RequestFailedException e) {
				log.error(
						"[BuildKite] Failed get build kite steps page_token: {},orgId: {},pipelineId: {}, exception occurred: {},page: {}",
						token, organizationId, pipelineId, e.getMessage(), page);
				throw e;
			}
		});
	}

	private int parseTotalPage(@Nullable List<String> linkHeader) {
		if (linkHeader == null) {
			return 1;
		}
		String lastLink = linkHeader.stream().map(link -> link.replaceAll("per_page=\\d+", "")).findFirst().orElse("");
		Matcher matcher = Pattern.compile("page=(\\d+)[^>]*>;\\s*rel=\"last\"").matcher(lastLink);
		if (matcher.find()) {
			return Integer.parseInt(matcher.group(1));
		}
		return 1;
	}

}
