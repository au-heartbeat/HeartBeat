package heartbeat.client;

import heartbeat.client.dto.pipeline.buildkite.BuildKiteBuildInfo;
import heartbeat.client.dto.pipeline.buildkite.BuildKiteOrganizationsInfo;
import heartbeat.client.dto.pipeline.buildkite.BuildKiteTokenInfo;
import heartbeat.client.dto.pipeline.buildkite.BuildKitePipelineDTO;
import heartbeat.decoder.BuildKiteFeignClientDecoder;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;

@FeignClient(name = "buildKiteFeignClient", url = "${buildKite.url}", configuration = BuildKiteFeignClientDecoder.class)
public interface BuildKiteFeignClient {

	@GetMapping(path = "v2/access-token")
	@ResponseStatus(HttpStatus.OK)
	BuildKiteTokenInfo getTokenInfo(@RequestHeader("Authorization") String token);

	@GetMapping(path = "v2/organizations")
	@ResponseStatus(HttpStatus.OK)
	List<BuildKiteOrganizationsInfo> getBuildKiteOrganizationsInfo(@RequestHeader("Authorization") String token);

	@GetMapping(path = "v2/organizations/{organizationId}/pipelines?page={page}&per_page={perPage}")
	@ResponseStatus(HttpStatus.OK)
	List<BuildKitePipelineDTO> getPipelineInfo(@RequestHeader("Authorization") String token,
			@PathVariable String organizationId, @PathVariable String page, @PathVariable String perPage,
			@RequestParam String startTime, @RequestParam String endTime);

	@GetMapping(path = "v2/organizations/{organizationId}/pipelines/{pipelineId}/builds")
	@ResponseStatus(HttpStatus.OK)
	ResponseEntity<List<BuildKiteBuildInfo>> getPipelineSteps(@RequestHeader("Authorization") String token,
			@PathVariable String organizationId, @PathVariable String pipelineId, @RequestParam String page,
			@RequestParam("per_page") String perPage, @RequestParam("created_from") String createdFrom,
			@RequestParam("created_to") String createdTo);

	@GetMapping(path = "v2/organizations/{organizationId}/pipelines/{pipelineId}/builds")
	@ResponseStatus(HttpStatus.OK)
	List<BuildKiteBuildInfo> getPipelineStepsInfo(@RequestHeader("Authorization") String token,
			@PathVariable String organizationId, @PathVariable String pipelineId, @RequestParam String page,
			@RequestParam("per_page") String perPage, @RequestParam("created_from") String createdFrom,
			@RequestParam("created_to") String createdTo);

}
