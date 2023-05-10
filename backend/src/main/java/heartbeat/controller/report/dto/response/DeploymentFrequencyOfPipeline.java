package heartbeat.controller.report.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeploymentFrequencyOfPipeline {

	private String name;

	private String step;

	private double deploymentFrequency;

	private List<DeploymentDateCount> items;

}
