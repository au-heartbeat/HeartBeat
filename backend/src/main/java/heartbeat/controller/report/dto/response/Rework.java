package heartbeat.controller.report.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Rework {

	private Integer totalReworkTimes;

	private String reworkState;

	private Integer fromToDo;

	private Integer fromInDev;

	private Integer fromBlock;

	private Integer fromWaitingForTesting;

	private Integer fromTesting;

	private Integer fromReview;

	private Integer fromDone;

	private Integer totalReworkCards;

	private Double reworkCardsRatio;

}
