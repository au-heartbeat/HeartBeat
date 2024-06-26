package heartbeat.service.report;

import heartbeat.controller.board.dto.request.StoryPointsAndCycleTimeRequest;
import heartbeat.controller.board.dto.response.CardCollection;
import heartbeat.controller.report.dto.request.GenerateReportRequest;
import heartbeat.controller.report.dto.request.JiraBoardSetting;
import heartbeat.service.board.jira.JiraService;
import heartbeat.service.report.calculator.model.FetchedData;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

@Service
@Log4j2
@RequiredArgsConstructor
public class KanbanService {

	private final JiraService jiraService;

	public FetchedData.CardCollectionInfo fetchDataFromKanban(GenerateReportRequest request) {
		log.info("--- Start to retrieve for un-done cards...");
		CardCollection nonDoneCardCollection = fetchNonDoneCardCollection(request);
		log.info("--- Complete to retrieve for un-done cards!");
		log.info("--- Start to retrieve for done cards...");
		CardCollection realDoneCardCollection = fetchRealDoneCardCollection(request);
		log.info("--- Complete to retrieve for done cards!");
		return FetchedData.CardCollectionInfo.builder()
			.realDoneCardCollection(realDoneCardCollection)
			.nonDoneCardCollection(nonDoneCardCollection)
			.build();
	}

	private CardCollection fetchRealDoneCardCollection(GenerateReportRequest request) {
		JiraBoardSetting jiraBoardSetting = request.getJiraBoardSetting();
		StoryPointsAndCycleTimeRequest storyPointsAndCycleTimeRequest = buildStoryPointsAndCycleTimeRequest(
				jiraBoardSetting, request.getStartTime(), request.getEndTime());
		return jiraService.getStoryPointsAndCycleTimeAndReworkInfoForDoneCards(storyPointsAndCycleTimeRequest,
				jiraBoardSetting.getBoardColumns(), jiraBoardSetting.getUsers(), jiraBoardSetting.getAssigneeFilter(),
				request.getTimezoneByZoneId());
	}

	private CardCollection fetchNonDoneCardCollection(GenerateReportRequest request) {
		JiraBoardSetting jiraBoardSetting = request.getJiraBoardSetting();
		StoryPointsAndCycleTimeRequest storyPointsAndCycleTimeRequest = buildStoryPointsAndCycleTimeRequest(
				jiraBoardSetting, request.getStartTime(), request.getEndTime());
		return jiraService.getStoryPointsAndCycleTimeForNonDoneCards(storyPointsAndCycleTimeRequest,
				jiraBoardSetting.getBoardColumns(), jiraBoardSetting.getUsers(), request.getTimezoneByZoneId());
	}

	private static StoryPointsAndCycleTimeRequest buildStoryPointsAndCycleTimeRequest(JiraBoardSetting jiraBoardSetting,
			String startTime, String endTime) {
		return StoryPointsAndCycleTimeRequest.builder()
			.token(jiraBoardSetting.getToken())
			.type(jiraBoardSetting.getType())
			.site(jiraBoardSetting.getSite())
			.project(jiraBoardSetting.getProjectKey())
			.boardId(jiraBoardSetting.getBoardId())
			.status(jiraBoardSetting.getDoneColumn())
			.startTime(startTime)
			.endTime(endTime)
			.targetFields(jiraBoardSetting.getTargetFields())
			.overrideFields(jiraBoardSetting.getOverrideFields())
			.treatFlagCardAsBlock(jiraBoardSetting.getTreatFlagCardAsBlock())
			.reworkTimesSetting(jiraBoardSetting.getReworkTimesSetting())
			.build();
	}

}
