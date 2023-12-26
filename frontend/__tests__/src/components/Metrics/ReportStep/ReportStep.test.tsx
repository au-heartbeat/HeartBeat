import { render, renderHook } from '@testing-library/react'
import ReportStep from '@src/components/Metrics/ReportStep'
import {
  BACK,
  EMPTY_REPORT_VALUES,
  ERROR_PAGE_ROUTE,
  EXPECTED_REPORT_VALUES,
  EXPORT_BOARD_DATA,
  EXPORT_METRIC_DATA,
  EXPORT_PIPELINE_DATA,
  MOCK_JIRA_VERIFY_RESPONSE,
  REQUIRED_DATA_LIST,
  SAVE,
} from '../../../fixtures'
import { setupStore } from '../../../utils/setupStoreUtil'
import { Provider } from 'react-redux'
import { updateDeploymentFrequencySettings } from '@src/context/Metrics/metricsSlice'
import {
  updateJiraVerifyResponse,
  updateMetrics,
  updatePipelineToolVerifyResponse,
} from '@src/context/config/configSlice'
import userEvent from '@testing-library/user-event'
import { backStep } from '@src/context/stepper/StepperSlice'
import { navigateMock } from '../../../../setupTests'
import { useGenerateReportEffect } from '@src/hooks/useGenerateReportEffect'
import { useNotificationLayoutEffect } from '@src/hooks/useNotificationLayoutEffect'
import React from 'react'
import { useExportCsvEffect } from '@src/hooks/useExportCsvEffect'
import { MESSAGE } from '@src/constants/resources'

jest.mock('@src/context/stepper/StepperSlice', () => ({
  ...jest.requireActual('@src/context/stepper/StepperSlice'),
  backStep: jest.fn().mockReturnValue({ type: 'BACK_STEP' }),
}))

jest.mock('@src/hooks/useExportCsvEffect', () => ({
  useExportCsvEffect: jest.fn().mockReturnValue({
    fetchExportData: jest.fn(),
    errorMessage: 'failed export csv',
    isExpired: false,
  }),
}))

jest.mock('@src/hooks/useGenerateReportEffect', () => ({
  useGenerateReportEffect: jest.fn().mockReturnValue({
    startToRequestBoardData: jest.fn(),
    startToRequestDoraData: jest.fn(),
    stopPollingReports: jest.fn(),
    isServerError: false,
    errorMessage: '',
  }),
}))

jest.mock('@src/emojis/emoji', () => ({
  getEmojiUrls: jest.fn().mockReturnValue(['']),
  removeExtraEmojiName: jest.fn(),
}))

jest.mock('@src/utils/util', () => ({
  transformToCleanedBuildKiteEmoji: jest.fn(),
  getJiraBoardToken: jest.fn(),
  filterAndMapCycleTimeSettings: jest.fn(),
}))

let store = null
describe('Report Step', () => {
  const { result: notificationHook } = renderHook(() => useNotificationLayoutEffect())
  const { result: reportHook } = renderHook(() => useGenerateReportEffect())
  beforeEach(() => {
    resetReportHook()
  })
  afterAll(() => {
    jest.clearAllMocks()
  })
  const resetReportHook = async () => {
    reportHook.current.startToRequestBoardData = jest.fn()
    reportHook.current.startToRequestDoraData = jest.fn()
    reportHook.current.stopPollingReports = jest.fn()
    reportHook.current.isServerError = false
    reportHook.current.errorMessage = ''
    reportHook.current.reportData = EXPECTED_REPORT_VALUES
  }
  const handleSaveMock = jest.fn()
  const setup = (params: string[]) => {
    store = setupStore()
    store.dispatch(
      updateJiraVerifyResponse({
        jiraColumns: MOCK_JIRA_VERIFY_RESPONSE.jiraColumns,
        targetFields: MOCK_JIRA_VERIFY_RESPONSE.targetFields,
        users: MOCK_JIRA_VERIFY_RESPONSE.users,
      })
    )
    store.dispatch(updateMetrics(params))
    store.dispatch(
      updateDeploymentFrequencySettings({ updateId: 0, label: 'organization', value: 'mock organization' })
    )
    store.dispatch(
      updateDeploymentFrequencySettings({ updateId: 0, label: 'pipelineName', value: 'mock pipeline name' })
    )
    store.dispatch(updateDeploymentFrequencySettings({ updateId: 0, label: 'step', value: 'mock step1' }))
    store.dispatch(
      updatePipelineToolVerifyResponse({
        pipelineList: [
          {
            orgId: 'mock organization id',
            orgName: 'mock organization',
            id: 'mock pipeline id',
            name: 'mock pipeline name',
            steps: ['mock step1', 'mock step2'],
            repository: 'mock url',
          },
        ],
      })
    )
    return render(
      <Provider store={store}>
        <ReportStep notification={notificationHook.current} handleSave={handleSaveMock} />
      </Provider>
    )
  }
  afterEach(() => {
    store = null
    jest.clearAllMocks()
  })

  describe('render correctly', () => {
    it('should render report page', () => {
      const { getByText } = setup(REQUIRED_DATA_LIST)

      expect(getByText('Board Metrics')).toBeInTheDocument()
      expect(getByText(REQUIRED_DATA_LIST[1])).toBeInTheDocument()
      expect(getByText(REQUIRED_DATA_LIST[2])).toBeInTheDocument()
      expect(getByText('DORA Metrics')).toBeInTheDocument()
      expect(getByText(REQUIRED_DATA_LIST[4])).toBeInTheDocument()
      expect(getByText(REQUIRED_DATA_LIST[5])).toBeInTheDocument()
      expect(getByText(REQUIRED_DATA_LIST[6])).toBeInTheDocument()
      expect(getByText(REQUIRED_DATA_LIST[7])).toBeInTheDocument()
    })

    it('should render loading page when report data is empty', () => {
      reportHook.current.reportData = EMPTY_REPORT_VALUES

      const { getAllByTestId } = setup(REQUIRED_DATA_LIST)

      expect(getAllByTestId('loading-page')).toHaveLength(6)
    })

    it('should renders the velocity component with correct props', async () => {
      const { getByText } = setup([REQUIRED_DATA_LIST[1]])

      expect(getByText('20')).toBeInTheDocument()
      expect(getByText('14')).toBeInTheDocument()
    })

    it('should renders the CycleTime component with correct props', () => {
      const { getByText } = setup([REQUIRED_DATA_LIST[2]])

      expect(getByText('3.10')).toBeInTheDocument()
      expect(getByText('2.30')).toBeInTheDocument()
    })

    it('should renders the Lead Time For Change component with correct props', () => {
      const { getByText } = setup([REQUIRED_DATA_LIST[4]])

      expect(getByText('1016.69')).toBeInTheDocument()
      expect(getByText('3.81')).toBeInTheDocument()
      expect(getByText('1020.50')).toBeInTheDocument()
    })

    it('should renders the Deployment frequency component with correct props', () => {
      const { getByText } = setup([REQUIRED_DATA_LIST[5]])

      expect(getByText('2.36')).toBeInTheDocument()
    })

    it('should renders the Change failure rate component with correct props', () => {
      const { getByText } = setup([REQUIRED_DATA_LIST[6]])

      expect(getByText('0.00')).toBeInTheDocument()
      expect(getByText('% (0/26)')).toBeInTheDocument()
    })

    it('should renders the Mean time to recovery component with correct props', () => {
      const { getByText } = setup([REQUIRED_DATA_LIST[7]])

      expect(getByText('0.00')).toBeInTheDocument()
    })

    it('should show errorMessage when generateReport has error message', () => {
      reportHook.current.errorMessage = 'error message'

      const { getByText } = setup([''])

      expect(getByText('error message')).toBeInTheDocument()
    })
  })

  describe('behavior', () => {
    it('should call handleBack method when click back button given back button enabled', async () => {
      const { getByText } = setup([''])

      const back = getByText(BACK)
      await userEvent.click(back)

      expect(backStep).toHaveBeenCalledTimes(1)
    })

    it('should call handleSaveMock method when click save button', async () => {
      const { getByText } = setup([''])

      const save = getByText(SAVE)
      await userEvent.click(save)

      expect(handleSaveMock).toHaveBeenCalledTimes(1)
    })

    it('should check error page show when isReportError is true', () => {
      reportHook.current.isServerError = true
      reportHook.current.errorMessage = 'error message'

      setup([REQUIRED_DATA_LIST[1]])

      expect(navigateMock).toHaveBeenCalledWith(ERROR_PAGE_ROUTE)
    })

    it('should call resetProps and updateProps when remaining time is less than or equal to 5 minutes', () => {
      const initExportValidityTimeMin = 30
      React.useState = jest.fn().mockReturnValue([
        initExportValidityTimeMin,
        () => {
          jest.fn()
        },
      ])
      const resetProps = jest.fn()
      const updateProps = jest.fn()
      notificationHook.current.resetProps = resetProps
      notificationHook.current.updateProps = updateProps
      jest.useFakeTimers()
      setup([''])

      expect(resetProps).not.toBeCalled()
      expect(updateProps).not.toBeCalledWith({
        open: true,
        title: MESSAGE.EXPIRE_IN_FIVE_MINUTES,
        closeAutomatically: true,
      })

      jest.advanceTimersByTime(500000)

      expect(updateProps).not.toBeCalledWith({
        open: true,
        title: MESSAGE.EXPIRE_IN_FIVE_MINUTES,
        closeAutomatically: true,
      })

      jest.advanceTimersByTime(1000000)

      expect(updateProps).toBeCalledWith({
        open: true,
        title: MESSAGE.EXPIRE_IN_FIVE_MINUTES,
        closeAutomatically: true,
      })

      jest.useRealTimers()
    })
  })

  describe('export pipeline data', () => {
    it('should not show export pipeline button when not select deployment frequency', () => {
      const { queryByText } = setup([REQUIRED_DATA_LIST[1]])

      const exportPipelineButton = queryByText(EXPORT_PIPELINE_DATA)

      expect(exportPipelineButton).not.toBeInTheDocument()
    })

    it.each([[REQUIRED_DATA_LIST[4]], [REQUIRED_DATA_LIST[5]], [REQUIRED_DATA_LIST[6]], [REQUIRED_DATA_LIST[7]]])(
      'should show export pipeline button when select %s',
      (requiredData) => {
        const { getByText } = setup([requiredData])

        const exportPipelineButton = getByText(EXPORT_PIPELINE_DATA)

        expect(exportPipelineButton).toBeInTheDocument()
      }
    )

    it('should call fetchExportData when clicking "Export pipeline data"', async () => {
      const { result } = renderHook(() => useExportCsvEffect())
      const { getByText } = setup([REQUIRED_DATA_LIST[6]])

      const exportButton = getByText(EXPORT_PIPELINE_DATA)
      expect(exportButton).toBeInTheDocument()
      await userEvent.click(exportButton)

      expect(result.current.fetchExportData).toBeCalledTimes(1)
    })
  })

  describe('export board data', () => {
    it('should not show export board button when not select board metrics', () => {
      const { queryByText } = setup([REQUIRED_DATA_LIST[4]])

      const exportPipelineButton = queryByText(EXPORT_BOARD_DATA)

      expect(exportPipelineButton).not.toBeInTheDocument()
    })

    it.each([[REQUIRED_DATA_LIST[1]], [REQUIRED_DATA_LIST[2]]])(
      'should show export board button when select %s',
      (requiredData) => {
        const { getByText } = setup([requiredData])

        const exportPipelineButton = getByText(EXPORT_BOARD_DATA)

        expect(exportPipelineButton).toBeInTheDocument()
      }
    )

    it('should call fetchExportData when clicking "Export board data"', async () => {
      const { result } = renderHook(() => useExportCsvEffect())
      const { getByText } = setup([REQUIRED_DATA_LIST[2]])

      const exportButton = getByText(EXPORT_BOARD_DATA)
      expect(exportButton).toBeInTheDocument()
      await userEvent.click(exportButton)

      expect(result.current.fetchExportData).toBeCalledTimes(1)
    })
  })

  describe('export metric data', () => {
    it('should show errorMessage when click export metric button given csv not exist', () => {
      const { getByText } = setup([''])

      userEvent.click(getByText(EXPORT_METRIC_DATA))

      expect(getByText('Export metric data')).toBeInTheDocument()
    })

    it('should show export metric button when visiting this page', () => {
      const { getByText } = setup([''])

      const exportMetricButton = getByText(EXPORT_METRIC_DATA)

      expect(exportMetricButton).toBeInTheDocument()
    })

    it('should call fetchExportData when clicking "Export metric data"', async () => {
      const { result } = renderHook(() => useExportCsvEffect())
      const { getByText } = setup([''])

      const exportButton = getByText(EXPORT_METRIC_DATA)
      expect(exportButton).toBeInTheDocument()
      await userEvent.click(exportButton)

      expect(result.current.fetchExportData).toBeCalledTimes(1)
    })
  })
})
