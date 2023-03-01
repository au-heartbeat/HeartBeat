package heartbeat.service.jira;

import heartbeat.client.dto.FieldResponse;
import heartbeat.client.dto.IssueField;
import heartbeat.client.dto.Issuetype;
import heartbeat.client.dto.JiraBoardConfigDTO;
import heartbeat.client.dto.JiraColumn;
import heartbeat.client.dto.JiraColumnConfig;
import heartbeat.client.dto.JiraColumnStatus;
import heartbeat.client.dto.Project;
import heartbeat.controller.board.vo.response.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;

public class JiraBoardConfigDTOFixture {

	public static final String BOARD_ID = "123";

	public static final String BOARD_NAME = "jira";

	public static final String COLUM_SELF_ID_1 = "1";

	public static final String COLUM_SELF_ID_2 = "2";

	public static JiraBoardConfigDTO.JiraBoardConfigDTOBuilder JIRA_BOARD_CONFIG_RESPONSE_BUILDER() {
		return JiraBoardConfigDTO.builder().id(BOARD_ID).name(BOARD_NAME).columnConfig(JiraColumnConfig.builder()
				.columns(List.of(JiraColumn.builder().name("TODO")
						.statuses(List.of(new JiraColumnStatus(COLUM_SELF_ID_1), new JiraColumnStatus(COLUM_SELF_ID_2)))
						.build()))
				.build());
	}

	public static StatusSelf.StatusSelfBuilder DONE_STATUS_SELF_RESPONSE_BUILDER() {
		return StatusSelf.builder().untranslatedName("done").statusCategory(new StatusCategory("done", "done"));
	}

	public static StatusSelf.StatusSelfBuilder DOING_STATUS_SELF_RESPONSE_BUILDER() {
		return StatusSelf.builder().untranslatedName("doing").statusCategory(new StatusCategory("doing", "doing"));
	}

	public static AllDoneCardsResponse.AllDoneCardsResponseBuilder ALL_DONE_CARDS_RESPONSE_BUILDER() {
		return AllDoneCardsResponse.builder().total("2")
				.issues(List.of(new DoneCard("1", new Fields(new Assignee("Zhang San")))));
	}

	public static CardHistoryResponse.CardHistoryResponseBuilder CARD_HISTORY_RESPONSE_BUILDER() {
		return CardHistoryResponse.builder().items(List.of(new Item("assignee", new To("San Zhang"))));
	}

	public static FieldResponse.FieldResponseBuilder FIELD_RESPONSE_BUILDER(){
		IssueField issueField1 = new IssueField("summary","Summary");
		IssueField issueField2 = new IssueField("assignee","Assignee");
		HashMap<String, IssueField> issueFieldMap = new HashMap<>();
		issueFieldMap.put("issuetype",issueField1);
		issueFieldMap.put("issuetype",issueField2);
		return FieldResponse.builder().projects(List.of(new Project(List.of(new Issuetype(issueFieldMap)))));
	}
}
