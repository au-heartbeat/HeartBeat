package heartbeat.controller.report.dto.request;

import heartbeat.controller.pipeline.dto.request.DeploymentEnvironment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodebaseSetting {

	private String type;

	private String token;

	private List<DeploymentEnvironment> leadTime;

	private List<String> crews;

	private List<CodeBase> codebases;

}
