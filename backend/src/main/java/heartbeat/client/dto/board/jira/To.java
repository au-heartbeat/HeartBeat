package heartbeat.client.dto.board.jira;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class To implements Serializable {

	private String displayValue;

}
