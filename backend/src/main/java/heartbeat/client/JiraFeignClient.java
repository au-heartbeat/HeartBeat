package heartbeat.client;

import heartbeat.client.dto.board.jira.CardHistoryResponseDTO;
import heartbeat.client.dto.board.jira.FieldResponseDTO;
import heartbeat.client.dto.board.jira.JiraBoardConfigDTO;
import heartbeat.client.dto.board.jira.StatusSelfDTO;
import heartbeat.decoder.JiraFeignClientDecoder;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.net.URI;

@FeignClient(value = "jiraFeignClient", url = "${jira.url}", configuration = JiraFeignClientDecoder.class)
public interface JiraFeignClient {

	@Cacheable(cacheNames = "jiraConfig", key = "#boardId")
	@GetMapping(path = "/rest/agile/1.0/board/{boardId}/configuration")
	JiraBoardConfigDTO getJiraBoardConfiguration(URI baseUrl, @PathVariable String boardId,
			@RequestHeader String authorization);

	@Cacheable(cacheNames = "jiraStatusCategory", key = "#statusNum")
	@GetMapping(path = "/rest/api/2/status/{statusNum}")
	StatusSelfDTO getColumnStatusCategory(URI baseUrl, @PathVariable String statusNum,
			@RequestHeader String authorization);

	@GetMapping(path = "/rest/agile/1.0/board/{boardId}/issue?maxResults={queryCount}&startAt={startAt}&jql={jql}")
	String getJiraCards(URI baseUrl, @PathVariable String boardId, @PathVariable int queryCount,
			@PathVariable int startAt, @PathVariable String jql, @RequestHeader String authorization);

	@Cacheable(cacheNames = "jiraActivityFeed", key = "#jiraCardKey")
	@GetMapping(path = "/rest/internal/2/issue/{jiraCardKey}/activityfeed")
	CardHistoryResponseDTO getJiraCardHistory(URI baseUrl, @PathVariable String jiraCardKey,
			@RequestHeader String authorization);

	@Cacheable(cacheNames = "targetField", key = "#projectKey")
	@GetMapping(path = "/rest/api/2/issue/createmeta?projectKeys={projectKey}&expand=projects.issuetypes.fields")
	FieldResponseDTO getTargetField(URI baseUrl, @PathVariable String projectKey, @RequestHeader String authorization);

}
