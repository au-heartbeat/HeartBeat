package heartbeat.client.dto.codebase.github;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Commit implements Serializable {

	private Author author;

	private Committer committer;

	private String message;

	private Tree tree;

	private String url;

	@JsonProperty("comment_count")
	private Integer commentCount;

	private Verification verification;

}
