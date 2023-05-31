package heartbeat.controller.report;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import heartbeat.controller.report.dto.request.GenerateReportRequest;
import heartbeat.service.report.GenerateReporterService;
import heartbeat.controller.report.dto.response.AvgDeploymentFrequency;
import heartbeat.controller.report.dto.response.DeploymentFrequency;
import heartbeat.controller.report.dto.response.ReportResponse;
import heartbeat.controller.report.dto.response.Velocity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.AutoConfigureJsonTesters;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;

import java.io.File;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(GenerateReportController.class)
@ExtendWith(SpringExtension.class)
@AutoConfigureJsonTesters
class GenerateReporterControllerTest {

	@MockBean
	private GenerateReporterService generateReporterService;

	@Autowired
	private MockMvc mockMvc;

	@Test
	void shouldReturnOkStatusAndCorrectResponseWithRepos() throws Exception {
		ReportResponse expectedResponse = ReportResponse.builder()
			.velocity(Velocity.builder().velocityForSP(10).build())
			.deploymentFrequency(DeploymentFrequency.builder()
				.avgDeploymentFrequency(new AvgDeploymentFrequency("Average", 0.10F))
				.build())
			.build();

		ObjectMapper mapper = new ObjectMapper();
		GenerateReportRequest request = mapper
			.readValue(new File("src/test/java/heartbeat/controller/report/request.json"), GenerateReportRequest.class);

		when(generateReporterService.generateReporter(request)).thenReturn(expectedResponse);

		MockHttpServletResponse response = mockMvc
			.perform(post("/reports").contentType(MediaType.APPLICATION_JSON)
				.content(mapper.writeValueAsString(request)))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse();

		final var resultVelocity = JsonPath.parse(response.getContentAsString())
			.read("$.velocity.velocityForSP")
			.toString();
		assertThat(resultVelocity).contains("10");

		final var resultDeployment = JsonPath.parse(response.getContentAsString())
			.read("$.deploymentFrequency.avgDeploymentFrequency.deploymentFrequency")
			.toString();
		assertThat(resultDeployment).contains("0.1");
	}

}
