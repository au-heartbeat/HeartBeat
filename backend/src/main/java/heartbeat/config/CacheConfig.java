package heartbeat.config;

import heartbeat.client.dto.board.jira.CardHistoryResponseDTO;
import heartbeat.client.dto.board.jira.FieldResponseDTO;
import heartbeat.client.dto.board.jira.JiraBoardConfigDTO;
import heartbeat.client.dto.board.jira.JiraBoardProject;
import heartbeat.client.dto.board.jira.JiraBoardVerifyDTO;
import heartbeat.client.dto.board.jira.StatusSelfDTO;
import java.time.Duration;
import java.util.List;
import javax.cache.CacheManager;
import javax.cache.Caching;
import javax.cache.spi.CachingProvider;

import heartbeat.client.dto.board.jira.HolidaysResponseDTO;
import heartbeat.client.dto.codebase.github.CommitInfo;
import heartbeat.client.dto.pipeline.buildkite.BuildKiteTokenInfo;
import lombok.val;
import org.ehcache.config.builders.CacheConfigurationBuilder;
import org.ehcache.config.builders.ExpiryPolicyBuilder;
import org.ehcache.config.builders.ResourcePoolsBuilder;
import org.ehcache.config.units.MemoryUnit;
import org.ehcache.jsr107.Eh107Configuration;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.ResponseEntity;

@Configuration
@EnableCaching
public class CacheConfig {

	@Bean
	public CacheManager ehCacheManager() {
		CachingProvider provider = Caching.getCachingProvider();
		CacheManager cacheManager = provider.getCacheManager();
		cacheManager.createCache("sprintInfo", getCacheConfiguration(String.class));
		cacheManager.createCache("jiraConfig", getCacheConfiguration(JiraBoardConfigDTO.class));
		cacheManager.createCache("jiraStatusCategory", getCacheConfiguration(StatusSelfDTO.class));
		cacheManager.createCache("jiraActivityFeed", getCacheConfiguration(CardHistoryResponseDTO.class));
		cacheManager.createCache("targetField", getCacheConfiguration(FieldResponseDTO.class));
		cacheManager.createCache("boardVerification", getCacheConfiguration(JiraBoardVerifyDTO.class));
		cacheManager.createCache("boardProject", getCacheConfiguration(JiraBoardProject.class));
		cacheManager.createCache("jiraCards", getCacheConfiguration(String.class));
		cacheManager.createCache("holidayResult", getCacheConfiguration(HolidaysResponseDTO.class));
		cacheManager.createCache("tokenInfo", getCacheConfiguration(BuildKiteTokenInfo.class));
		cacheManager.createCache("buildKiteOrganizationInfo", getCacheConfiguration(List.class));
		cacheManager.createCache("pipelineInfo", getCacheConfiguration(List.class));
		cacheManager.createCache("pipelineSteps", getCacheConfiguration(ResponseEntity.class));
		cacheManager.createCache("pipelineStepsInfo", getCacheConfiguration(List.class));
		cacheManager.createCache("githubOrganizationInfo", getCacheConfiguration(List.class));
		cacheManager.createCache("githubAllRepos", getCacheConfiguration(List.class));
		cacheManager.createCache("githubRepos", getCacheConfiguration(List.class));
		cacheManager.createCache("commitInfo", getCacheConfiguration(CommitInfo.class));
		cacheManager.createCache("pullRequestCommitInfo", getCacheConfiguration(List.class));
		cacheManager.createCache("pullRequestListInfo", getCacheConfiguration(List.class));
		return cacheManager;
	}

	@SuppressWarnings("unchecked")
	private <K, V> javax.cache.configuration.Configuration<K, V> getCacheConfiguration(Class<V> valueType) {
		val offHeap = ResourcePoolsBuilder.newResourcePoolsBuilder().offheap(2, MemoryUnit.MB);
		val timeToLive = Duration.ofSeconds(180);
		CacheConfigurationBuilder<K, V> configuration = CacheConfigurationBuilder
			.newCacheConfigurationBuilder((Class<K>) String.class, valueType, offHeap)
			.withExpiry(ExpiryPolicyBuilder.timeToLiveExpiration(timeToLive));

		return Eh107Configuration.fromEhcacheCacheConfiguration(configuration);
	}

}
