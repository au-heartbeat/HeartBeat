package heartbeat.service.report;

import heartbeat.client.component.JiraUriGenerator;
import heartbeat.client.dto.board.jira.JiraBoardConfigDTO;
import heartbeat.client.dto.board.jira.JiraCard;
import heartbeat.client.dto.board.jira.JiraCardField;
import heartbeat.client.dto.board.jira.Status;
import heartbeat.controller.board.dto.response.CardCollection;
import heartbeat.controller.board.dto.response.ColumnValue;
import heartbeat.controller.board.dto.response.CycleTimeInfo;
import heartbeat.controller.board.dto.response.JiraCardDTO;
import heartbeat.controller.board.dto.response.JiraColumnDTO;
import heartbeat.controller.board.dto.response.TargetField;
import heartbeat.controller.report.dto.request.GenerateReportRequest;
import heartbeat.controller.report.dto.request.JiraBoardSetting;
import heartbeat.controller.report.dto.response.BoardCSVConfig;
import heartbeat.service.board.jira.JiraColumnResult;
import heartbeat.service.board.jira.JiraService;
import org.assertj.core.util.Lists;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;

import static heartbeat.service.report.BoardCsvFixture.MOCK_JIRA_CARD;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class KanbanCsvServiceTest {

	@InjectMocks
	private KanbanCsvService kanbanCsvService;

	@Mock
	private CSVFileGenerator csvFileGenerator;

	@Mock
	private JiraService jiraService;

	@Mock
	private JiraUriGenerator urlGenerator;

	@Captor
	private ArgumentCaptor<List<JiraCardDTO>> jiraCardDTOCaptor;

	@Captor
	private ArgumentCaptor<List<BoardCSVConfig>> csvFieldsCaptor;

	@Captor
	private ArgumentCaptor<List<BoardCSVConfig>> csvNewFieldsCaptor;

	@Test
	void shouldSaveCsvWithoutNonDoneCardsWhenNonDoneCardIsNull() throws URISyntaxException {

		URI uri = new URI("site-uri");
		when(urlGenerator.getUri(any())).thenReturn(uri);
		when(jiraService.getJiraBoardConfig(any(), any(), any())).thenReturn(JiraBoardConfigDTO.builder().build());
		when(jiraService.getJiraColumns(any(), any(), any())).thenReturn(JiraColumnResult.builder().build());
		JiraCardDTO jiraCardDTO = JiraCardDTO.builder().build();
		kanbanCsvService.generateCsvInfo(
				GenerateReportRequest.builder()
					.jiraBoardSetting(JiraBoardSetting.builder()
						.targetFields(List.of(TargetField.builder().name("Doing").build(),
								TargetField.builder().name("Done").build()))
						.build())
					.build(),
				CardCollection.builder().jiraCardDTOList(List.of(jiraCardDTO)).build(),
				CardCollection.builder().build());

		verify(csvFileGenerator).convertBoardDataToCSV(jiraCardDTOCaptor.capture(), anyList(), any(), any());
		assertEquals(2, jiraCardDTOCaptor.getValue().size());
		assertTrue(jiraCardDTOCaptor.getValue().contains(jiraCardDTO));
	}

	@Test
	void shouldSaveCsvWithoutNonDoneCardsWhenNonDoneCardIsEmpty() throws URISyntaxException {

		URI uri = new URI("site-uri");
		when(urlGenerator.getUri(any())).thenReturn(uri);
		when(jiraService.getJiraBoardConfig(any(), any(), any())).thenReturn(JiraBoardConfigDTO.builder().build());
		when(jiraService.getJiraColumns(any(), any(), any())).thenReturn(JiraColumnResult.builder().build());
		JiraCardDTO jiraCardDTO = JiraCardDTO.builder().build();
		kanbanCsvService.generateCsvInfo(
				GenerateReportRequest.builder()
					.jiraBoardSetting(JiraBoardSetting.builder()
						.targetFields(List.of(TargetField.builder().name("Doing").build(),
								TargetField.builder().name("Done").build()))
						.build())
					.build(),
				CardCollection.builder().jiraCardDTOList(List.of(jiraCardDTO)).build(),
				CardCollection.builder().jiraCardDTOList(Lists.list()).build());

		verify(csvFileGenerator).convertBoardDataToCSV(jiraCardDTOCaptor.capture(), anyList(), any(), any());
		assertEquals(2, jiraCardDTOCaptor.getValue().size());
		assertTrue(jiraCardDTOCaptor.getValue().contains(jiraCardDTO));
	}

	@Test
	void shouldSaveCsvWithOrderedNonDoneCardsByJiraColumnDescendingWhenNonDoneCardIsNotEmpty()
			throws URISyntaxException {
		URI uri = new URI("site-uri");
		when(urlGenerator.getUri(any())).thenReturn(uri);
		when(jiraService.getJiraBoardConfig(any(), any(), any())).thenReturn(JiraBoardConfigDTO.builder().build());
		when(jiraService.getJiraColumns(any(), any(), any())).thenReturn(JiraColumnResult.builder()
			.jiraColumnResponse(List.of(
					JiraColumnDTO.builder().value(ColumnValue.builder().statuses(List.of("DOING")).build()).build(),
					JiraColumnDTO.builder().value(ColumnValue.builder().statuses(List.of("BLOCKED")).build()).build(),
					JiraColumnDTO.builder().value(ColumnValue.builder().statuses(List.of("TESTING")).build()).build(),
					JiraColumnDTO.builder().value(ColumnValue.builder().statuses(List.of("DONE")).build()).build()))
			.build());
		JiraCardDTO jiraCardDTO = JiraCardDTO.builder().build();
		JiraCardDTO blockedJiraCard = JiraCardDTO.builder()
			.baseInfo(JiraCard.builder()
				.fields(JiraCardField.builder().status(Status.builder().name("Blocked").build()).build())
				.build())
			.build();
		JiraCardDTO doingJiraCard = JiraCardDTO.builder()
			.baseInfo(JiraCard.builder()
				.fields(JiraCardField.builder().status(Status.builder().name("Doing").build()).build())
				.build())
			.build();
		JiraCardDTO testingJiraCard = JiraCardDTO.builder()
			.baseInfo(JiraCard.builder()
				.fields(JiraCardField.builder().status(Status.builder().name("Testing").build()).build())
				.build())
			.build();
		List<JiraCardDTO> NonDoneJiraCardDTOList = new ArrayList<>() {
			{
				add(blockedJiraCard);
				add(doingJiraCard);
				add(testingJiraCard);
			}
		};
		kanbanCsvService.generateCsvInfo(
				GenerateReportRequest.builder()
					.jiraBoardSetting(JiraBoardSetting.builder()
						.targetFields(List.of(TargetField.builder().name("Doing").build(),
								TargetField.builder().name("Done").build()))
						.build())
					.build(),
				CardCollection.builder().jiraCardDTOList(List.of(jiraCardDTO)).build(),
				CardCollection.builder().jiraCardDTOList(NonDoneJiraCardDTOList).build());

		verify(csvFileGenerator).convertBoardDataToCSV(jiraCardDTOCaptor.capture(), anyList(), any(), any());
		assertEquals(5, jiraCardDTOCaptor.getValue().size());
		assertEquals(testingJiraCard, jiraCardDTOCaptor.getValue().get(2));
		assertEquals(blockedJiraCard, jiraCardDTOCaptor.getValue().get(3));
		assertEquals(doingJiraCard, jiraCardDTOCaptor.getValue().get(4));
	}

	@Test
	void shouldSaveCsvWithoutOrderedNonDoneCardsByJiraColumnWhenNonDoneCardIsNotEmpty() throws URISyntaxException {
		URI uri = new URI("site-uri");
		when(urlGenerator.getUri(any())).thenReturn(uri);
		when(jiraService.getJiraBoardConfig(any(), any(), any())).thenReturn(JiraBoardConfigDTO.builder().build());
		when(jiraService.getJiraColumns(any(), any(), any())).thenReturn(JiraColumnResult.builder()
			.jiraColumnResponse(List.of(
					JiraColumnDTO.builder().value(ColumnValue.builder().statuses(List.of("Doing")).build()).build(),
					JiraColumnDTO.builder().value(ColumnValue.builder().statuses(List.of("Blocked")).build()).build(),
					JiraColumnDTO.builder().value(ColumnValue.builder().statuses(List.of("Testing")).build()).build(),
					JiraColumnDTO.builder().value(ColumnValue.builder().statuses(List.of("DONE")).build()).build()))
			.build());
		JiraCardDTO jiraCardDTO = JiraCardDTO.builder().build();
		JiraCardDTO blockedJiraCard = JiraCardDTO.builder()
			.baseInfo(JiraCard.builder()
				.fields(JiraCardField.builder().status(Status.builder().name("Blocked").build()).build())
				.build())
			.build();
		JiraCardDTO doingJiraCard = JiraCardDTO.builder()
			.baseInfo(JiraCard.builder()
				.fields(JiraCardField.builder().status(Status.builder().name("Doing").build()).build())
				.build())
			.build();
		JiraCardDTO testingJiraCard = JiraCardDTO.builder()
			.baseInfo(JiraCard.builder()
				.fields(JiraCardField.builder().status(Status.builder().name("Testing").build()).build())
				.build())
			.build();
		List<JiraCardDTO> NonDoneJiraCardDTOList = new ArrayList<>() {
			{
				add(blockedJiraCard);
				add(doingJiraCard);
				add(testingJiraCard);
			}
		};
		kanbanCsvService.generateCsvInfo(
				GenerateReportRequest.builder()
					.jiraBoardSetting(JiraBoardSetting.builder()
						.targetFields(List.of(TargetField.builder().name("Doing").build(),
								TargetField.builder().name("Done").build()))
						.build())
					.build(),
				CardCollection.builder().jiraCardDTOList(List.of(jiraCardDTO)).build(),
				CardCollection.builder().jiraCardDTOList(NonDoneJiraCardDTOList).build());

		verify(csvFileGenerator).convertBoardDataToCSV(jiraCardDTOCaptor.capture(), anyList(), any(), any());
		assertEquals(5, jiraCardDTOCaptor.getValue().size());
		assertEquals(blockedJiraCard, jiraCardDTOCaptor.getValue().get(2));
		assertEquals(doingJiraCard, jiraCardDTOCaptor.getValue().get(3));
		assertEquals(testingJiraCard, jiraCardDTOCaptor.getValue().get(4));
	}

	@Test
	void shouldSaveCsvWithOrderedNonDoneCardsByJiraColumnDescendingWhenNonDoneCardIsNotEmptyAndStatusIsNull()
			throws URISyntaxException {
		URI uri = new URI("site-uri");
		when(urlGenerator.getUri(any())).thenReturn(uri);
		when(jiraService.getJiraBoardConfig(any(), any(), any())).thenReturn(JiraBoardConfigDTO.builder().build());
		when(jiraService.getJiraColumns(any(), any(), any())).thenReturn(JiraColumnResult.builder()
			.jiraColumnResponse(List.of(
					JiraColumnDTO.builder().value(ColumnValue.builder().statuses(List.of("DOING")).build()).build(),
					JiraColumnDTO.builder().value(ColumnValue.builder().statuses(List.of("BLOCKED")).build()).build(),
					JiraColumnDTO.builder().value(ColumnValue.builder().statuses(List.of("TESTING")).build()).build(),
					JiraColumnDTO.builder().value(ColumnValue.builder().statuses(List.of("DONE")).build()).build()))
			.build());
		JiraCardDTO jiraCardDTO = JiraCardDTO.builder().build();
		JiraCardDTO blockedJiraCard = JiraCardDTO.builder()
			.baseInfo(JiraCard.builder()
				.fields(JiraCardField.builder().status(Status.builder().name("Blocked").build()).build())
				.build())
			.build();
		JiraCardDTO doingJiraCard = JiraCardDTO.builder()
			.baseInfo(JiraCard.builder().fields(JiraCardField.builder().build()).build())
			.build();
		JiraCardDTO testingJiraCard = JiraCardDTO.builder()
			.baseInfo(JiraCard.builder().fields(JiraCardField.builder().build()).build())
			.build();
		List<JiraCardDTO> NonDoneJiraCardDTOList = new ArrayList<>() {
			{
				add(doingJiraCard);
				add(blockedJiraCard);
				add(testingJiraCard);
			}
		};
		kanbanCsvService.generateCsvInfo(
				GenerateReportRequest.builder()
					.jiraBoardSetting(JiraBoardSetting.builder()
						.targetFields(List.of(TargetField.builder().name("Doing").build(),
								TargetField.builder().name("Done").build()))
						.build())
					.build(),
				CardCollection.builder().jiraCardDTOList(List.of(jiraCardDTO)).build(),
				CardCollection.builder().jiraCardDTOList(NonDoneJiraCardDTOList).build());

		verify(csvFileGenerator).convertBoardDataToCSV(jiraCardDTOCaptor.capture(), anyList(), any(), any());
		assertEquals(5, jiraCardDTOCaptor.getValue().size());
		assertEquals(doingJiraCard, jiraCardDTOCaptor.getValue().get(2));
		assertEquals(blockedJiraCard, jiraCardDTOCaptor.getValue().get(3));
		assertEquals(testingJiraCard, jiraCardDTOCaptor.getValue().get(4));
	}

	@Test
	void shouldAddFixedFieldsWhenItIsNotInSettingsFields() throws URISyntaxException {
		URI uri = new URI("site-uri");
		when(urlGenerator.getUri(any())).thenReturn(uri);
		when(jiraService.getJiraBoardConfig(any(), any(), any())).thenReturn(JiraBoardConfigDTO.builder().build());
		when(jiraService.getJiraColumns(any(), any(), any())).thenReturn(JiraColumnResult.builder()
			.jiraColumnResponse(List
				.of(JiraColumnDTO.builder().value(ColumnValue.builder().statuses(List.of("BLOCKED")).build()).build()))
			.build());
		JiraCardDTO jiraCardDTO = JiraCardDTO.builder()
			.baseInfo(JiraCard.builder().fields(MOCK_JIRA_CARD()).build())
			.build();
		JiraCardDTO blockedJiraCard = JiraCardDTO.builder()
			.baseInfo(JiraCard.builder().fields(MOCK_JIRA_CARD()).build())
			.build();
		List<JiraCardDTO> NonDoneJiraCardDTOList = new ArrayList<>() {
			{
				add(blockedJiraCard);
			}
		};
		kanbanCsvService.generateCsvInfo(
				GenerateReportRequest.builder()
					.jiraBoardSetting(JiraBoardSetting.builder()
						.targetFields(List.of(
								TargetField.builder().name("assignee").flag(true).key("key-assignee").build(),
								TargetField.builder().name("fake-target1").flag(true).key("key-target1").build(),
								TargetField.builder().name("fake-target2").flag(false).key("key-target2").build()))
						.build())
					.build(),
				CardCollection.builder().jiraCardDTOList(List.of(jiraCardDTO)).build(),
				CardCollection.builder().jiraCardDTOList(NonDoneJiraCardDTOList).build());

		verify(csvFileGenerator).convertBoardDataToCSV(anyList(), csvFieldsCaptor.capture(),
				csvNewFieldsCaptor.capture(), any());
		assertEquals(22, csvFieldsCaptor.getValue().size());
		BoardCSVConfig targetValue = csvNewFieldsCaptor.getValue().get(0);
		assertEquals("baseInfo.fields.customFields.key-target1", targetValue.getValue());
		assertEquals("fake-target1", targetValue.getLabel());
		assertEquals("key-target1", targetValue.getOriginKey());
	}

	@Test
	void shouldAddFixedFieldsWhenItIsNotInSettingsFieldsAndCardHasOriginCycleTime() throws URISyntaxException {
		URI uri = new URI("site-uri");
		when(urlGenerator.getUri(any())).thenReturn(uri);
		when(jiraService.getJiraBoardConfig(any(), any(), any())).thenReturn(JiraBoardConfigDTO.builder().build());
		when(jiraService.getJiraColumns(any(), any(), any())).thenReturn(JiraColumnResult.builder()
			.jiraColumnResponse(List
				.of(JiraColumnDTO.builder().value(ColumnValue.builder().statuses(List.of("BLOCKED")).build()).build()))
			.build());
		JiraCardDTO jiraCardDTO = JiraCardDTO.builder()
			.baseInfo(JiraCard.builder().fields(MOCK_JIRA_CARD()).build())
			.build();
		JiraCardDTO blockedJiraCard = JiraCardDTO.builder()
			.baseInfo(JiraCard.builder().fields(MOCK_JIRA_CARD()).build())
			.originCycleTime(List.of(CycleTimeInfo.builder().column("BLOCKED").day(30.7859).build()))
			.build();
		List<JiraCardDTO> NonDoneJiraCardDTOList = new ArrayList<>() {
			{
				add(blockedJiraCard);
			}
		};
		kanbanCsvService.generateCsvInfo(
				GenerateReportRequest.builder()
					.jiraBoardSetting(JiraBoardSetting.builder()
						.targetFields(List.of(
								TargetField.builder().name("assignee").flag(true).key("key-assignee").build(),
								TargetField.builder().name("fake-target1").flag(true).key("key-target1").build(),
								TargetField.builder().name("fake-target2").flag(false).key("key-target2").build()))
						.build())
					.build(),
				CardCollection.builder().jiraCardDTOList(List.of(jiraCardDTO)).build(),
				CardCollection.builder().jiraCardDTOList(NonDoneJiraCardDTOList).build());

		verify(csvFileGenerator).convertBoardDataToCSV(anyList(), csvFieldsCaptor.capture(), anyList(), any());
		assertEquals(23, csvFieldsCaptor.getValue().size());
		BoardCSVConfig targetValue = csvFieldsCaptor.getValue().get(22);
		assertEquals("cycleTimeFlat.BLOCKED", targetValue.getValue());
		assertEquals("OriginCycleTime: BLOCKED", targetValue.getLabel());
		assertNull(targetValue.getOriginKey());
	}

	@Test
	void shouldAddFixedFieldsWithCorrectValueFormatWhenCustomFieldValueInstanceOfListAndContainsStringKeyOrValueOrNameOrDisplayName()
			throws URISyntaxException {
		URI uri = new URI("site-uri");
		when(urlGenerator.getUri(any())).thenReturn(uri);
		when(jiraService.getJiraBoardConfig(any(), any(), any())).thenReturn(JiraBoardConfigDTO.builder().build());
		when(jiraService.getJiraColumns(any(), any(), any())).thenReturn(JiraColumnResult.builder()
			.jiraColumnResponse(List
				.of(JiraColumnDTO.builder().value(ColumnValue.builder().statuses(List.of("BLOCKED")).build()).build()))
			.build());
		JiraCardDTO jiraCardDTO = JiraCardDTO.builder()
			.baseInfo(JiraCard.builder().fields(MOCK_JIRA_CARD()).build())
			.build();
		JiraCardDTO blockedJiraCard = JiraCardDTO.builder()
			.baseInfo(JiraCard.builder().fields(MOCK_JIRA_CARD()).build())
			.build();
		List<JiraCardDTO> NonDoneJiraCardDTOList = new ArrayList<>() {
			{
				add(blockedJiraCard);
			}
		};
		kanbanCsvService.generateCsvInfo(
				GenerateReportRequest.builder()
					.jiraBoardSetting(JiraBoardSetting.builder()
						.targetFields(List.of(
								TargetField.builder().name("assignee").flag(true).key("key-assignee").build(),
								TargetField.builder().name("fake-target1").flag(true).key("customfield_1012").build(),
								TargetField.builder().name("fake-target2").flag(true).key("customfield_1013").build(),
								TargetField.builder().name("fake-target3").flag(true).key("customfield_1014").build(),
								TargetField.builder().name("fake-target4").flag(true).key("customfield_1015").build(),
								TargetField.builder().name("fake-target5").flag(false).key("key-target2").build()))
						.build())
					.build(),
				CardCollection.builder().jiraCardDTOList(List.of(jiraCardDTO)).build(),
				CardCollection.builder().jiraCardDTOList(NonDoneJiraCardDTOList).build());

		verify(csvFileGenerator).convertBoardDataToCSV(anyList(), csvFieldsCaptor.capture(),
				csvNewFieldsCaptor.capture(), any());

		assertEquals(25, csvFieldsCaptor.getValue().size());
		BoardCSVConfig targetValue1 = csvNewFieldsCaptor.getValue().get(0);
		BoardCSVConfig targetValue2 = csvNewFieldsCaptor.getValue().get(1);
		BoardCSVConfig targetValue3 = csvNewFieldsCaptor.getValue().get(2);
		BoardCSVConfig targetValue4 = csvNewFieldsCaptor.getValue().get(3);
		assertEquals("baseInfo.fields.customFields.customfield_1012[0].name", targetValue1.getValue());
		assertEquals("fake-target1", targetValue1.getLabel());
		assertEquals("customfield_1012", targetValue1.getOriginKey());
		assertEquals("baseInfo.fields.customFields.customfield_1013[0].value", targetValue2.getValue());
		assertEquals("baseInfo.fields.customFields.customfield_1014[0].key", targetValue3.getValue());
		assertEquals("baseInfo.fields.customFields.customfield_1015[0].displayName", targetValue4.getValue());
	}

}
