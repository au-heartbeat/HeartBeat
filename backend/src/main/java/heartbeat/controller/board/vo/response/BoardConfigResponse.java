package heartbeat.controller.board.vo.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BoardConfigResponse {

	private String id;

	private String name;

}
