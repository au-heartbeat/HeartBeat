export const CALENDAR = {
  REGULAR: 'Regular Calendar(Weekend Considered)',
  CHINA: 'Calendar with Chinese Holiday',
}

export const REPORT_METRICS = {
  REPORT: 'Report',
  BOARD: 'Board Metrics',
  DORA: 'Dora Metrics',
}

export enum REQUIRED_DATA {
  All = 'All',
  VELOCITY = 'Velocity',
  CYCLE_TIME = 'Cycle time',
  CLASSIFICATION = 'Classification',
  LEAD_TIME_FOR_CHANGES = 'Lead time for changes',
  DEPLOYMENT_FREQUENCY = 'Deployment frequency',
  CHANGE_FAILURE_RATE = 'Change failure rate',
  MEAN_TIME_TO_RECOVERY = 'Mean time to recovery',
}

export enum METRICS_TITLE {
  VELOCITY = 'Velocity',
  CYCLE_TIME = 'Cycle Time',
  CLASSIFICATION = 'Classification',
  LEAD_TIME_FOR_CHANGES = 'Lead Time For Changes',
  DEPLOYMENT_FREQUENCY = 'Deployment Frequency',
  CHANGE_FAILURE_RATE = 'Change Failure Rate',
  MEAN_TIME_TO_RECOVERY = 'Mean Time To Recovery',
}

export enum METRICS_SUBTITLE {
  PR_LEAD_TIME = 'PR Lead Time(Hours)',
  PIPELINE_LEAD_TIME = 'Pipeline Lead Time(Hours)',
  TOTAL_DELAY_TIME = 'Total Lead Time(Hours)',
  DEPLOYMENT_FREQUENCY = 'Deployment Frequency(Deployments/Day)',
  MEAN_TIME_TO_RECOVERY_HOURS = 'Mean Time To Recovery(Hours)',
  FAILURE_RATE = 'Failure Rate',
  AVERAGE_CYCLE_TIME_PRE_SP = 'Average Cycle Time(Days/SP)',
  AVERAGE_CYCLE_TIME_PRE_CARD = 'Average Cycle Time(Days/Card)',
  THROUGHPUT = 'Throughput(Cards Count)',
  VELOCITY = 'Velocity(Story Point)',
}

export const DORA_METRICS: string[] = [
  REQUIRED_DATA.LEAD_TIME_FOR_CHANGES,
  REQUIRED_DATA.DEPLOYMENT_FREQUENCY,
  REQUIRED_DATA.CHANGE_FAILURE_RATE,
  REQUIRED_DATA.MEAN_TIME_TO_RECOVERY,
]

export const BOARD_METRICS: string[] = [REQUIRED_DATA.VELOCITY, REQUIRED_DATA.CYCLE_TIME, REQUIRED_DATA.CLASSIFICATION]

export enum CONFIG_TITLE {
  BOARD = 'Board',
  PIPELINE_TOOL = 'Pipeline Tool',
  SOURCE_CONTROL = 'Source Control',
}

export const BOARD_TYPES = {
  CLASSIC_JIRA: 'Classic Jira',
  JIRA: 'Jira',
}

export const PIPELINE_TOOL_TYPES = {
  BUILD_KITE: 'BuildKite',
  GO_CD: 'GoCD',
}

export const SOURCE_CONTROL_TYPES = {
  GITHUB: 'GitHub',
}

export enum PIPELINE_SETTING_TYPES {
  DEPLOYMENT_FREQUENCY_SETTINGS_TYPE = 'DeploymentFrequencySettings',
  LEAD_TIME_FOR_CHANGES_TYPE = 'LeadTimeForChanges',
}

export const ASSIGNEE_FILTER_TYPES = {
  LAST_ASSIGNEE: 'lastAssignee',
  HISTORICAL_ASSIGNEE: 'historicalAssignee',
}

export const EMAIL = 'Email'

export const BOARD_TOKEN = 'Token'

export const DONE = 'Done'

export const METRICS_CONSTANTS = {
  cycleTimeEmptyStr: '----',
  doneValue: 'Done',
  doneKeyFromBackend: 'done',
  todoValue: 'To do',
  analysisValue: 'Analysis',
  inDevValue: 'In Dev',
  blockValue: 'Block',
  waitingValue: 'Waiting for testing',
  testingValue: 'Testing',
  reviewValue: 'Review',
}

export const CYCLE_TIME_LIST = [
  METRICS_CONSTANTS.cycleTimeEmptyStr,
  METRICS_CONSTANTS.todoValue,
  METRICS_CONSTANTS.analysisValue,
  METRICS_CONSTANTS.inDevValue,
  METRICS_CONSTANTS.blockValue,
  METRICS_CONSTANTS.waitingValue,
  METRICS_CONSTANTS.testingValue,
  METRICS_CONSTANTS.reviewValue,
  METRICS_CONSTANTS.doneValue,
]

export const TOKEN_HELPER_TEXT = {
  RequiredTokenText: 'Token is required',
  InvalidTokenText: 'Token is invalid',
}

export const TIPS = {
  SAVE_CONFIG:
    'Note: When you save the settings, some tokens might be saved, please save it safely (e.g. by 1 password, vault), Rotate the tokens regularly. (e.g. every 3 months)',
  CYCLE_TIME: 'The report page will sum all the status in the column for cycletime calculation',
}

export enum VELOCITY_METRICS_NAME {
  VELOCITY_SP = 'Velocity(Story Point)',
  THROUGHPUT_CARDS_COUNT = 'Throughput(Cards Count)',
}

export enum CYCLE_TIME_METRICS_NAME {
  AVERAGE_CYCLE_TIME = 'Average cycle time',
  DEVELOPMENT_PROPORTION = 'Total development time / Total cycle time',
  WAITING_PROPORTION = 'Total waiting for testing time / Total cycle time',
  BLOCK_PROPORTION = 'Total block time / Total cycle time',
  REVIEW_PROPORTION = 'Total review time / Total cycle time',
  TESTING_PROPORTION = 'Total testing time / Total cycle time',
  AVERAGE_DEVELOPMENT_TIME = 'Average development time',
  AVERAGE_WAITING_TIME = 'Average waiting for testing time',
  AVERAGE_BLOCK_TIME = 'Average block time',
  AVERAGE_REVIEW_TIME = 'Average review time',
  AVERAGE_TESTING_TIME = 'Average testing time',
}

export const DEPLOYMENT_FREQUENCY_NAME = 'Deployment frequency(deployments/day)'

export const FAILURE_RATE_NAME = 'Failure rate'

export const MEAN_TIME_TO_RECOVERY_NAME = 'Mean Time To Recovery'

export const PIPELINE_STEP = 'Pipeline/step'

export const NAME = 'Name'

export const AVERAGE_FIELD = 'Average'

export enum REPORT_SUFFIX_UNITS {
  PER_SP = '(days/SP)',
  PER_CARD = '(days/card)',
  HOURS = '(hours)',
}

export const MESSAGE = {
  VERIFY_FAILED_ERROR: 'verify failed',
  UNKNOWN_ERROR: 'Unknown',
  GET_STEPS_FAILED: 'get steps failed',
  HOME_VERIFY_IMPORT_WARNING: 'The content of the imported JSON file is empty. Please confirm carefully',
  CONFIG_PAGE_VERIFY_IMPORT_ERROR: 'Imported data is not perfectly matched. Please review carefully before going next!',
  CLASSIFICATION_WARNING: 'Some classifications in import data might be removed.',
  REAL_DONE_WARNING: 'Some selected doneStatus in import data might be removed',
  ORGANIZATION_WARNING: 'This organization in import data might be removed',
  PIPELINE_NAME_WARNING: 'This Pipeline in import data might be removed',
  STEP_WARNING: 'Selected step of this pipeline in import data might be removed',
  NO_STEP_WARNING:
    'There is no step during this period for this pipeline! Please change the search time in the Config page!',
  ERROR_PAGE: 'Something on internet is not quite right. Perhaps head back to our homepage and try again.',
  NOTIFICATION_FIRST_REPORT: 'The file needs to be exported within %s minutes, otherwise it will expire.',
  EXPIRE_IN_FIVE_MINUTES: 'The file will expire in 5 minutes, please download it in time.',
  REPORT_LOADING: 'The report is being generated, please do not refresh the page or all the data will be disappeared.',
}

export const METRICS_CYCLE_SETTING_TABLE_HEADER = [
  {
    text: 'Board Column',
    emphasis: false,
  },
  {
    text: 'Status',
    emphasis: false,
  },
  {
    text: 'Heartbeat State',
    emphasis: true,
  },
]

export const REPORT_PAGE = {
  BOARD: {
    TITLE: 'Board Metrics',
  },
  DORA: {
    TITLE: 'DORA Metrics',
  },
}
