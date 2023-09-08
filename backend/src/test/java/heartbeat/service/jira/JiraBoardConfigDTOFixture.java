package heartbeat.service.jira;

import heartbeat.client.dto.board.jira.AllDoneCardsResponseDTO;
import heartbeat.client.dto.board.jira.Assignee;
import heartbeat.client.dto.board.jira.CardHistoryResponseDTO;
import heartbeat.client.dto.board.jira.FieldResponseDTO;
import heartbeat.client.dto.board.jira.HistoryDetail;
import heartbeat.client.dto.board.jira.IssueField;
import heartbeat.client.dto.board.jira.Issuetype;
import heartbeat.client.dto.board.jira.JiraBoardConfigDTO;
import heartbeat.client.dto.board.jira.JiraCard;
import heartbeat.client.dto.board.jira.JiraCardField;
import heartbeat.client.dto.board.jira.JiraColumn;
import heartbeat.client.dto.board.jira.JiraColumnConfig;
import heartbeat.client.dto.board.jira.JiraColumnStatus;
import heartbeat.client.dto.board.jira.Project;
import heartbeat.client.dto.board.jira.Status;
import heartbeat.client.dto.board.jira.StatusCategory;
import heartbeat.client.dto.board.jira.StatusSelfDTO;
import heartbeat.controller.board.dto.request.RequestJiraBoardColumnSetting;
import heartbeat.controller.board.dto.request.StoryPointsAndCycleTimeRequest;
import heartbeat.controller.board.dto.response.CycleTimeInfo;
import heartbeat.controller.board.dto.response.IssueType;
import heartbeat.controller.board.dto.response.TargetField;
import heartbeat.controller.report.dto.request.JiraBoardSetting;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;

public class JiraBoardConfigDTOFixture {

	public static final String BOARD_ID = "unknown";

	public static final String BOARD_NAME_JIRA = "jira";

	public static final String BOARD_NAME_CLASSIC_JIRA = "classic-jira";

	public static final String COLUM_SELF_ID_1 = "1";

	public static final String COLUM_SELF_ID_2 = "2";

	public static final String COLUM_SELF_ID_3 = "3";

	public static final String BLOCK = "Block";

	public static final String TESTING = "Testing";

	public static final String REVIEW = "Review";

	public static final String FLAG = "FLAG";

	public static final String UNKNOWN = "UNKNOWN";

	public static final String WAITING_FOR_TESTING = "Waiting for testing";

	public static final String ASSIGNEENAME = "Zhang San";

	public static JiraBoardConfigDTO.JiraBoardConfigDTOBuilder JIRA_BOARD_CONFIG_RESPONSE_BUILDER() {

		return JiraBoardConfigDTO.builder()
			.id(BOARD_ID)
			.name(BOARD_NAME_JIRA)
			.columnConfig(JiraColumnConfig.builder()
				.columns(List.of(JiraColumn.builder()
					.name("TODO")
					.statuses(List.of(new JiraColumnStatus(COLUM_SELF_ID_1), new JiraColumnStatus(COLUM_SELF_ID_2)))
					.build()))
				.build());
	}

	public static JiraBoardConfigDTO.JiraBoardConfigDTOBuilder CLASSIC_JIRA_BOARD_CONFIG_RESPONSE_BUILDER() {

		return JiraBoardConfigDTO.builder()
			.id(BOARD_ID)
			.name(BOARD_NAME_CLASSIC_JIRA)
			.columnConfig(JiraColumnConfig.builder()
				.columns(List.of(JiraColumn.builder()
					.name("TODO")
					.statuses(List.of(new JiraColumnStatus(COLUM_SELF_ID_1), new JiraColumnStatus(COLUM_SELF_ID_2),
							new JiraColumnStatus(COLUM_SELF_ID_3)))
					.build()))
				.build());
	}

	public static StatusSelfDTO.StatusSelfDTOBuilder DONE_STATUS_SELF_RESPONSE_BUILDER() {
		return StatusSelfDTO.builder().untranslatedName("done").statusCategory(new StatusCategory("done", "done"));
	}

	public static StatusSelfDTO.StatusSelfDTOBuilder REVIEW_STATUS_SELF_RESPONSE_BUILDER() {
		return StatusSelfDTO.builder()
			.untranslatedName("review")
			.statusCategory(new StatusCategory("review", "review"));
	}

	public static StatusSelfDTO.StatusSelfDTOBuilder COMPLETE_STATUS_SELF_RESPONSE_BUILDER() {
		return StatusSelfDTO.builder()
			.untranslatedName("complete")
			.statusCategory(new StatusCategory("done", "complete"));
	}

	public static StatusSelfDTO.StatusSelfDTOBuilder NONE_STATUS_SELF_RESPONSE_BUILDER() {
		return StatusSelfDTO.builder().untranslatedName("").statusCategory(new StatusCategory("", ""));
	}

	public static StatusSelfDTO.StatusSelfDTOBuilder DOING_STATUS_SELF_RESPONSE_BUILDER() {
		return StatusSelfDTO.builder().untranslatedName("doing").statusCategory(new StatusCategory("doing", "doing"));
	}

	public static AllDoneCardsResponseDTO.AllDoneCardsResponseDTOBuilder ALL_DONE_CARDS_RESPONSE_FOR_STORY_POINT_BUILDER() {
		return AllDoneCardsResponseDTO.builder()
			.total("2")
			.issues(List.of(
					new JiraCard("1",
							JiraCardField.builder().assignee(new Assignee(ASSIGNEENAME)).storyPoints(2).build()),
					new JiraCard("1",
							JiraCardField.builder().assignee(new Assignee(ASSIGNEENAME)).storyPoints(1).build()),
					new JiraCard("1", JiraCardField.builder().assignee(new Assignee(ASSIGNEENAME)).build()),
					new JiraCard("1",
							JiraCardField.builder().assignee(new Assignee(ASSIGNEENAME)).storyPoints(5).build()),
					new JiraCard("2",
							JiraCardField.builder().assignee(new Assignee(ASSIGNEENAME)).storyPoints(5).build())));
	}

	public static AllDoneCardsResponseDTO.AllDoneCardsResponseDTOBuilder ALL_NON_DONE_CARDS_RESPONSE_FOR_STORY_POINT_BUILDER() {
		return AllDoneCardsResponseDTO.builder()
			.total("3")
			.issues(List.of(
					new JiraCard("1",
							JiraCardField.builder()
								.assignee(new Assignee(ASSIGNEENAME))
								.issuetype(IssueType.builder().name("缺陷").build())
								.storyPoints(2)
								.build()),
					new JiraCard("2",
							JiraCardField.builder()
								.assignee(new Assignee(ASSIGNEENAME))
								.issuetype(IssueType.builder().name("缺陷").build())
								.storyPoints(1)
								.build()),
					new JiraCard("3",
							JiraCardField.builder()
								.assignee(new Assignee(ASSIGNEENAME))
								.issuetype(IssueType.builder().name("缺陷").build())
								.build())));
	}

	public static AllDoneCardsResponseDTO.AllDoneCardsResponseDTOBuilder ALL_DONE_TWO_PAGES_CARDS_RESPONSE_BUILDER() {
		return AllDoneCardsResponseDTO.builder()
			.total("200")
			.issues(List.of(new JiraCard("1", JiraCardField.builder().assignee(new Assignee(ASSIGNEENAME)).build())));
	}

	public static AllDoneCardsResponseDTO.AllDoneCardsResponseDTOBuilder ONE_PAGE_NO_DONE_CARDS_RESPONSE_BUILDER() {
		return AllDoneCardsResponseDTO.builder().total("1").issues(Collections.emptyList());
	}

	public static CardHistoryResponseDTO.CardHistoryResponseDTOBuilder CARD_HISTORY_RESPONSE_BUILDER() {
		return CardHistoryResponseDTO.builder()
			.items(List.of(new HistoryDetail(2, "status", new Status("In Dev"), new Status("To do")),
					new HistoryDetail(3, "status", new Status(REVIEW), new Status("In Dev")),
					new HistoryDetail(4, "status", new Status(WAITING_FOR_TESTING), new Status(REVIEW)),
					new HistoryDetail(5, "status", new Status(TESTING), new Status(WAITING_FOR_TESTING)),
					new HistoryDetail(1662642750003L, "status", new Status("Done"), new Status(TESTING))));
	}

	public static CardHistoryResponseDTO.CardHistoryResponseDTOBuilder CARD_HISTORY_RESPONSE_BUILDER_TO_DONE() {
		return CardHistoryResponseDTO.builder()
			.items(List.of(new HistoryDetail(2, "status", new Status("In Dev"), new Status("To do")),
					new HistoryDetail(3, "status", new Status(REVIEW), new Status("In Dev")),
					new HistoryDetail(4, "status", new Status(WAITING_FOR_TESTING), new Status(REVIEW)),
					new HistoryDetail(5, "status", new Status("DONE"), new Status(WAITING_FOR_TESTING))));
	}

	public static CardHistoryResponseDTO.CardHistoryResponseDTOBuilder CARD_HISTORY_RESPONSE_BUILDER_WITHOUT_STATUS() {
		return CardHistoryResponseDTO.builder()
			.items(List.of(new HistoryDetail(2, "assignee", new Status("In Dev"), new Status("To do")),
					new HistoryDetail(3, "assignee", new Status(REVIEW), new Status("In Dev")),
					new HistoryDetail(4, "assignee", new Status(WAITING_FOR_TESTING), new Status(REVIEW)),
					new HistoryDetail(5, "assignee", new Status(TESTING), new Status(WAITING_FOR_TESTING))));
	}

	public static CardHistoryResponseDTO.CardHistoryResponseDTOBuilder CARD_HISTORY_MULTI_RESPONSE_BUILDER() {
		return CardHistoryResponseDTO.builder()
			.items(List.of(new HistoryDetail(1, "status", new Status("To do"), new Status(BLOCK)),
					new HistoryDetail(2, "assignee", new Status("In Dev"), new Status("To do")),
					new HistoryDetail(3, "status", new Status(REVIEW), new Status("In Dev")),
					new HistoryDetail(4, "status", new Status(WAITING_FOR_TESTING), new Status(REVIEW)),
					new HistoryDetail(5, "status", new Status(TESTING), new Status(WAITING_FOR_TESTING)),
					new HistoryDetail(6, "status", new Status(BLOCK), new Status(TESTING)),
					new HistoryDetail(7, "status", new Status(FLAG), new Status(BLOCK)),
					new HistoryDetail(1672642750001L, "customfield_10021", new Status("Impediment"), new Status(FLAG)),
					new HistoryDetail(1672642750002L, "flagged", new Status("Impediment"), new Status("removeFlag")),
					new HistoryDetail(1672642750003L, "status", new Status("Done"), new Status(TESTING)),
					new HistoryDetail(1672642750004L, "status", new Status("Done"), new Status(TESTING)),
					new HistoryDetail(1672642750005L, "customfield_10021", new Status(UNKNOWN),
							new Status("removeFlag"))));
	}

	public static FieldResponseDTO.FieldResponseDTOBuilder FIELD_RESPONSE_BUILDER() {
		IssueField storyPointIssueField = new IssueField("customfield_10016", "Story point estimate");
		IssueField sprintIssueField = new IssueField("customfield_10020", "Sprint");
		IssueField flaggedIssueField = new IssueField("customfield_10021", "Flagged");
		HashMap<String, IssueField> issueFieldMap = new HashMap<>();
		issueFieldMap.put("customfield_10016", storyPointIssueField);
		issueFieldMap.put("customfield_10020", sprintIssueField);
		issueFieldMap.put("customfield_10021", flaggedIssueField);

		return FieldResponseDTO.builder().projects(List.of(new Project(List.of(new Issuetype(issueFieldMap)))));
	}

	public static FieldResponseDTO.FieldResponseDTOBuilder ALL_FIELD_RESPONSE_BUILDER() {
		IssueField timetrackingIssueField = new IssueField("timetracking", "Time tracking");
		IssueField summaryIssueField = new IssueField("summary", "Summary");
		IssueField descriptionIssueField = new IssueField("description", "Description");
		IssueField priorityIssueField = new IssueField("priority", "Priority");
		IssueField flaggedIssueField = new IssueField("customfield_10021", "Flagged");
		HashMap<String, IssueField> issueFieldMap = new HashMap<>();
		issueFieldMap.put("timetracking", timetrackingIssueField);
		issueFieldMap.put("summary", summaryIssueField);
		issueFieldMap.put("description", descriptionIssueField);
		issueFieldMap.put("priority", priorityIssueField);
		issueFieldMap.put("customfield_10021", flaggedIssueField);

		return FieldResponseDTO.builder().projects(List.of(new Project(List.of(new Issuetype(issueFieldMap)))));
	}

	public static JiraBoardSetting.JiraBoardSettingBuilder JIRA_BOARD_SETTING_BUILD() {
		return JiraBoardSetting.builder()
			.boardId(BOARD_ID)
			.boardColumns(List.of(RequestJiraBoardColumnSetting.builder().name("In Dev").value("In Dev").build(),
					RequestJiraBoardColumnSetting.builder()
						.name(WAITING_FOR_TESTING)
						.value(WAITING_FOR_TESTING)
						.build(),
					RequestJiraBoardColumnSetting.builder().name(BLOCK).value(BLOCK).build(),
					RequestJiraBoardColumnSetting.builder().name(TESTING).value(TESTING).build(),
					RequestJiraBoardColumnSetting.builder().name(REVIEW).value(REVIEW).build(),
					RequestJiraBoardColumnSetting.builder().name(FLAG).value(FLAG).build(),
					RequestJiraBoardColumnSetting.builder().name(UNKNOWN).value(UNKNOWN).build()))
			.token("token")
			.site("site")
			.doneColumn(List.of("DONE"))
			.treatFlagCardAsBlock(true)
			.type("jira")
			.projectKey("PLL")
			.targetFields(List.of(TargetField.builder().key("testKey1").name("Story Points").flag(true).build(),
					TargetField.builder().key("testKey2").name("Sprint").flag(true).build(),
					TargetField.builder().key("testKey3").name("Flagged").flag(true).build()));
	}

	public static JiraBoardSetting.JiraBoardSettingBuilder CLASSIC_JIRA_BOARD_SETTING_BUILD() {
		return JiraBoardSetting.builder()
			.boardId(BOARD_ID)
			.boardColumns(List.of(RequestJiraBoardColumnSetting.builder().name("In Dev").value("In Dev").build(),
					RequestJiraBoardColumnSetting.builder()
						.name(WAITING_FOR_TESTING)
						.value(WAITING_FOR_TESTING)
						.build(),
					RequestJiraBoardColumnSetting.builder().name(BLOCK).value(BLOCK).build(),
					RequestJiraBoardColumnSetting.builder().name(TESTING).value(TESTING).build(),
					RequestJiraBoardColumnSetting.builder().name(REVIEW).value(REVIEW).build(),
					RequestJiraBoardColumnSetting.builder().name(FLAG).value(FLAG).build(),
					RequestJiraBoardColumnSetting.builder().name(UNKNOWN).value(UNKNOWN).build()))
			.token("token")
			.site("site")
			.doneColumn(List.of("DONE_A", "DONE_B"))
			.treatFlagCardAsBlock(true)
			.type("classic-jira")
			.projectKey("PLL")
			.targetFields(List.of(TargetField.builder().key("testKey1").name("Story Points").flag(true).build(),
					TargetField.builder().key("testKey2").name("Sprint").flag(true).build(),
					TargetField.builder().key("testKey3").name("Flagged").flag(true).build()));
	}

	public static JiraBoardSetting.JiraBoardSettingBuilder INCORRECT_JIRA_BOARD_SETTING_BUILD() {
		return JiraBoardSetting.builder()
			.boardId(BOARD_ID)
			.boardColumns(List.of(RequestJiraBoardColumnSetting.builder().name("In Dev").value("In Dev").build(),
					RequestJiraBoardColumnSetting.builder()
						.name(WAITING_FOR_TESTING)
						.value(WAITING_FOR_TESTING)
						.build(),
					RequestJiraBoardColumnSetting.builder().name(BLOCK).value(BLOCK).build(),
					RequestJiraBoardColumnSetting.builder().name(TESTING).value(TESTING).build(),
					RequestJiraBoardColumnSetting.builder().name(REVIEW).value(REVIEW).build(),
					RequestJiraBoardColumnSetting.builder().name(FLAG).value(FLAG).build(),
					RequestJiraBoardColumnSetting.builder().name(UNKNOWN).value(UNKNOWN).build()))
			.token("token")
			.site("site")
			.doneColumn(List.of("DONE_A", "DONE_B"))
			.treatFlagCardAsBlock(true)
			.type(BOARD_ID)
			.projectKey("PLL")
			.targetFields(List.of(TargetField.builder().key("testKey1").name("Story Points").flag(true).build(),
					TargetField.builder().key("testKey2").name("Sprint").flag(true).build(),
					TargetField.builder().key("testKey3").name("Flagged").flag(true).build()));
	}

	public static JiraBoardSetting.JiraBoardSettingBuilder JIRA_BOARD_SETTING_HAVE_UNKNOWN_COLUMN_BUILD() {
		return JiraBoardSetting.builder()
			.boardId("jira")
			.boardColumns(List.of(RequestJiraBoardColumnSetting.builder().name("In Dev").value("In Dev").build(),
					RequestJiraBoardColumnSetting.builder()
						.name(WAITING_FOR_TESTING)
						.value(WAITING_FOR_TESTING)
						.build(),
					RequestJiraBoardColumnSetting.builder().name(BLOCK).value(BLOCK).build(),
					RequestJiraBoardColumnSetting.builder().name(TESTING).value(TESTING).build(),
					RequestJiraBoardColumnSetting.builder().name(REVIEW).value(REVIEW).build(),
					RequestJiraBoardColumnSetting.builder().name(FLAG).value(FLAG).build(),
					RequestJiraBoardColumnSetting.builder().name("xxxx").value("xxxx").build()))
			.token("token")
			.site("site")
			.doneColumn(List.of("DONE"))
			.treatFlagCardAsBlock(true)
			.type("jira")
			.projectKey("PLL")
			.targetFields(List.of(TargetField.builder().key("testKey").name("Story Points").flag(true).build(),
					TargetField.builder().key("testKey").name("Sprint").flag(true).build(),
					TargetField.builder().key("testKey").name("Flagged").flag(true).build()));
	}

	public static StoryPointsAndCycleTimeRequest.StoryPointsAndCycleTimeRequestBuilder STORY_POINTS_FORM_ALL_DONE_CARD() {
		JiraBoardSetting jiraBoardSetting = JIRA_BOARD_SETTING_BUILD().build();
		return StoryPointsAndCycleTimeRequest.builder()
			.token("token")
			.type(jiraBoardSetting.getType())
			.site(jiraBoardSetting.getSite())
			.project(jiraBoardSetting.getProjectKey())
			.boardId(jiraBoardSetting.getBoardId())
			.status(jiraBoardSetting.getDoneColumn())
			.startTime("1672556350000")
			.endTime("1676908799000")
			.targetFields(jiraBoardSetting.getTargetFields())
			.treatFlagCardAsBlock(jiraBoardSetting.getTreatFlagCardAsBlock());
	}

	public static StoryPointsAndCycleTimeRequest.StoryPointsAndCycleTimeRequestBuilder CLASSIC_JIRA_STORY_POINTS_FORM_ALL_DONE_CARD() {
		JiraBoardSetting jiraBoardSetting = CLASSIC_JIRA_BOARD_SETTING_BUILD().build();
		return StoryPointsAndCycleTimeRequest.builder()
			.token("token")
			.type(jiraBoardSetting.getType())
			.site(jiraBoardSetting.getSite())
			.project(jiraBoardSetting.getProjectKey())
			.boardId(jiraBoardSetting.getBoardId())
			.status(List.of("Done"))
			.startTime("1672556350000")
			.endTime("1676908799000")
			.targetFields(jiraBoardSetting.getTargetFields())
			.treatFlagCardAsBlock(jiraBoardSetting.getTreatFlagCardAsBlock());
	}

	public static StoryPointsAndCycleTimeRequest.StoryPointsAndCycleTimeRequestBuilder INCORRECT_JIRA_STORY_POINTS_FORM_ALL_DONE_CARD() {
		JiraBoardSetting jiraBoardSetting = INCORRECT_JIRA_BOARD_SETTING_BUILD().build();
		return StoryPointsAndCycleTimeRequest.builder()
			.token("token")
			.type(jiraBoardSetting.getType())
			.site(jiraBoardSetting.getSite())
			.project(jiraBoardSetting.getProjectKey())
			.boardId(jiraBoardSetting.getBoardId())
			.status(jiraBoardSetting.getDoneColumn())
			.startTime("1672556350000")
			.endTime("1676908799000")
			.targetFields(jiraBoardSetting.getTargetFields())
			.treatFlagCardAsBlock(jiraBoardSetting.getTreatFlagCardAsBlock());
	}

	public static StoryPointsAndCycleTimeRequest.StoryPointsAndCycleTimeRequestBuilder STORY_POINTS_FORM_ALL_DONE_CARD_WITH_EMPTY_STATUS() {
		JiraBoardSetting jiraBoardSetting = JIRA_BOARD_SETTING_BUILD().build();
		return StoryPointsAndCycleTimeRequest.builder()
			.token("token")
			.type(jiraBoardSetting.getType())
			.site(jiraBoardSetting.getSite())
			.project(jiraBoardSetting.getProjectKey())
			.boardId(jiraBoardSetting.getBoardId())
			.status(Collections.emptyList())
			.startTime("1672556350000")
			.endTime("1676908799000")
			.targetFields(jiraBoardSetting.getTargetFields())
			.treatFlagCardAsBlock(jiraBoardSetting.getTreatFlagCardAsBlock());
	}

	public static List<CycleTimeInfo> CYCLE_TIME_INFO_LIST() {
		return List.of(CycleTimeInfo.builder().column("WAITING FOR TESTING").day(1.0).build(),
				CycleTimeInfo.builder().column("TESTING").day(2.0).build(),
				CycleTimeInfo.builder().column("IN DEV").day(3.0).build(),
				CycleTimeInfo.builder().column("REVIEW").day(4.0).build(),
				CycleTimeInfo.builder().column(UNKNOWN).day(5.0).build(),
				CycleTimeInfo.builder().column(FLAG).day(6.0).build());
	}

}
