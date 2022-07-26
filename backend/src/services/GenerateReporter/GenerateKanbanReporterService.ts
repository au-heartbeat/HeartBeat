import {
  GenerateReportRequest,
  RequestKanbanColumnSetting,
  RequestKanbanSetting,
} from "../../contract/GenerateReporter/GenerateReporterRequestBody";
import { StoryPointsAndCycleTimeRequest } from "../../contract/kanban/KanbanStoryPointParameterVerify";
import { JiraCardResponse } from "../../contract/kanban/KanbanStoryPointResponse";
import { Cards } from "../../models/kanban/RequestKanbanResults";
import { Sprint } from "../../models/kanban/Sprint";
import { CalculateCardCycleTime } from "../kanban/CalculateCycleTime";
import { Jira } from "../kanban/Jira/Jira";
import { Kanban, KanbanEnum, KanbanFactory } from "../kanban/Kanban";

const KanbanKeyIdentifierMap: { [key: string]: "projectKey" | "teamName" } = {
  [KanbanEnum.CLASSIC_JIRA]: "projectKey",
  [KanbanEnum.JIRA]: "projectKey",
  [KanbanEnum.LINEAR]: "teamName",
};

export class GenerateKanbanReporterService {
  private cards?: Cards;
  async fetchIterationInfoFromKanban(
    request: GenerateReportRequest
  ): Promise<void> {
    const kanbanSetting: RequestKanbanSetting = request.kanbanSetting;
    const kanban: Kanban = KanbanFactory.getKanbanInstantiateObject(
      kanbanSetting.type,
      kanbanSetting.token,
      kanbanSetting.site
    );
    let model: StoryPointsAndCycleTimeRequest =
      new StoryPointsAndCycleTimeRequest(
        kanbanSetting.token,
        kanbanSetting.type,
        kanbanSetting.site,
        kanbanSetting[KanbanKeyIdentifierMap[kanbanSetting.type]],
        kanbanSetting.boardId,
        kanbanSetting.doneColumn,
        request.startTime,
        request.endTime,
        kanbanSetting.targetFields,
        kanbanSetting.treatFlagCardAsBlock
      );
    this.cards = await kanban.getStoryPointsAndCycleTime(
      model,
      kanbanSetting.boardColumns,
      kanbanSetting.users
    );
    if (kanban instanceof Jira) {
      let sprintCardMap: Map<string, JiraCardResponse[]> =
        this.mapCardsByIteration(this.cards.matchedCards);
      let sprintPercentageMap: Map<string, any> =
        this.calculateIterationBlockedAndDevelopingPercentage(
          sprintCardMap,
          kanbanSetting.boardColumns
        );
      let sprints: Sprint[] = await kanban.getAllSprintsByBoardId(model);
      let sortedPercentageList = this.sortBySprintCompletedDate(
        sprintPercentageMap,
        sprints
      );
    }
  }
  mapCardsByIteration(
    cards: JiraCardResponse[]
  ): Map<string, JiraCardResponse[]> {
    const mapIterationCards = new Map<string, JiraCardResponse[]>();

    for (const card of cards) {
      const sprint = card.baseInfo.fields.sprint;
      if (sprint) {
        if (!mapIterationCards.has(sprint)) {
          mapIterationCards.set(sprint, []);
        }

        mapIterationCards.get(sprint)!.push(card);
      }
    }

    return mapIterationCards;
  }

  calculateCardsBlockedPercentage(
    cards: JiraCardResponse[],
    boardColumns: RequestKanbanColumnSetting[] = []
  ): number {
    let totalCycleTime = 0;
    let totalBlockedTime = 0;

    for (const card of cards) {
      const cardCycleTime = CalculateCardCycleTime(card, boardColumns);
      totalCycleTime += cardCycleTime.total;
      totalBlockedTime += cardCycleTime.steps.blocked;
    }

    const blockedPercentage = totalBlockedTime / totalCycleTime;
    const blockedPercentageWith2Decimal = parseFloat(
      (Math.floor(blockedPercentage * 100) / 100).toFixed(2)
    );
    return blockedPercentageWith2Decimal;
  }

  calculateIterationBlockedAndDevelopingPercentage(
    mapIterationCards: Map<string, JiraCardResponse[]>,
    boardColumns: RequestKanbanColumnSetting[] = []
  ): Map<string, any> {
    const mapIterationBlockedPercentage = new Map<string, any>();

    mapIterationCards.forEach(
      (cards: JiraCardResponse[], iteration: string) => {
        const blockedPercentage = this.calculateCardsBlockedPercentage(
          cards,
          boardColumns
        );
        mapIterationBlockedPercentage.set(iteration, {
          blockedPercentage,
          developingPercentage: 1 - blockedPercentage,
        });
      }
    );

    return mapIterationBlockedPercentage;
  }

  sortBySprintCompletedDate(
    percentageMap: Map<string, any>,
    sprints: Sprint[]
  ): Array<any> {
    let sortedPercentage: Array<any> = [];
    let sortedSprints = sprints
      .filter((sprint) => sprint.startDate)
      .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate));
    sortedSprints.forEach((sprint) => {
      let percentages = percentageMap.get(sprint.name);
      if (percentages)
        sortedPercentage.push({
          sprint: sprint.name,
          percentages,
        });
    });
    return sortedPercentage;
  }
}
