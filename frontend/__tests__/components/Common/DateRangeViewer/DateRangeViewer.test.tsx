import {
  nextStep,
  updateMetricsPageLoadingStatus,
  updateReportPageLoadingStatus,
} from '@src/context/stepper/StepperSlice';
import { formatDateToTimestampString, sortDateRanges } from '@src/utils/util';
import DateRangeViewer from '@src/components/Common/DateRangeViewer';
import { DateRangeList } from '@src/context/config/configSlice';
import { setupStore } from '@test/utils/setupStoreUtil';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import React from 'react';

const changeDateRange = jest.fn();
const loadedSuccess = { isLoading: false, isLoaded: true, isLoadedWithError: false };
const allMetricsPageDataLoadedSuccess = {
  boardInfo: loadedSuccess,
  pipelineInfo: loadedSuccess,
  pipelineStep: loadedSuccess,
};
const allReportPageDataLoadedSuccess = {
  gainPollingUrl: loadedSuccess,
  polling: loadedSuccess,
  boardMetrics: loadedSuccess,
  pipelineMetrics: loadedSuccess,
  sourceControlMetrics: loadedSuccess,
};

describe('DateRangeViewer', () => {
  let store = setupStore();
  const setup = (dateRanges: DateRangeList) => {
    return render(
      <Provider store={store}>
        <DateRangeViewer dateRangeList={dateRanges} />
      </Provider>,
    );
  };

  beforeEach(() => {
    store = setupStore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockDateRanges = [
    {
      startDate: '2024-03-19T00:00:00.000+08:00',
      endDate: '2024-03-21T23:59:59.999+08:00',
    },
    {
      startDate: '2024-02-01T00:00:00.000+08:00',
      endDate: '2024-02-14T23:59:59.999+08:00',
    },
    {
      startDate: '2024-04-01T00:00:00.000+08:00',
      endDate: '2024-04-08T23:59:59.999+08:00',
    },
  ];

  it('should show date when render component given startDate and endDate', () => {
    const { getByText } = setup(mockDateRanges);
    expect(getByText(/2024\/03\/19/)).toBeInTheDocument();
    expect(getByText(/2024\/03\/21/)).toBeInTheDocument();
  });

  it('should show more date when click expand button', async () => {
    const { getByLabelText, getByText, getAllByText, container } = setup(mockDateRanges);
    await userEvent.click(getByLabelText('expandMore'));
    expect(getAllByText(/2024\/03\/19/)[0]).toBeInTheDocument();
    expect(getAllByText(/2024\/03\/19/)[1]).toBeInTheDocument();
    expect(getAllByText(/2024\/03\/21/)[0]).toBeInTheDocument();
    expect(getAllByText(/2024\/03\/21/)[1]).toBeInTheDocument();
    expect(getByText(/2024\/02\/01/)).toBeInTheDocument();
    expect(getByText(/2024\/02\/14/)).toBeInTheDocument();
    expect(getByText(/2024\/04\/01/)).toBeInTheDocument();
    expect(getByText(/2024\/04\/08/)).toBeInTheDocument();
    await userEvent.click(container);
    expect(getByText(/2024\/03\/19/)).toBeInTheDocument();
    expect(getByText(/2024\/03\/21/)).toBeInTheDocument();
  });

  describe('DateRangeViewer in metrics page', () => {
    beforeEach(() => {
      store.dispatch(nextStep());
    });
    it('should show priority high icon given click expand button and there are some error infos', async () => {
      const failedTimeRangeList = [
        {
          startDate: formatDateToTimestampString('2024-02-01T00:00:00.000+08:00'),
          loadingStatus: {
            boardInfo: { isLoading: false, isLoaded: true, isLoadedWithError: true },
            pipelineInfo: loadedSuccess,
            pipelineStep: loadedSuccess,
          },
        },
        {
          startDate: formatDateToTimestampString('2024-03-19T00:00:00.000+08:00'),
          loadingStatus: {
            boardInfo: loadedSuccess,
            pipelineInfo: loadedSuccess,
            pipelineStep: loadedSuccess,
          },
        },
        {
          startDate: formatDateToTimestampString('2024-04-01T00:00:00.000+08:00'),
          loadingStatus: {
            boardInfo: loadedSuccess,
            pipelineInfo: loadedSuccess,
            pipelineStep: loadedSuccess,
          },
        },
      ];
      store.dispatch(updateMetricsPageLoadingStatus(failedTimeRangeList));
      const { getByLabelText } = setup(mockDateRanges);
      expect(screen.getByTestId('PriorityHighIcon')).toBeInTheDocument();

      await userEvent.click(getByLabelText('expandMore'));
      expect(screen.getAllByTestId('PriorityHighIcon')).toHaveLength(2);
    });

    it('should show loading icon given click expand button and there is data loading', async () => {
      const failedTimeRangeList = [
        {
          startDate: formatDateToTimestampString('2024-02-01T00:00:00.000+08:00'),
          loadingStatus: {
            boardInfo: { isLoading: true, isLoaded: false, isLoadedWithError: false },
            pipelineInfo: loadedSuccess,
            pipelineStep: loadedSuccess,
          },
        },
        {
          startDate: formatDateToTimestampString('2024-03-19T00:00:00.000+08:00'),
          loadingStatus: {
            boardInfo: loadedSuccess,
            pipelineInfo: loadedSuccess,
            pipelineStep: loadedSuccess,
          },
        },
        {
          startDate: formatDateToTimestampString('2024-04-01T00:00:00.000+08:00'),
          loadingStatus: {
            boardInfo: loadedSuccess,
            pipelineInfo: loadedSuccess,
            pipelineStep: loadedSuccess,
          },
        },
      ];
      store.dispatch(updateMetricsPageLoadingStatus(failedTimeRangeList));
      const { getByLabelText } = setup(mockDateRanges);

      expect(screen.getByLabelText('loading icon in date')).toBeInTheDocument();

      await userEvent.click(getByLabelText('expandMore'));
      expect(screen.getAllByLabelText('loading icon in date')).toHaveLength(2);
    });

    it('should show check icon given click expand button and all data is loaded', async () => {
      const failedTimeRangeList = [
        {
          startDate: formatDateToTimestampString('2024-02-01T00:00:00.000+08:00'),
          loadingStatus: allMetricsPageDataLoadedSuccess,
        },
        {
          startDate: formatDateToTimestampString('2024-03-19T00:00:00.000+08:00'),
          loadingStatus: allMetricsPageDataLoadedSuccess,
        },
        {
          startDate: formatDateToTimestampString('2024-04-01T00:00:00.000+08:00'),
          loadingStatus: allMetricsPageDataLoadedSuccess,
        },
      ];
      store.dispatch(updateMetricsPageLoadingStatus(failedTimeRangeList));
      const { getByLabelText } = setup(mockDateRanges);

      expect(screen.getByTestId('CheckIcon')).toBeInTheDocument();

      await userEvent.click(getByLabelText('expandMore'));
      expect(screen.getAllByTestId('CheckIcon')).toHaveLength(4);
    });

    it('should not close the extension date ranges given metrics page and click inside of extension', async () => {
      const { getByLabelText, getByText, rerender } = render(
        <Provider store={store}>
          <DateRangeViewer
            dateRangeList={sortDateRanges(mockDateRanges)}
            disabledAll={false}
            changeDateRange={changeDateRange}
          />
        </Provider>,
      );
      await userEvent.click(getByLabelText('expandMore'));
      await userEvent.click(getByText(/2024\/03\/19/));
      expect(changeDateRange).toHaveBeenCalledTimes(1);

      rerender(
        <Provider store={store}>
          <DateRangeViewer
            dateRangeList={sortDateRanges(mockDateRanges)}
            disabledAll={true}
            changeDateRange={changeDateRange}
          />
        </Provider>,
      );

      await userEvent.click(getByLabelText('expandMore'));
      await userEvent.click(getByText(/2024\/03\/19/));
      expect(changeDateRange).toHaveBeenCalledTimes(1);
    });
  });

  describe('DateRangeViewer in report page', () => {
    it('should not show priority high icon in report page given click expand button and there is no error info', async () => {
      const failedTimeRangeList = [
        {
          startDate: formatDateToTimestampString('2024-02-01T00:00:00.000+08:00'),
          loadingStatus: allReportPageDataLoadedSuccess,
        },
        {
          startDate: formatDateToTimestampString('2024-03-19T00:00:00.000+08:00'),
          loadingStatus: allReportPageDataLoadedSuccess,
        },
      ];

      store.dispatch(updateReportPageLoadingStatus(failedTimeRangeList));
      const { getByLabelText } = setup(mockDateRanges);

      await userEvent.click(getByLabelText('expandMore'));

      expect(screen.queryByTestId('PriorityHighIcon')).not.toBeInTheDocument();
    });

    it('should show priority high icon in report page given click expand button and there are some error infos', async () => {
      const dateRangeList = [
        ...mockDateRanges,
        {
          startDate: '2023-03-19T00:00:00.000+08:00',
          endDate: '2024-03-21T23:59:59.999+08:00',
        },
        {
          startDate: '2023-02-01T00:00:00.000+08:00',
          endDate: '2024-02-14T23:59:59.999+08:00',
        },
        {
          startDate: '2023-04-01T00:00:00.000+08:00',
          endDate: '2024-04-08T23:59:59.999+08:00',
        },
      ];
      const failedTimeRangeList = [
        {
          startDate: formatDateToTimestampString('2024-02-01T00:00:00.000+08:00'),
          loadingStatus: {
            gainPollingUrl: loadedSuccess,
            polling: loadedSuccess,
            boardMetrics: { isLoading: false, isLoaded: true, isLoadedWithError: true },
            pipelineMetrics: loadedSuccess,
            sourceControlMetrics: loadedSuccess,
          },
        },
        {
          startDate: formatDateToTimestampString('2024-03-19T00:00:00.000+08:00'),
          loadingStatus: {
            gainPollingUrl: { isLoading: false, isLoaded: true, isLoadedWithError: true },
          },
        },
        {
          startDate: formatDateToTimestampString('2024-04-01T00:00:00.000+08:00'),
          loadingStatus: {
            gainPollingUrl: loadedSuccess,
            polling: loadedSuccess,
            boardMetrics: loadedSuccess,
            pipelineMetrics: { isLoading: false, isLoaded: true, isLoadedWithError: true },
            sourceControlMetrics: loadedSuccess,
          },
        },
        {
          startDate: formatDateToTimestampString('2023-02-01T00:00:00.000+08:00'),
          loadingStatus: {
            gainPollingUrl: loadedSuccess,
            polling: { isLoading: false, isLoaded: true, isLoadedWithError: true },
            boardMetrics: { isLoading: false, isLoaded: true, isLoadedWithError: true },
            pipelineMetrics: { isLoading: false, isLoaded: true, isLoadedWithError: true },
            sourceControlMetrics: { isLoading: false, isLoaded: true, isLoadedWithError: true },
          },
        },
        {
          startDate: formatDateToTimestampString('2023-03-19T00:00:00.000+08:00'),
          loadingStatus: {
            gainPollingUrl: loadedSuccess,
            polling: loadedSuccess,
            boardMetrics: loadedSuccess,
            pipelineMetrics: loadedSuccess,
            sourceControlMetrics: { isLoading: false, isLoaded: true, isLoadedWithError: true },
          },
        },
        {
          startDate: formatDateToTimestampString('2023-04-01T00:00:00.000+08:00'),
          loadingStatus: allReportPageDataLoadedSuccess,
        },
      ];
      store.dispatch(updateReportPageLoadingStatus(failedTimeRangeList));
      const { getByLabelText } = setup(dateRangeList);
      expect(screen.getByTestId('PriorityHighIcon')).toBeInTheDocument();

      await userEvent.click(getByLabelText('expandMore'));
      expect(screen.getAllByTestId('PriorityHighIcon')).toHaveLength(6);
    });
  });

  it('should show time range count when showing chart', async () => {
    render(
      <Provider store={store}>
        <DateRangeViewer dateRangeList={sortDateRanges(mockDateRanges)} disabledAll={false} isShowingChart={true} />
      </Provider>,
    );

    expect(screen.getByLabelText('date-count-chip')).toBeInTheDocument();
  });

  it('should show time range count when current page is Metrics page given not showing chart', async () => {
    store.dispatch(nextStep());
    render(
      <Provider store={store}>
        <DateRangeViewer dateRangeList={sortDateRanges(mockDateRanges)} disabledAll={false} isShowingChart={false} />
      </Provider>,
    );

    expect(screen.getByLabelText('date-count-chip')).toBeInTheDocument();
  });
});
