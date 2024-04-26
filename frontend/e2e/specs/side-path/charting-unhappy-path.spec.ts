import { importModifiedCorrectConfig as modifiedCorrectProjectFromFile } from '../../fixtures/import-file/unhappy-path-file';
import { chartUnHappyPathConfig } from '../../fixtures/create-new/config-step';
import { test } from '../../fixtures/test-with-extend-fixtures';
import { clearTempDir } from '../../utils/clear-temp-dir';
import { format } from '../../utils/date-time';

test.beforeAll(async () => {
  await clearTempDir();
});

test('Charting unhappy path on config and metri page', async ({ homePage, configStep, metricsStep }) => {
  const rightDateRange = {
    startDate: format(modifiedCorrectProjectFromFile.dateRange.startDate),
    endDate: format(modifiedCorrectProjectFromFile.dateRange.endDate),
  };
  const errorDateRange = {
    startDate: format(chartUnHappyPathConfig.errorDateRange[0].startDate),
    endDate: format(chartUnHappyPathConfig.errorDateRange[0].endDate),
  };

  const noCardDateRange = {
    startDate: format(chartUnHappyPathConfig.noCardDateRange[0].startDate),
    endDate: format(chartUnHappyPathConfig.noCardDateRange[0].endDate),
  };
  await homePage.goto();

  await homePage.importProjectFromFile('../fixtures/input-files/charting-unhappy-path-config-file.json');

  await configStep.verifyAllConfig();
  await configStep.addNewTimeRange();
  await configStep.addNewTimeRange();
  await configStep.addNewTimeRange();
  await configStep.addNewTimeRange();
  await configStep.addNewTimeRange();
  await configStep.validateAddNewTimeRangeButtonNotClickable();
  await configStep.validateNextButtonNotClickable();
  await configStep.RemoveLastNewPipeline();
  await configStep.RemoveLastNewPipeline();
  await configStep.RemoveLastNewPipeline();
  await configStep.RemoveLastNewPipeline();
  await configStep.RemoveLastNewPipeline();
  await configStep.validateRemoveTimeRangeButtonIsHidden();
  await configStep.typeInDateRange(errorDateRange);
  await configStep.checkErrorStratTimeMessage();
  await configStep.checkErrorEndTimeMessage();
  await configStep.validateNextButtonNotClickable();
  await configStep.typeInDateRange(noCardDateRange);
  await configStep.goToMetrics();
  await metricsStep.waitForShown();
  await configStep.validateNextButtonNotClickable();
  await metricsStep.goToPreviousStep();
  await configStep.typeInDateRange(rightDateRange);
  await configStep.goToMetrics();
  await metricsStep.waitForShown();
  await metricsStep.deselectBranch(chartUnHappyPathConfig.unSelectBranch);
  await metricsStep.addBranch(chartUnHappyPathConfig.addNewBranch);
  await metricsStep.checkBranchIsInvalid();
  await configStep.validateNextButtonNotClickable();
});
