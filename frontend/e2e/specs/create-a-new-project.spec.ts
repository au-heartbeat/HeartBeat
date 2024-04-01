import { config as configStepDataStatusMapping } from '../fixtures/createNew/configStepStatusMappingTest';
import { BOARD_METRICS_RESULT, DORA_METRICS_RESULT } from '../fixtures/createNew/reportResult';
import { testFixtureFile } from '../fixtures/testFixtureFile/test-fixture-file';
import { config as metricsStepData } from '../fixtures/createNew/metricsStep';
import { config as configStepData } from '../fixtures/createNew/configStep';
import { ProjectCreationType } from 'e2e/pages/metrics/ReportStep';
import { test } from '../fixtures/testWithExtendFixtures';
import { clearTempDir } from 'e2e/utils/clearTempDir';
import { format } from 'e2e/utils/dateTime';

test.beforeAll(async () => {
  await clearTempDir();
});

test('Create a new project', async ({ homePage, configStep, metricsStep, reportStep }) => {
  const dateRange = {
    startDate: format(configStepData.dateRange.startDate),
    endDate: format(configStepData.dateRange.endDate),
  };
  const hbStateData = metricsStepData.cycleTime.jiraColumns.map(
    (jiraToHBSingleMap) => Object.values(jiraToHBSingleMap)[0],
  );
  const hbStateDataEmptyByStatus = testFixtureFile.cycleTimeByStatus.jiraColumnsEmptyByStatus.map(
    (jiraToHBSingleMap) => Object.values(jiraToHBSingleMap)[0],
  );

  await homePage.goto();
  await homePage.createANewProject();
  await configStep.waitForShown();
  await configStep.typeInProjectName(configStepData.projectName);
  await configStep.clickPreviousButtonThenGoHome();
  await homePage.createANewProject();
  await configStep.typeInProjectName(configStepData.projectName);
  await configStep.selectRegularCalendar(configStepData.calendarType);
  await configStep.typeInDateRange(dateRange);
  await configStep.selectAllRequiredMetrics();
  await configStep.checkBoardFormVisible();
  await configStep.checkPipelineToolFormVisible();
  await configStep.checkSourceControlFormVisible();
  await configStep.fillAndverifyBoardConfig(configStepData.board);
  await configStep.resetBoardConfig();
  await configStep.fillAndverifyBoardConfig(configStepData.board);
  await configStep.fillAndVerifyPipelineToolForm(configStepData.pipelineTool);
  await configStep.fillAndVerifySourceControlForm(configStepData.sourceControl);
  await configStep.saveConfigStepAsJSONThenVerifyDownloadFile(configStepData);
  await configStep.validateNextButtonClickable();
  await configStep.goToMetrics();

  await metricsStep.waitForShown();
  await metricsStep.validateNextButtonNotClickable();
  await metricsStep.checkBoardConfigurationVisible();
  await metricsStep.checkPipelineConfigurationVisible();
  await metricsStep.checkLastAssigneeCrewFilterChecked();
  await metricsStep.checkCycleTimeConsiderCheckboxChecked();
  await metricsStep.checkCycleTimeSettingIsByColumn();
  await metricsStep.waitForHiddenLoading();
  await metricsStep.selectCrews(metricsStepData.crews);

  await metricsStep.selectCycleTimeSettingsType(metricsStepData.cycleTime.type);
  await metricsStep.checkHeartbeatStateIsSet(hbStateDataEmptyByStatus, true);

  await metricsStep.selectCycleTimeSettingsType(testFixtureFile.cycleTimeByStatus.type);
  await metricsStep.checkHeartbeatStateIsSet(hbStateDataEmptyByStatus, false);
  await metricsStep.selectHeartbeatState(hbStateData, false);
  await metricsStep.checkHeartbeatStateIsSet(hbStateData, false);

  await metricsStep.selectCycleTimeSettingsType(metricsStepData.cycleTime.type);
  await metricsStep.selectHeartbeatState(hbStateData, true);
  await metricsStep.checkHeartbeatStateIsSet(hbStateData, true);

  await metricsStep.selectClassifications(metricsStepData.classification);
  await metricsStep.selectDefaultGivenPipelineSetting(metricsStepData.deployment);
  await metricsStep.selectGivenPipelineCrews(metricsStepData.pipelineCrews);
  await metricsStep.selectReworkSettings(metricsStepData.reworkTimesSettings);
  await metricsStep.saveConfigStepAsJSONThenVerifyDownloadFile(metricsStepData);
  await metricsStep.goToReportPage();

  await reportStep.confirmGeneratedReport();
  await reportStep.checkBoardMetrics(
    BOARD_METRICS_RESULT.Velocity,
    BOARD_METRICS_RESULT.Throughput,
    BOARD_METRICS_RESULT.AverageCycleTime4SP,
    BOARD_METRICS_RESULT.AverageCycleTime4Card,
    BOARD_METRICS_RESULT.totalReworkTimes,
    BOARD_METRICS_RESULT.totalReworkCards,
    BOARD_METRICS_RESULT.reworkCardsRatio,
    BOARD_METRICS_RESULT.throughput,
  );
  await reportStep.checkBoardMetricsDetails(ProjectCreationType.CREATE_A_NEW_PROJECT, 9);
  await reportStep.checkDoraMetrics(
    DORA_METRICS_RESULT.PrLeadTime,
    DORA_METRICS_RESULT.PipelineLeadTime,
    DORA_METRICS_RESULT.TotalLeadTime,
    DORA_METRICS_RESULT.DeploymentFrequency,
    DORA_METRICS_RESULT.FailureRate,
    DORA_METRICS_RESULT.DevMeanTimeToRecovery,
  );
  await reportStep.checkDoraMetricsDetails(ProjectCreationType.CREATE_A_NEW_PROJECT);
  await reportStep.checkMetricDownloadData();
});

test('Create a new project with cycle time by status', async ({ homePage, configStep, metricsStep, reportStep }) => {
  const dateRange = {
    startDate: format(configStepDataStatusMapping.dateRangeForStatusMappingTest.startDate),
    endDate: format(configStepDataStatusMapping.dateRangeForStatusMappingTest.endDate),
  };
  const hbStateDataEmptyByStatus = testFixtureFile.cycleTimeByStatus.jiraColumnsEmptyByStatus.map(
    (jiraToHBSingleMap) => Object.values(jiraToHBSingleMap)[0],
  );
  const hbStateDataByStatus = testFixtureFile.cycleTimeByStatus.jiraColumns.map(
    (jiraToHBSingleMap) => Object.values(jiraToHBSingleMap)[0],
  );

  await homePage.goto();
  await homePage.createANewProject();
  await configStep.typeInProjectName(configStepDataStatusMapping.projectName);
  await configStep.selectRegularCalendar(configStepDataStatusMapping.calendarType);
  await configStep.typeInDateRange(dateRange);
  await configStep.selectAllRequiredMetrics();
  await configStep.checkBoardFormVisible();
  await configStep.checkPipelineToolFormVisible();
  await configStep.checkSourceControlFormVisible();
  await configStep.fillAndverifyBoardConfig(configStepDataStatusMapping.board);
  await configStep.fillAndVerifyPipelineToolForm(configStepDataStatusMapping.pipelineTool);
  await configStep.fillAndVerifySourceControlForm(configStepDataStatusMapping.sourceControl);
  await configStep.validateNextButtonClickable();
  await configStep.goToMetrics();

  await metricsStep.waitForShown();
  await metricsStep.validateNextButtonNotClickable();
  await metricsStep.checkBoardConfigurationVisible();
  await metricsStep.checkPipelineConfigurationVisible();
  await metricsStep.checkLastAssigneeCrewFilterChecked();
  await metricsStep.checkCycleTimeConsiderCheckboxChecked();
  await metricsStep.checkCycleTimeSettingIsByColumn();
  await metricsStep.waitForHiddenLoading();
  await metricsStep.selectCrews(testFixtureFile.crews);

  await metricsStep.selectCycleTimeSettingsType(metricsStepData.cycleTime.type);
  await metricsStep.checkHeartbeatStateIsSet(hbStateDataEmptyByStatus, true);

  await metricsStep.selectCycleTimeSettingsType(testFixtureFile.cycleTimeByStatus.type);
  await metricsStep.checkHeartbeatStateIsSet(hbStateDataEmptyByStatus, false);
  await metricsStep.selectHeartbeatState(hbStateDataByStatus);
  await metricsStep.checkHeartbeatStateIsSet(hbStateDataByStatus, true);

  await metricsStep.selectClassifications(metricsStepData.classification);
  await metricsStep.selectDefaultGivenPipelineSetting(metricsStepData.deployment);
  await metricsStep.selectGivenPipelineCrews(metricsStepData.pipelineCrews);
  await metricsStep.selectReworkSettings(metricsStepData.reworkTimesSettings);
  await metricsStep.saveConfigStepAsJSONThenVerifyDownloadFile(metricsStepData);
  await metricsStep.goToReportPage();

  await reportStep.confirmGeneratedReport();
  await reportStep.checkBoardMetrics(
    BOARD_METRICS_RESULT.Velocity,
    BOARD_METRICS_RESULT.Throughput,
    BOARD_METRICS_RESULT.AverageCycleTime4SP,
    BOARD_METRICS_RESULT.AverageCycleTime4Card,
    BOARD_METRICS_RESULT.totalReworkTimes,
    BOARD_METRICS_RESULT.totalReworkCards,
    BOARD_METRICS_RESULT.reworkCardsRatio,
    BOARD_METRICS_RESULT.throughput,
  );
  await reportStep.checkBoardMetricsDetails(ProjectCreationType.CREATE_A_NEW_PROJECT, 9);
  await reportStep.checkDoraMetrics(
    DORA_METRICS_RESULT.PrLeadTime,
    DORA_METRICS_RESULT.PipelineLeadTime,
    DORA_METRICS_RESULT.TotalLeadTime,
    DORA_METRICS_RESULT.DeploymentFrequency,
    DORA_METRICS_RESULT.FailureRate,
    DORA_METRICS_RESULT.DevMeanTimeToRecovery,
  );
  await reportStep.checkDoraMetricsDetails(ProjectCreationType.CREATE_A_NEW_PROJECT);
  await reportStep.checkMetricDownloadData();
});
