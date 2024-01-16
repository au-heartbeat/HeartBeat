package heartbeat.controller.source;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import heartbeat.controller.source.dto.GitHubResponse;
import heartbeat.controller.source.dto.SourceControlDTO;
import heartbeat.controller.source.dto.VerifyBranchRequest;
import heartbeat.service.source.github.GitHubService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.AutoConfigureJsonTesters;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;

import java.util.LinkedHashSet;
import java.util.List;

import static heartbeat.TestFixtures.GITHUB_REPOSITORY;
import static heartbeat.TestFixtures.GITHUB_TOKEN;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(GithubController.class)
@ExtendWith(SpringExtension.class)
@AutoConfigureJsonTesters
class GithubControllerTest {

	public static final String BAD_SOURCE_TYPE = "GitHub";

	public static final String NORMAL_SOURCE_TYPE = "github";

	public static final String MAIN_BRANCH = "main";

	public static final String EMPTY_BRANCH_NAME = "  ";

	@MockBean
	private GitHubService gitHubVerifyService;

	@Autowired
	private MockMvc mockMvc;

	@Test
	@Deprecated
	void shouldReturnOkStatusAndCorrectResponseWithRepos() throws Exception {
		LinkedHashSet<String> repos = new LinkedHashSet<>(
				List.of("https://github.com/xxxx1/repo1", "https://github.com/xxxx2/repo2"));

		GitHubResponse githubReposResponse = GitHubResponse.builder().githubRepos(repos).build();

		when(gitHubVerifyService.verifyToken(any())).thenReturn(githubReposResponse);
		SourceControlDTO sourceControlDTO = SourceControlDTO.builder().token(GITHUB_TOKEN).build();

		mockMvc
			.perform(post("/source-control").content(new ObjectMapper().writeValueAsString(sourceControlDTO))
				.contentType(MediaType.APPLICATION_JSON))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.githubRepos[0]").value("https://github.com/xxxx1/repo1"))
			.andExpect(jsonPath("$.githubRepos[1]").value("https://github.com/xxxx2/repo2"));
	}

	@Test
	void shouldReturnNoContentStatusWhenVerifyToken() throws Exception {
		doNothing().when(gitHubVerifyService).verifyTokenV2(GITHUB_TOKEN);
		SourceControlDTO sourceControlDTO = SourceControlDTO.builder().token(GITHUB_TOKEN).build();

		mockMvc
			.perform(post("/source-control/{sourceType}/verify", NORMAL_SOURCE_TYPE)
				.content(new ObjectMapper().writeValueAsString(sourceControlDTO))
				.contentType(MediaType.APPLICATION_JSON))
			.andExpect(status().isNoContent());

		verify(gitHubVerifyService, times(1)).verifyTokenV2(GITHUB_TOKEN);
	}

	@Test
	void shouldReturnNoContentStatusWhenVerifyTargetBranch() throws Exception {
		VerifyBranchRequest verifyBranchRequest = VerifyBranchRequest.builder()
			.repository(GITHUB_REPOSITORY)
			.token(GITHUB_TOKEN)
			.build();
		doNothing().when(gitHubVerifyService).verifyCanReadTargetBranch(any(), any(), any());

		mockMvc
			.perform(
					post("/source-control/{sourceType}/repos/branches/{branch}/verify", NORMAL_SOURCE_TYPE, MAIN_BRANCH)
						.content(new ObjectMapper().writeValueAsString(verifyBranchRequest))
						.contentType(MediaType.APPLICATION_JSON))
			.andExpect(status().isNoContent());

		verify(gitHubVerifyService, times(1)).verifyCanReadTargetBranch(GITHUB_REPOSITORY, MAIN_BRANCH, GITHUB_TOKEN);
	}

	@Test
	void shouldReturnNoContentStatusGivenBranchWithSpecialCharactersWhenVerifyTargetBranch() throws Exception {
		VerifyBranchRequest verifyBranchRequest = VerifyBranchRequest.builder()
			.repository(GITHUB_REPOSITORY)
			.token(GITHUB_TOKEN)
			.build();
		doNothing().when(gitHubVerifyService).verifyCanReadTargetBranch(any(), any(), any());

		mockMvc
			.perform(post("/source-control/{sourceType}/repos/branches/{branch}/verify", NORMAL_SOURCE_TYPE,
					"fake%2Fmain")
				.content(new ObjectMapper().writeValueAsString(verifyBranchRequest))
				.contentType(MediaType.APPLICATION_JSON))
			.andExpect(status().isNoContent());

		verify(gitHubVerifyService, times(1)).verifyCanReadTargetBranch(GITHUB_REPOSITORY, "fake/main", GITHUB_TOKEN);
	}

	@Test
	@Deprecated
	void shouldReturnBadRequestWhenRequestBodyIsBlank() throws Exception {
		SourceControlDTO sourceControlDTO = SourceControlDTO.builder().token(null).build();

		final var response = mockMvc
			.perform(post("/source-control").content(new ObjectMapper().writeValueAsString(sourceControlDTO))
				.contentType(MediaType.APPLICATION_JSON))
			.andExpect(status().isBadRequest())
			.andReturn()
			.getResponse();

		final var content = response.getContentAsString();
		final var result = JsonPath.parse(content).read("$.token").toString();
		assertThat(result).contains("Token cannot be empty.");
	}

	@Test
	void shouldReturnBadRequestGivenRequestBodyIsNullWhenVerifyToken() throws Exception {
		SourceControlDTO sourceControlDTO = SourceControlDTO.builder().build();

		final var response = mockMvc
			.perform(post("/source-control/{sourceType}/verify", NORMAL_SOURCE_TYPE)
				.content(new ObjectMapper().writeValueAsString(sourceControlDTO))
				.contentType(MediaType.APPLICATION_JSON))
			.andExpect(status().isBadRequest())
			.andReturn()
			.getResponse();

		final var content = response.getContentAsString();
		final var result = JsonPath.parse(content).read("$.token").toString();
		assertThat(result).contains("Token cannot be empty.");
	}

	@Test
	void shouldReturnBadRequestGivenRequestBodyIsNullWhenVerifyBranch() throws Exception {
		VerifyBranchRequest verifyBranchRequest = VerifyBranchRequest.builder().build();

		final var response = mockMvc
			.perform(
					post("/source-control/{sourceType}/repos/branches/{branch}/verify", NORMAL_SOURCE_TYPE, MAIN_BRANCH)
						.content(new ObjectMapper().writeValueAsString(verifyBranchRequest))
						.contentType(MediaType.APPLICATION_JSON))
			.andExpect(status().isBadRequest())
			.andReturn()
			.getResponse();

		final var content = response.getContentAsString();
		final var result = JsonPath.parse(content).read("$.token").toString();
		assertThat(result).contains("Token cannot be empty.");
	}

	@Test
	void shouldReturnBadRequestGivenRepositoryIsNullWhenVerifyBranch() throws Exception {
		VerifyBranchRequest verifyBranchRequest = VerifyBranchRequest.builder().token(GITHUB_TOKEN).build();

		final var response = mockMvc
			.perform(
					post("/source-control/{sourceType}/repos/branches/{branch}/verify", NORMAL_SOURCE_TYPE, MAIN_BRANCH)
						.content(new ObjectMapper().writeValueAsString(verifyBranchRequest))
						.contentType(MediaType.APPLICATION_JSON))
			.andExpect(status().isBadRequest())
			.andReturn()
			.getResponse();

		final var content = response.getContentAsString();
		final var result = JsonPath.parse(content).read("$.repository").toString();
		assertThat(result).contains("Repository is required.");
	}

	@Test
	void shouldReturnBadRequestGivenSourceTypeIsWrongWhenVerifyToken() throws Exception {
		SourceControlDTO sourceControlDTO = SourceControlDTO.builder().token(GITHUB_TOKEN).build();

		mockMvc
			.perform(post("/source-control/{sourceType}/verify", BAD_SOURCE_TYPE)
				.content(new ObjectMapper().writeValueAsString(sourceControlDTO))
				.contentType(MediaType.APPLICATION_JSON))
			.andExpect(status().isBadRequest());
	}

	@Test
	void shouldReturnBadRequestGivenSourceTypeIsWrongWhenVerifyBranch() throws Exception {
		VerifyBranchRequest request = VerifyBranchRequest.builder()
			.repository(GITHUB_REPOSITORY)
			.token(GITHUB_TOKEN)
			.build();

		mockMvc
			.perform(post("/source-control/{sourceType}/repos/branches/{branch}/verify", BAD_SOURCE_TYPE, MAIN_BRANCH)
				.content(new ObjectMapper().writeValueAsString(request))
				.contentType(MediaType.APPLICATION_JSON))
			.andExpect(status().isBadRequest());
	}

	@Test
	void shouldReturnBadRequestGivenSourceTypeIsBlankWhenVerifyBranch() throws Exception {
		VerifyBranchRequest request = VerifyBranchRequest.builder()
			.token(GITHUB_TOKEN)
			.repository(GITHUB_REPOSITORY)
			.build();

		var response = mockMvc
			.perform(post("/source-control/{sourceType}/repos/branches/{branch}/verify", NORMAL_SOURCE_TYPE,
					EMPTY_BRANCH_NAME)
				.content(new ObjectMapper().writeValueAsString(request))
				.contentType(MediaType.APPLICATION_JSON))
			.andExpect(status().isBadRequest())
			.andReturn()
			.getResponse();

		final var content = response.getContentAsString();
		final var result = JsonPath.parse(content).read("$.message").toString();
		assertThat(result).contains("verifyBranch.branch: must not be blank");
	}

	@Test
	@Deprecated
	void shouldReturnBadRequestWhenRequestParamPatternIsIncorrect() throws Exception {
		SourceControlDTO sourceControlDTO = SourceControlDTO.builder().token("12345").build();

		final var response = mockMvc
			.perform(post("/source-control").content(new ObjectMapper().writeValueAsString(sourceControlDTO))
				.contentType(MediaType.APPLICATION_JSON))
			.andExpect(status().isBadRequest())
			.andReturn()
			.getResponse();

		final var content = response.getContentAsString();
		final var result = JsonPath.parse(content).read("$.token").toString();
		assertThat(result).isEqualTo("token's pattern is incorrect");
	}

	@ParameterizedTest
	@ValueSource(strings = { "12345", EMPTY_BRANCH_NAME, "" })
	void shouldReturnBadRequestGivenRequestParamPatternIsIncorrectWhenVerifyToken(String token) throws Exception {
		SourceControlDTO sourceControlDTO = SourceControlDTO.builder().token(token).build();

		final var response = mockMvc
			.perform(post("/source-control/{sourceType}/verify", NORMAL_SOURCE_TYPE)
				.content(new ObjectMapper().writeValueAsString(sourceControlDTO))
				.contentType(MediaType.APPLICATION_JSON))
			.andExpect(status().isBadRequest())
			.andReturn()
			.getResponse();

		final var content = response.getContentAsString();
		final var result = JsonPath.parse(content).read("$.token").toString();
		assertThat(result).isEqualTo("token's pattern is incorrect");
	}

	@ParameterizedTest
	@ValueSource(strings = { "12345", EMPTY_BRANCH_NAME, "" })
	void shouldReturnBadRequestGivenRequestParamPatternIsIncorrectWhenVerifyBranch(String token) throws Exception {
		VerifyBranchRequest request = VerifyBranchRequest.builder().token(token).build();

		final var response = mockMvc
			.perform(
					post("/source-control/{sourceType}/repos/branches/{branch}/verify", NORMAL_SOURCE_TYPE, MAIN_BRANCH)
						.content(new ObjectMapper().writeValueAsString(request))
						.contentType(MediaType.APPLICATION_JSON))
			.andExpect(status().isBadRequest())
			.andReturn()
			.getResponse();

		final var content = response.getContentAsString();
		final var result = JsonPath.parse(content).read("$.token").toString();
		assertThat(result).isEqualTo("token's pattern is incorrect");
	}

}
