package heartbeat.service.pipeline.buildkite;

import heartbeat.exception.CustomFeignClientException;
import heartbeat.exception.InternalServerErrorException;
import heartbeat.exception.ServiceUnavailableException;
import heartbeat.exception.UnauthorizedException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hibernate.validator.internal.util.Contracts.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import heartbeat.client.BuildKiteFeignClient;
import heartbeat.client.dto.pipeline.buildkite.BuildKiteBuildInfo;
import heartbeat.client.dto.pipeline.buildkite.BuildKiteJob;
import heartbeat.client.dto.pipeline.buildkite.BuildKiteOrganizationsInfo;
import heartbeat.client.dto.pipeline.buildkite.BuildKitePipelineDTO;
import heartbeat.client.dto.pipeline.buildkite.BuildKiteTokenInfo;
import heartbeat.client.dto.pipeline.buildkite.DeployTimes;
import heartbeat.controller.pipeline.dto.request.DeploymentEnvironment;
import heartbeat.controller.pipeline.dto.request.PipelineParam;
import heartbeat.controller.pipeline.dto.request.PipelineStepsParam;
import heartbeat.controller.pipeline.dto.response.BuildKiteResponseDTO;
import heartbeat.controller.pipeline.dto.response.Pipeline;
import heartbeat.controller.pipeline.dto.response.PipelineStepsDTO;
import heartbeat.exception.NotFoundException;
import heartbeat.exception.PermissionDenyException;
import heartbeat.exception.RequestFailedException;
import heartbeat.service.pipeline.buildkite.builder.BuildKiteBuildInfoBuilder;
import heartbeat.service.pipeline.buildkite.builder.BuildKiteJobBuilder;
import heartbeat.service.pipeline.buildkite.builder.DeployInfoBuilder;
import heartbeat.service.pipeline.buildkite.builder.DeployTimesBuilder;
import heartbeat.service.pipeline.buildkite.builder.DeploymentEnvironmentBuilder;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletionException;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BuildKiteServiceTest {

	public static final String TOTAL_PAGE_HEADER = """
			<https://api.buildkite.com/v2/organizations/test_org_id/pipelines/test_pipeline_id/builds?page=1&per_page=100>; rel="first",
			<https://api.buildkite.com/v2/organizations/test_org_id/pipelines/test_pipeline_id/builds?page=1&per_page=100>; rel="prev",
			<https://api.buildkite.com/v2/organizations/test_org_id/pipelines/test_pipeline_id/builds?per_page=100&page=2>; rel="next",
			<https://api.buildkite.com/v2/organizations/test_org_id/pipelines/test_pipeline_id/builds?page=3&per_page=100>; rel="last"
			""";

	public static final String NONE_TOTAL_PAGE_HEADER = """
			<https://api.buildkite.com/v2/organizations/test_org_id/pipelines/test_pipeline_id/builds?page=1&per_page=100>; rel="first",
			<https://api.buildkite.com/v2/organizations/test_org_id/pipelines/test_pipeline_id/builds?page=1&per_page=100>; rel="prev",
			<https://api.buildkite.com/v2/organizations/test_org_id/pipelines/test_pipeline_id/builds?per_page=100&page=2>; rel="next"
			""";

	public static final String MOCK_TOKEN = "mock_token";

	public static final String TEST_ORG_ID = "test_org_id";

	public static final String TEST_ORG_NAME = "test_org_name";

	public static final String TEST_PIPELINE_ID = "test_pipeline_id";

	private static final String PASSED_STATE = "passed";

	private static final String FAILED_STATE = "failed";

	private static final String MOCK_START_TIME = "1661702400000";

	private static final String MOCK_END_TIME = "1662739199000";

	public static final List<String> PERMISSION_SCOPES = List.of("read_builds", "read_organizations", "read_pipelines");

	public static final String TEST_JOB_NAME = "testJob";

	public static final String UNAUTHORIZED_MSG = "unauthorized";

	@Mock
	BuildKiteFeignClient buildKiteFeignClient;

	BuildKiteService buildKiteService;

	ThreadPoolTaskExecutor executor;

	@BeforeEach
	public void setUp() {
		buildKiteService = new BuildKiteService(executor = getTaskExecutor(), buildKiteFeignClient);
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

	@AfterEach
	public void tearDown() {
		buildKiteService.shutdownExecutor();
	}

	@Test
	void shouldReturnBuildKiteResponseWhenCallBuildKiteApi() throws IOException {
		ObjectMapper mapper = new ObjectMapper();
		List<BuildKitePipelineDTO> pipelineDTOS = mapper.readValue(
				new File("src/test/java/heartbeat/controller/pipeline/buildKitePipelineInfoData.json"),
				new TypeReference<>() {
				});
		BuildKiteTokenInfo buildKiteTokenInfo = BuildKiteTokenInfo.builder().scopes(PERMISSION_SCOPES).build();
		PipelineParam pipelineParam = PipelineParam.builder()
			.token(MOCK_TOKEN)
			.startTime(MOCK_START_TIME)
			.endTime(MOCK_END_TIME)
			.build();
		when(buildKiteFeignClient.getBuildKiteOrganizationsInfo(any()))
			.thenReturn(List.of(BuildKiteOrganizationsInfo.builder().name(TEST_ORG_NAME).slug(TEST_ORG_ID).build()));
		when(buildKiteFeignClient.getPipelineInfo("Bearer mock_token", TEST_ORG_ID, "1", "100", MOCK_START_TIME,
				MOCK_END_TIME))
			.thenReturn(pipelineDTOS);
		when(buildKiteFeignClient.getTokenInfo(any())).thenReturn(buildKiteTokenInfo);

		BuildKiteResponseDTO buildKiteResponseDTO = buildKiteService.fetchPipelineInfo(pipelineParam);

		assertThat(buildKiteResponseDTO.getPipelineList().size()).isEqualTo(1);
		Pipeline pipeline = buildKiteResponseDTO.getPipelineList().get(0);
		assertThat(pipeline.getId()).isEqualTo("payment-selector-ui");
		assertThat(pipeline.getName()).isEqualTo("payment-selector-ui");
		assertThat(pipeline.getOrgId()).isEqualTo(TEST_ORG_ID);
		assertThat(pipeline.getOrgName()).isEqualTo(TEST_ORG_NAME);
		assertThat(pipeline.getRepository())
			.isEqualTo("https://github.com/XXXX-fs/fs-platform-payment-selector-ui.git");
		assertThat(pipeline.getSteps().size()).isEqualTo(1);
	}

	@Test
	void shouldThrowRequestFailedExceptionWhenFeignClientCallFailed() {
		BuildKiteTokenInfo buildKiteTokenInfo = BuildKiteTokenInfo.builder().scopes(PERMISSION_SCOPES).build();
		when(buildKiteFeignClient.getBuildKiteOrganizationsInfo(any()))
			.thenThrow(new CustomFeignClientException(401, "Bad credentials"));
		when(buildKiteFeignClient.getTokenInfo(any())).thenReturn(buildKiteTokenInfo);

		assertThatThrownBy(() -> buildKiteService.fetchPipelineInfo(
				PipelineParam.builder().token(MOCK_TOKEN).startTime(MOCK_START_TIME).endTime(MOCK_END_TIME).build()))
			.isInstanceOf(Exception.class)
			.hasMessageContaining("Bad credentials");

		verify(buildKiteFeignClient).getBuildKiteOrganizationsInfo(any());
	}

	@Test
	void shouldThrowNoPermissionExceptionWhenTokenPermissionDeny() {
		BuildKiteTokenInfo buildKiteTokenInfo = BuildKiteTokenInfo.builder().scopes(List.of("mock")).build();
		when(buildKiteFeignClient.getTokenInfo(any())).thenReturn(buildKiteTokenInfo);

		assertThrows(PermissionDenyException.class, () -> buildKiteService.fetchPipelineInfo(
				PipelineParam.builder().token(MOCK_TOKEN).startTime(MOCK_START_TIME).endTime(MOCK_END_TIME).build()));
	}

	@Test
	public void shouldReturnResponseWhenFetchPipelineStepsSuccess() {
		PipelineStepsParam stepsParam = new PipelineStepsParam();
		stepsParam.setStartTime(MOCK_START_TIME);
		stepsParam.setEndTime(MOCK_END_TIME);
		BuildKiteJob testJob = BuildKiteJob.builder().name(TEST_JOB_NAME).build();
		List<BuildKiteBuildInfo> buildKiteBuildInfoList = new ArrayList<>();
		buildKiteBuildInfoList.add(BuildKiteBuildInfo.builder()
			.jobs(List.of(testJob))
			.author(BuildKiteBuildInfo.Author.builder().name("xx").build())
			.build());
		ResponseEntity<List<BuildKiteBuildInfo>> responseEntity = new ResponseEntity<>(buildKiteBuildInfoList,
				HttpStatus.OK);
		when(buildKiteFeignClient.getPipelineSteps(anyString(), anyString(), anyString(), anyString(), anyString(),
				anyString(), anyString(), any()))
			.thenReturn(responseEntity);

		PipelineStepsDTO pipelineStepsDTO = buildKiteService.fetchPipelineSteps(MOCK_TOKEN, TEST_ORG_ID,
				TEST_PIPELINE_ID, stepsParam);

		assertNotNull(pipelineStepsDTO);
		assertThat(pipelineStepsDTO.getSteps().get(0)).isEqualTo(TEST_JOB_NAME);
	}

	@Test
	public void shouldThrowRequestFailedExceptionWhenFetchPipelineStepsWithException() {
		RequestFailedException mockException = mock(RequestFailedException.class);
		when(mockException.getMessage()).thenReturn("exception");
		when(mockException.getStatus()).thenReturn(500);
		when(buildKiteFeignClient.getPipelineSteps(anyString(), anyString(), anyString(), anyString(), anyString(),
				any(), any(), any()))
			.thenThrow(mockException);

		assertThrows(RequestFailedException.class,
				() -> buildKiteService.fetchPipelineSteps(MOCK_TOKEN, TEST_ORG_ID, TEST_PIPELINE_ID,
						PipelineStepsParam.builder().startTime(MOCK_START_TIME).endTime(MOCK_END_TIME).build()),
				"Request failed with status code 500, error: exception");
	}

	@Test
	public void shouldReturnMoreThanOnePageStepsWhenPageFetchPipelineSteps() {
		PipelineStepsParam stepsParam = new PipelineStepsParam();
		stepsParam.setStartTime(MOCK_START_TIME);
		stepsParam.setEndTime(MOCK_END_TIME);
		List<String> linkHeader = new ArrayList<>();
		linkHeader.add(TOTAL_PAGE_HEADER);
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.addAll(HttpHeaders.LINK, linkHeader);
		List<BuildKiteBuildInfo> buildKiteBuildInfoList = new ArrayList<>();
		BuildKiteJob testJob = BuildKiteJob.builder().name(TEST_JOB_NAME).build();
		BuildKiteJob testJob2 = BuildKiteJob.builder().name("testJob2").build();
		buildKiteBuildInfoList.add(BuildKiteBuildInfo.builder().jobs(List.of(testJob, testJob2)).build());
		ResponseEntity<List<BuildKiteBuildInfo>> responseEntity = new ResponseEntity<>(buildKiteBuildInfoList,
				httpHeaders, HttpStatus.OK);
		when(buildKiteFeignClient.getPipelineSteps(anyString(), anyString(), anyString(), anyString(), anyString(),
				anyString(), anyString(), any()))
			.thenReturn(responseEntity);
		BuildKiteJob testJob3 = BuildKiteJob.builder().name("testJob3").build();
		BuildKiteJob testJob4 = BuildKiteJob.builder().name("").build();
		List<BuildKiteBuildInfo> buildKiteBuildInfoList2 = new ArrayList<>();
		buildKiteBuildInfoList2.add(BuildKiteBuildInfo.builder().jobs(List.of(testJob3, testJob4)).build());
		when(buildKiteFeignClient.getPipelineStepsInfo(anyString(), anyString(), anyString(), anyString(), anyString(),
				anyString(), anyString(), any()))
			.thenReturn(buildKiteBuildInfoList2);

		PipelineStepsDTO pipelineStepsDTO = buildKiteService.fetchPipelineSteps(MOCK_TOKEN, TEST_ORG_ID,
				TEST_PIPELINE_ID, stepsParam);

		assertNotNull(pipelineStepsDTO);
		assertThat(pipelineStepsDTO.getSteps().size()).isEqualTo(3);
		assertThat(pipelineStepsDTO.getSteps().get(0)).isEqualTo(TEST_JOB_NAME);
		assertThat(pipelineStepsDTO.getSteps().get(1)).isEqualTo("testJob2");
		assertThat(pipelineStepsDTO.getSteps().get(2)).isEqualTo("testJob3");
	}

	@Test
	public void shouldRThrowServerErrorWhenPageFetchPipelineStepsAndFetchNextPage404Exception() {
		List<String> linkHeader = new ArrayList<>();
		linkHeader.add(TOTAL_PAGE_HEADER);
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.addAll(HttpHeaders.LINK, linkHeader);
		List<BuildKiteBuildInfo> buildKiteBuildInfoList = new ArrayList<>();
		BuildKiteJob testJob = BuildKiteJob.builder().name(TEST_JOB_NAME).build();
		buildKiteBuildInfoList.add(BuildKiteBuildInfo.builder().jobs(List.of(testJob)).build());
		ResponseEntity<List<BuildKiteBuildInfo>> responseEntity = new ResponseEntity<>(buildKiteBuildInfoList,
				httpHeaders, HttpStatus.OK);
		when(buildKiteFeignClient.getPipelineSteps(anyString(), anyString(), anyString(), anyString(), anyString(),
				any(), any(), any()))
			.thenReturn(responseEntity);
		when(buildKiteFeignClient.getPipelineStepsInfo(anyString(), anyString(), anyString(), anyString(), anyString(),
				any(), any(), any()))
			.thenThrow(new CompletionException(new NotFoundException("Client Error")));

		assertThatThrownBy(() -> buildKiteService.fetchPipelineSteps(MOCK_TOKEN, TEST_ORG_ID, TEST_PIPELINE_ID,
				PipelineStepsParam.builder().startTime(MOCK_START_TIME).endTime(MOCK_END_TIME).build()))
			.isInstanceOf(NotFoundException.class)
			.hasMessageContaining("Client Error");
	}

	@Test
	public void shouldRThrowTimeoutExceptionWhenPageFetchPipelineStepsAndFetchNextPage503Exception() {
		List<String> linkHeader = new ArrayList<>();
		linkHeader.add(TOTAL_PAGE_HEADER);
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.addAll(HttpHeaders.LINK, linkHeader);
		List<BuildKiteBuildInfo> buildKiteBuildInfoList = new ArrayList<>();
		BuildKiteJob testJob = BuildKiteJob.builder().name(TEST_JOB_NAME).build();
		buildKiteBuildInfoList.add(BuildKiteBuildInfo.builder().jobs(List.of(testJob)).build());
		ResponseEntity<List<BuildKiteBuildInfo>> responseEntity = new ResponseEntity<>(buildKiteBuildInfoList,
				httpHeaders, HttpStatus.OK);
		when(buildKiteFeignClient.getPipelineSteps(anyString(), anyString(), anyString(), anyString(), anyString(),
				any(), any(), any()))
			.thenReturn(responseEntity);
		when(buildKiteFeignClient.getPipelineStepsInfo(anyString(), anyString(), anyString(), anyString(), anyString(),
				any(), any(), any()))
			.thenThrow(new CompletionException(new ServiceUnavailableException("Service Unavailable")));

		assertThatThrownBy(() -> buildKiteService.fetchPipelineSteps(MOCK_TOKEN, TEST_ORG_ID, TEST_PIPELINE_ID,
				PipelineStepsParam.builder().startTime(MOCK_START_TIME).endTime(MOCK_END_TIME).build()))
			.isInstanceOf(ServiceUnavailableException.class)
			.hasMessageContaining("Service Unavailable");
	}

	@Test
	public void shouldThrowServerErrorWhenPageFetchPipelineStepsAndFetchNextPage5xxException() {
		List<String> linkHeader = new ArrayList<>();
		linkHeader.add(TOTAL_PAGE_HEADER);
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.addAll(HttpHeaders.LINK, linkHeader);
		List<BuildKiteBuildInfo> buildKiteBuildInfoList = new ArrayList<>();
		BuildKiteJob testJob = BuildKiteJob.builder().name(TEST_JOB_NAME).build();
		buildKiteBuildInfoList.add(BuildKiteBuildInfo.builder().jobs(List.of(testJob)).build());
		ResponseEntity<List<BuildKiteBuildInfo>> responseEntity = new ResponseEntity<>(buildKiteBuildInfoList,
				httpHeaders, HttpStatus.OK);
		when(buildKiteFeignClient.getPipelineSteps(anyString(), anyString(), anyString(), anyString(), anyString(),
				anyString(), anyString(), any()))
			.thenReturn(responseEntity);
		when(buildKiteFeignClient.getPipelineStepsInfo(anyString(), anyString(), anyString(), anyString(), anyString(),
				any(), any(), any()))
			.thenThrow(new RequestFailedException(504, "Server Error"));

		assertThatThrownBy(() -> buildKiteService.fetchPipelineSteps(MOCK_TOKEN, TEST_ORG_ID, TEST_PIPELINE_ID,
				PipelineStepsParam.builder().startTime(MOCK_START_TIME).endTime(MOCK_END_TIME).build()))
			.isInstanceOf(RequestFailedException.class)
			.hasMessageContaining("Server Error");
	}

	@Test
	public void shouldThrowInternalServerErrorExceptionWhenPageFetchPipelineStepsAndFetchNextPage5xxException() {
		List<String> linkHeader = new ArrayList<>();
		linkHeader.add(TOTAL_PAGE_HEADER);
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.addAll(HttpHeaders.LINK, linkHeader);
		List<BuildKiteBuildInfo> buildKiteBuildInfoList = new ArrayList<>();
		BuildKiteJob testJob = BuildKiteJob.builder().name(TEST_JOB_NAME).build();
		buildKiteBuildInfoList.add(BuildKiteBuildInfo.builder().jobs(List.of(testJob)).build());
		ResponseEntity<List<BuildKiteBuildInfo>> responseEntity = new ResponseEntity<>(buildKiteBuildInfoList,
				httpHeaders, HttpStatus.OK);
		when(buildKiteFeignClient.getPipelineSteps(anyString(), anyString(), anyString(), anyString(), anyString(),
				anyString(), anyString(), any()))
			.thenReturn(responseEntity);
		when(buildKiteFeignClient.getPipelineStepsInfo(anyString(), anyString(), anyString(), anyString(), anyString(),
				any(), any(), any()))
			.thenReturn(buildKiteBuildInfoList);

		assertThatThrownBy(() -> buildKiteService.fetchPipelineSteps(MOCK_TOKEN, TEST_ORG_ID, TEST_PIPELINE_ID,
				PipelineStepsParam.builder().build()))
			.isInstanceOf(InternalServerErrorException.class)
			.hasMessageContaining("Failed to get pipeline steps");

	}

	@Test
	public void shouldReturnOnePageStepsWhenPageFetchPipelineStepsAndHeaderParseOnePage() {
		PipelineStepsParam stepsParam = new PipelineStepsParam();
		stepsParam.setStartTime(MOCK_START_TIME);
		stepsParam.setEndTime(MOCK_END_TIME);
		List<String> linkHeader = new ArrayList<>();
		linkHeader.add(NONE_TOTAL_PAGE_HEADER);
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.addAll(HttpHeaders.LINK, linkHeader);
		List<BuildKiteBuildInfo> buildKiteBuildInfoList = new ArrayList<>();
		BuildKiteJob testJob = BuildKiteJob.builder().name(TEST_JOB_NAME).build();
		buildKiteBuildInfoList.add(BuildKiteBuildInfo.builder().jobs(List.of(testJob)).build());
		ResponseEntity<List<BuildKiteBuildInfo>> responseEntity = new ResponseEntity<>(buildKiteBuildInfoList,
				httpHeaders, HttpStatus.OK);
		when(buildKiteFeignClient.getPipelineSteps(anyString(), anyString(), anyString(), anyString(), anyString(),
				anyString(), anyString(), any()))
			.thenReturn(responseEntity);

		PipelineStepsDTO pipelineStepsDTO = buildKiteService.fetchPipelineSteps(MOCK_TOKEN, TEST_ORG_ID,
				TEST_PIPELINE_ID, stepsParam);

		assertNotNull(pipelineStepsDTO);
		assertThat(pipelineStepsDTO.getSteps().size()).isEqualTo(1);
		assertThat(pipelineStepsDTO.getSteps().get(0)).isEqualTo(TEST_JOB_NAME);
	}

	@Test
	public void shouldReturnOnePageStepsWhenPageFetchPipelineStep() {
		PipelineStepsParam stepsParam = new PipelineStepsParam();
		stepsParam.setStartTime(MOCK_START_TIME);
		stepsParam.setEndTime(MOCK_END_TIME);
		List<String> linkHeader = new ArrayList<>();
		linkHeader.add(NONE_TOTAL_PAGE_HEADER);
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.addAll(HttpHeaders.LINK, linkHeader);
		ResponseEntity<List<BuildKiteBuildInfo>> responseEntity = new ResponseEntity<>(null, httpHeaders,
				HttpStatus.OK);
		when(buildKiteFeignClient.getPipelineSteps(anyString(), anyString(), anyString(), anyString(), anyString(),
				anyString(), anyString(), any()))
			.thenReturn(responseEntity);

		PipelineStepsDTO pipelineStepsDTO = buildKiteService.fetchPipelineSteps(MOCK_TOKEN, TEST_ORG_ID,
				TEST_PIPELINE_ID, stepsParam);

		assertNotNull(pipelineStepsDTO);
		assertThat(pipelineStepsDTO.getSteps().size()).isEqualTo(0);
	}

	@Test
	public void shouldReturnBuildKiteBuildInfoWhenFetchPipelineBuilds() {
		DeploymentEnvironment mockDeployment = DeploymentEnvironmentBuilder.withDefault().build();
		List<String> linkHeader = new ArrayList<>();
		linkHeader.add(NONE_TOTAL_PAGE_HEADER);
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.addAll(HttpHeaders.LINK, linkHeader);
		ResponseEntity<List<BuildKiteBuildInfo>> responseEntity = new ResponseEntity<>(null, httpHeaders,
				HttpStatus.OK);
		when(buildKiteFeignClient.getPipelineSteps(anyString(), anyString(), anyString(), anyString(), anyString(),
				anyString(), anyString(), any()))
			.thenReturn(responseEntity);

		List<BuildKiteBuildInfo> pipelineBuilds = buildKiteService.fetchPipelineBuilds(MOCK_TOKEN, mockDeployment,
				MOCK_START_TIME, MOCK_END_TIME);

		assertNotNull(pipelineBuilds);
		assertThat(pipelineBuilds.size()).isEqualTo(0);
	}

	@Test
	public void shouldThrowUnauthorizedExceptionWhenFetchPipelineBuilds401Exception() {
		DeploymentEnvironment mockDeployment = DeploymentEnvironmentBuilder.withDefault().build();
		when(buildKiteFeignClient.getPipelineSteps(anyString(), anyString(), anyString(), anyString(), anyString(),
				anyString(), anyString(), any()))
			.thenThrow(new UnauthorizedException(UNAUTHORIZED_MSG));

		assertThatThrownBy(
				() -> buildKiteService.fetchPipelineBuilds(MOCK_TOKEN, mockDeployment, MOCK_START_TIME, MOCK_END_TIME))
			.isInstanceOf(UnauthorizedException.class)
			.hasMessageContaining(UNAUTHORIZED_MSG);
	}

	@Test
	public void shouldThrowInternalServerErrorExceptionWhenFetchPipelineBuilds500Exception() {
		DeploymentEnvironment mockDeployment = DeploymentEnvironmentBuilder.withDefault().build();
		List<String> linkHeader = new ArrayList<>();
		linkHeader.add(NONE_TOTAL_PAGE_HEADER);
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.addAll(HttpHeaders.LINK, linkHeader);
		ResponseEntity<List<BuildKiteBuildInfo>> responseEntity = new ResponseEntity<>(null, httpHeaders,
				HttpStatus.OK);
		when(buildKiteFeignClient.getPipelineSteps(anyString(), anyString(), anyString(), anyString(), anyString(),
				anyString(), anyString(), any()))
			.thenReturn(responseEntity);

		assertThatThrownBy(() -> buildKiteService.fetchPipelineBuilds(MOCK_TOKEN, mockDeployment, null, MOCK_END_TIME))
			.isInstanceOf(InternalServerErrorException.class)
			.hasMessageContaining("Failed to get pipeline builds_param");
	}

	@Test
	public void shouldReturnDeployTimesWhenCountDeployTimes() {
		DeploymentEnvironment mockDeployment = DeploymentEnvironmentBuilder.withDefault().build();
		List<BuildKiteBuildInfo> mockBuildKiteBuildInfos = List.of(BuildKiteBuildInfoBuilder.withDefault().build(),
				BuildKiteBuildInfoBuilder.withDefault()
					.withJobs(List.of(BuildKiteJobBuilder.withDefault().withState(PASSED_STATE).build()))
					.build(),
				BuildKiteBuildInfoBuilder.withDefault()
					.withJobs(List.of(BuildKiteJobBuilder.withDefault().withStartedAt("").build()))
					.build());
		DeployTimes expectedDeployTimes = DeployTimesBuilder.withDefault().build();

		DeployTimes deployTimes = buildKiteService.countDeployTimes(mockDeployment, mockBuildKiteBuildInfos,
				MOCK_START_TIME, MOCK_END_TIME);

		assertThat(expectedDeployTimes).isEqualTo(deployTimes);
	}

	@Test
	public void shouldReturnDeployInfoWhenMappedDeployInfoIsNull() {
		DeploymentEnvironment mockDeployment = DeploymentEnvironmentBuilder.withDefault().withStep("xxxx").build();
		List<BuildKiteBuildInfo> mockBuildKiteBuildInfos = List.of(BuildKiteBuildInfoBuilder.withDefault().build());

		DeployTimes deployTimes = buildKiteService.countDeployTimes(mockDeployment, mockBuildKiteBuildInfos,
				MOCK_START_TIME, MOCK_END_TIME);

		assertThat(0).isEqualTo(deployTimes.getPassed().size());
		assertThat(1).isEqualTo(deployTimes.getFailed().size());
	}

	@Test
	public void shouldThrowErrorWhenCountDeployTimesGivenOrgIdIsNull() {
		DeploymentEnvironment mockDeployment = DeploymentEnvironment.builder().build();
		List<BuildKiteBuildInfo> mockBuildKiteBuildInfos = List.of(BuildKiteBuildInfo.builder().build());

		Assertions
			.assertThatThrownBy(() -> buildKiteService.countDeployTimes(mockDeployment, mockBuildKiteBuildInfos,
					MOCK_START_TIME, MOCK_END_TIME))
			.isInstanceOf(NotFoundException.class)
			.hasMessageContaining("miss orgId argument");
	}

	@Test
	public void shouldReturnDeployTimesWhenCountDeployTimesAtFixedTimeIntervals() {
		DeploymentEnvironment mockDeployment = DeploymentEnvironmentBuilder.withDefault().build();
		List<BuildKiteBuildInfo> mockBuildKiteBuildInfos = List.of(BuildKiteBuildInfoBuilder.withDefault().build(),
				BuildKiteBuildInfoBuilder.withDefault()
					.withJobs(List.of(
							BuildKiteJobBuilder.withDefault()
								.withState(PASSED_STATE)
								.withFinishedAt("2023-09-09T04:57:09.545Z")
								.build(),
							BuildKiteJobBuilder.withDefault()
								.withState(PASSED_STATE)
								.withFinishedAt("2022-08-28T04:57:09.545Z")
								.build(),
							BuildKiteJobBuilder.withDefault()
								.withState(FAILED_STATE)
								.withFinishedAt("2022-07-21T04:57:09.545Z")
								.build(),
							BuildKiteJobBuilder.withDefault()
								.withState(FAILED_STATE)
								.withFinishedAt("2022-08-30T04:57:09.545Z")
								.build()))
					.build(),
				BuildKiteBuildInfoBuilder.withDefault()
					.withJobs(List.of(BuildKiteJobBuilder.withDefault().withStartedAt("").build()))
					.build());
		DeployTimes expectedDeployTimes = DeployTimesBuilder.withDefault()
			.withPassed(Collections.emptyList())
			.withFailed(List.of(DeployInfoBuilder.withDefault().withState(FAILED_STATE).build(),
					DeployInfoBuilder.withDefault()
						.withState(FAILED_STATE)
						.withJobFinishTime("2022-08-30T04:57:09.545Z")
						.build()))
			.build();

		DeployTimes deployTimes = buildKiteService.countDeployTimes(mockDeployment, mockBuildKiteBuildInfos,
				MOCK_START_TIME, MOCK_END_TIME);

		assertThat(expectedDeployTimes).isEqualTo(deployTimes);
	}

	@Test
	void shouldReturnStepBeforeEndStepsGivenStepsArray() {
		List<String> stepArray = Arrays.asList("Test", "Build", "Deploy qa", "Deploy prod");

		List<String> result = buildKiteService.getStepsBeforeEndStep("Deploy qa", stepArray);

		assertEquals(3, result.size());
		assertEquals("Test", result.get(0));
		assertEquals("Build", result.get(1));
		assertEquals("Deploy qa", result.get(2));
	}

	@Test
	void shouldReturnTrueWhenTokenIsCorrect() {
		BuildKiteTokenInfo buildKiteTokenInfo = BuildKiteTokenInfo.builder().scopes(PERMISSION_SCOPES).build();
		when(buildKiteFeignClient.getTokenInfo(any())).thenReturn(buildKiteTokenInfo);

		buildKiteService.verifyToken(MOCK_TOKEN);

		verify(buildKiteFeignClient, times(1)).getTokenInfo(anyString());
	}

	@Test
	void shouldThrowUnauthorizedExceptionWhenTokenIsIncorrect() {
		when(buildKiteFeignClient.getTokenInfo(any()))
			.thenThrow(new UnauthorizedException(UNAUTHORIZED_MSG));

		assertThatThrownBy(
			() -> buildKiteService.verifyToken(MOCK_TOKEN))
			.isInstanceOf(UnauthorizedException.class)
			.hasMessageContaining(UNAUTHORIZED_MSG);
	}

	@Test
	void shouldThrowInternalServerErrorExceptionWhenGetBuildKiteVerify500Exception() {
		when(buildKiteFeignClient.getTokenInfo(any())).thenReturn(null);

		assertThatThrownBy(() -> buildKiteService.verifyToken(MOCK_TOKEN))
			.isInstanceOf(InternalServerErrorException.class)
			.hasMessageContaining("Failed to call BuildKite, cause is");
	}

	@Test
	void shouldReturnBuildKiteResponseWhenGetBuildKiteInfo() throws IOException {
		PipelineParam pipelineParam = PipelineParam.builder()
			.token(MOCK_TOKEN)
			.startTime(MOCK_START_TIME)
			.endTime(MOCK_END_TIME)
			.build();
		ObjectMapper mapper = new ObjectMapper();
		List<BuildKitePipelineDTO> pipelineDTOS = mapper.readValue(
				new File("src/test/java/heartbeat/controller/pipeline/buildKitePipelineInfoData.json"),
				new TypeReference<>() {
				});
		when(buildKiteFeignClient.getBuildKiteOrganizationsInfo(any()))
			.thenReturn(List.of(BuildKiteOrganizationsInfo.builder().name(TEST_ORG_NAME).slug(TEST_ORG_ID).build()));
		when(buildKiteFeignClient.getPipelineInfo("Bearer mock_token", TEST_ORG_ID, "1", "100", MOCK_START_TIME,
				MOCK_END_TIME))
			.thenReturn(pipelineDTOS);

		BuildKiteResponseDTO buildKiteResponseDTO = buildKiteService.getBuildKiteInfo(pipelineParam);

		assertThat(buildKiteResponseDTO.getPipelineList().size()).isEqualTo(1);
		Pipeline pipeline = buildKiteResponseDTO.getPipelineList().get(0);
		assertThat(pipeline.getId()).isEqualTo("payment-selector-ui");
		assertThat(pipeline.getName()).isEqualTo("payment-selector-ui");
		assertThat(pipeline.getOrgId()).isEqualTo(TEST_ORG_ID);
		assertThat(pipeline.getOrgName()).isEqualTo(TEST_ORG_NAME);
		assertThat(pipeline.getRepository())
			.isEqualTo("https://github.com/XXXX-fs/fs-platform-payment-selector-ui.git");
		assertThat(pipeline.getSteps().size()).isEqualTo(1);
	}

	@Test
	void shouldThrowInternalServerErrorExceptionWhenGetBuildKiteInfo500Exception() {
		PipelineParam pipelineParam = PipelineParam.builder()
			.token(MOCK_TOKEN)
			.startTime(MOCK_START_TIME)
			.endTime(MOCK_END_TIME)
			.build();
		when(buildKiteFeignClient.getBuildKiteOrganizationsInfo(any())).thenReturn(null);
		when(buildKiteFeignClient.getPipelineInfo("Bearer mock_token", TEST_ORG_ID, "1", "100", MOCK_START_TIME,
				MOCK_END_TIME))
			.thenReturn(null);

		assertThatThrownBy(() -> buildKiteService.getBuildKiteInfo(pipelineParam))
			.isInstanceOf(InternalServerErrorException.class)
			.hasMessageContaining("Failed to call BuildKite, cause is");
	}

	@Test
	void shouldThrowUnauthorizedExceptionWhenGetBuildKiteInfoAndTokenIsIncorrect() {
		PipelineParam pipelineParam = PipelineParam.builder()
			.token(MOCK_TOKEN)
			.startTime(MOCK_START_TIME)
			.endTime(MOCK_END_TIME)
			.build();
		when(buildKiteFeignClient.getBuildKiteOrganizationsInfo(any()))
			.thenThrow(new UnauthorizedException(UNAUTHORIZED_MSG));

		assertThatThrownBy(() -> buildKiteService.getBuildKiteInfo(pipelineParam))
			.isInstanceOf(UnauthorizedException.class)
			.hasMessageContaining(UNAUTHORIZED_MSG);
	}

}
