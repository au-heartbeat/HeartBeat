export const PROJECT_NAME = 'Heartbeat'
export const DEFAULT_HELPER_TEXT = ' '

export const FIVE_HUNDRED = 500

export const ZERO = 0

export const EMPTY_STRING = ''

export const REGULAR_CALENDAR = 'Regular Calendar(Weekend Considered)'

export const CHINA_CALENDAR = 'Calendar with Chinese Holiday'

export const STEPS = ['Config', 'Metrics', 'Report']

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

export enum DATE_RANGE {
  START_DATE = 0,
  END_DATE = 1,
}

export enum CONFIG_TITLE {
  BOARD = 'Board',
  PIPELINE_TOOL = 'Pipeline Tool',
  SOURCE_CONTROL = 'Source Control',
}

export const BOARD_TYPES = {
  CLASSIC_JIRA: 'Classic Jira',
  JIRA: 'Jira',
  LINEAR: 'Linear',
}

export const PIPELINE_TOOL_TYPES = {
  BUILD_KITE: 'BuildKite',
  GO_CD: 'GoCD',
}

export const SOURCE_CONTROL_TYPES = {
  GITHUB: 'GitHub',
}

export const EMAIL_REG_EXP = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export const BOARD_TOKEN_REG_EXP = /^[a-zA-Z0-9\-=_]{1,500}$/

export const BUILDKITE_TOKEN_REGEXP = /^(bkua)?_?([a-zA-Z0-9]{40})$/

export const GITHUB_TOKEN_REGEXP = /^(ghp|gho|ghu|ghs|ghr)+_+([a-zA-Z0-9]{36})$/

export const EMAIL = 'Email'

export const VERIFY_FAILED_ERROR_MESSAGE = 'verify failed'
export const INTERNAL_SERVER_ERROR_MESSAGE = 'Internal server error'
export const INVALID_TOKEN_ERROR_MESSAGE = 'Token is incorrect'
export const BAD_REQUEST_ERROR_MESSAGE = 'Please reconfirm the input'
export const NOT_FOUND_ERROR_MESSAGE = '404 Not Found'
export const PERMISSION_DENIED_ERROR_MESSAGE = 'Permission denied'
export const UNKNOWN_ERROR_MESSAGE = 'Unknown'

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

export const BOARD_TOKEN = 'Token'

export const ERROR_MESSAGE_TIME_DURATION = 2000

export const TOKEN_HELPER_TEXT = {
  RequiredTokenText: 'Token is required',
  InvalidTokenText: 'Token is invalid',
}

export const DONE = 'Done'

export const SELECTED_VALUE_SEPARATOR = ', '

export const SAVE_CONFIG_TIPS =
  'Note: When you save the settings, some tokens might be saved, please save it safely (e.g. by 1 password, vault), Rotate the tokens regularly. (e.g. every 3 months)'

export enum VelocityMetric {
  VELOCITY_SP = 'Velocity(SP)',
  THROUGHPUT_CARDS_COUNT = 'ThroughPut(Cards Count)',
}

export const GET_STEPS_FAILED = 'get steps failed'

export enum CycleTimeMetrics {
  AVERAGE_CYCLE_TIME = 'Average Cycle Time',
  TOTAL_DEVELOPMENT_TIME_DIV_TOTAL_CYCLE_TIME = 'Total Development Time/Total Cycle Time',
  TOTAL_WAITING_TIME_DIV_TOTAL_CYCLE_TIME = 'Total Waiting Time/Total Cycle Time',
  TOTAL_BLOCK_TIME_DIV_TOTAL_CYCLE_TIME = 'Total Block Time/Total Cycle Time',
  TOTAL_REVIEW_TIME_DIV_TOTAL_CYCLE_TIME = 'Total Review Time/Total Cycle Time',
  TOTAL_TESTING_TIME_DIV_TOTAL_CYCLE_TIME = 'Total Testing Time/Total Cycle Time',
  AVERAGE_DEVELOPMENT_TIME = 'Average Development Time',
  AVERAGE_WAITING_TIME = 'Average Waiting Time',
  AVERAGE_BLOCK_TIME = 'Average Block Time',
  AVERAGE_REVIEW_TIME = 'Average Review Time',
  AVERAGE_TESTING_TIME = 'Average Testing Time',
}

export enum Unit {
  PER_SP = '(days/SP)',
  PER_CARD = '(days/card)',
}

export const INIT_VELOCITY = {
  [VelocityMetric.VELOCITY_SP]: '2',
  [VelocityMetric.THROUGHPUT_CARDS_COUNT]: '2',
}
export const INIT_CYCLE_TIME = {
  [CycleTimeMetrics.AVERAGE_CYCLE_TIME]: '',
  [CycleTimeMetrics.TOTAL_DEVELOPMENT_TIME_DIV_TOTAL_CYCLE_TIME]: '',
  [CycleTimeMetrics.TOTAL_WAITING_TIME_DIV_TOTAL_CYCLE_TIME]: '',
  [CycleTimeMetrics.TOTAL_BLOCK_TIME_DIV_TOTAL_CYCLE_TIME]: '',
  [CycleTimeMetrics.TOTAL_REVIEW_TIME_DIV_TOTAL_CYCLE_TIME]: '',
  [CycleTimeMetrics.TOTAL_TESTING_TIME_DIV_TOTAL_CYCLE_TIME]: '',
  [CycleTimeMetrics.AVERAGE_DEVELOPMENT_TIME]: '',
  [CycleTimeMetrics.AVERAGE_WAITING_TIME]: '',
  [CycleTimeMetrics.AVERAGE_BLOCK_TIME]: '',
  [CycleTimeMetrics.AVERAGE_REVIEW_TIME]: '',
  [CycleTimeMetrics.AVERAGE_TESTING_TIME]: '',
}
