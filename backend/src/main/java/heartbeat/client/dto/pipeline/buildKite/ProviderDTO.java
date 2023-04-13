package heartbeat.client.dto.pipeline.buildKite;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProviderDTO {

	private String id;

	private ProviderSettingsDTO settings;

	@JsonProperty("webhook_url")
	private String webhookUrl;

}
