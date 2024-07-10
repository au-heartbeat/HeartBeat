import { reportId } from './../context/stepper/StepperSlice';
import {
  IPageLoadingStatusPayload,
  IReportPageLoadingStatus,
  updateReportId,
  updateReportPageLoadingStatus,
} from '@src/context/stepper/StepperSlice';
import { ReportCallbackResponse, ReportResponseDTO } from '@src/clients/report/dto/response';
import { exportValidityTimeMapper } from '@src/hooks/reportMapper/exportValidityTime';
import { DATA_LOADING_FAILED, DEFAULT_MESSAGE } from '@src/constants/resources';
import { DateRangeList, selectConfig } from '@src/context/config/configSlice';
import { formatDateToTimestampString, sortDateRanges } from '@src/utils/util';
import { IPollingRes, reportClient } from '@src/clients/report/ReportClient';
import { ReportRequestDTO } from '@src/clients/report/dto/request';
import { useAppDispatch } from '@src/hooks/useAppDispatch';
import { TimeoutError } from '@src/errors/TimeoutError';
import { MetricTypes } from '@src/constants/commons';
import { useAppSelector } from '@src/hooks/index';
import { useRef, useState } from 'react';
import get from 'lodash/get';

export type PromiseSettledResultWithId<T> = PromiseSettledResult<T> & {
  id: string;
};

export interface IUseGenerateReportEffect {
  startToRequestData: (params: ReportRequestDTO) => Promise<void>;
  stopPollingReports: () => void;
  reportInfos: IReportInfo[];
  closeReportInfosErrorStatus: (id: string, errorKey: string) => void;
  closeBoardMetricsError: (id: string) => void;
  closePipelineMetricsError: (id: string) => void;
  closeSourceControlMetricsError: (id: string) => void;
  hasPollingStarted: boolean;
}

interface IErrorInfo {
  message: string;
  shouldShow: boolean;
}

export interface IReportError {
  timeout4Board: IErrorInfo;
  timeout4Dora: IErrorInfo;
  timeout4Report: IErrorInfo;
  generalError4Board: IErrorInfo;
  generalError4Dora: IErrorInfo;
  generalError4Report: IErrorInfo;
}

export interface IReportInfo extends IReportError {
  id: string;
  reportData: ReportResponseDTO | undefined;
  shouldShowBoardMetricsError: boolean;
  shouldShowPipelineMetricsError: boolean;
  shouldShowSourceControlMetricsError: boolean;
}

export const initReportInfo = (): IReportInfo => ({
  id: '',
  timeout4Board: { message: DEFAULT_MESSAGE, shouldShow: true },
  timeout4Dora: { message: DEFAULT_MESSAGE, shouldShow: true },
  timeout4Report: { message: DEFAULT_MESSAGE, shouldShow: true },
  generalError4Board: { message: DEFAULT_MESSAGE, shouldShow: true },
  generalError4Dora: { message: DEFAULT_MESSAGE, shouldShow: true },
  generalError4Report: { message: DEFAULT_MESSAGE, shouldShow: true },
  shouldShowBoardMetricsError: true,
  shouldShowPipelineMetricsError: true,
  shouldShowSourceControlMetricsError: true,
  reportData: undefined,
});

export const TimeoutErrorKey = {
  [MetricTypes.Board]: 'timeout4Board',
  [MetricTypes.DORA]: 'timeout4Dora',
  [MetricTypes.All]: 'timeout4Report',
};

export const GeneralErrorKey = {
  [MetricTypes.Board]: 'generalError4Board',
  [MetricTypes.DORA]: 'generalError4Dora',
  [MetricTypes.All]: 'generalError4Report',
};

const REJECTED = 'rejected';
const FULFILLED = 'fulfilled';

const getErrorKey = (error: Error, source: MetricTypes): string => {
  return error instanceof TimeoutError ? TimeoutErrorKey[source] : GeneralErrorKey[source];
};

export const useGenerateReportEffect = (): IUseGenerateReportEffect => {
  const reportPath = '/reports';
  const dispatch = useAppDispatch();
  const configData = useAppSelector(selectConfig);
  const timerIdRef = useRef<number>();
  const dateRangeList: DateRangeList = sortDateRanges(get(configData, 'basic.dateRange', []), false);
  const [reportInfos, setReportInfos] = useState<IReportInfo[]>(
    dateRangeList.map((dateRange) => ({ ...initReportInfo(), id: dateRange.startDate as string })),
  );
  const [hasPollingStarted, setHasPollingStarted] = useState<boolean>(false);
  let nextHasPollingStarted = false;

  const startToRequestData = async (params: ReportRequestDTO) => {
    const { metricTypes } = params;
    resetTimeoutMessage(metricTypes);
    if (hasPollingStarted || nextHasPollingStarted) return;
    nextHasPollingStarted = true;
    setHasPollingStarted(nextHasPollingStarted);

    resetReportPageLoadingStatus(dateRangeList);

    const reportIdRes = await reportClient.generateReportId(reportPath);

    const res: PromiseSettledResult<ReportCallbackResponse>[] = await Promise.allSettled(
      dateRangeList.map(({ startDate, endDate }) =>
        reportClient.retrieveByUrl(
          {
            ...params,
            startTime: formatDateToTimestampString(startDate!),
            endTime: formatDateToTimestampString(endDate!),
          },
          `${reportPath}/${reportIdRes.reportId}`,
        ),
      ),
    );

    updateErrorAfterFetchReport(res, metricTypes);

    const { pollingInfos, pollingInterval } = assemblePollingParams(res);

    dispatch(updateReportId(reportIdRes.reportId));
    resetPollingLoadingStatusBeforePolling(pollingInfos.map((item) => item.id));
    await pollingReport({ pollingInfos, interval: pollingInterval });
  };

  function getReportInfosAfterPolling(
    preReportInfos: IReportInfo[],
    pollingResponsesWithId: PromiseSettledResultWithId<IPollingRes>[],
  ) {
    return preReportInfos.map((reportInfo) => {
      const matchedRes = pollingResponsesWithId.find((singleRes) => singleRes.id === reportInfo.id);
      if (!matchedRes) return reportInfo;

      if (matchedRes.status === FULFILLED) {
        const { response } = matchedRes.value;
        reportInfo.reportData = assembleReportData(response);
        reportInfo.shouldShowBoardMetricsError = true;
        reportInfo.shouldShowPipelineMetricsError = true;
        reportInfo.shouldShowSourceControlMetricsError = true;
      } else {
        const errorKey = getErrorKey(matchedRes.reason, MetricTypes.All) as keyof IReportError;
        reportInfo[errorKey] = { message: DATA_LOADING_FAILED, shouldShow: true };
      }
      return reportInfo;
    });
  }

  const pollingReport = async ({
    pollingInfos,
    interval,
  }: {
    pollingInfos: Record<string, string>[];
    interval: number;
  }) => {
    const pollingIds: string[] = pollingInfos.map((pollingInfo) => pollingInfo.id);
    initReportInfosTimeout4Report(pollingIds);

    const pollingQueue: Promise<IPollingRes>[] = pollingInfos.map((pollingInfo) =>
      reportClient.polling(pollingInfo.callbackUrl),
    );
    const pollingResponses = await Promise.allSettled(pollingQueue);
    const pollingResponsesWithId = assemblePollingResWithId(pollingResponses, pollingInfos);

    setReportInfos((preReportInfos) => getReportInfosAfterPolling(preReportInfos, pollingResponsesWithId));
    updateReportPageLoadingStatusAfterPolling(pollingResponsesWithId);

    const nextPollingInfos = getNextPollingInfos(pollingResponsesWithId, pollingInfos);
    if (nextPollingInfos.length === 0) {
      stopPollingReports();
      return;
    }
    timerIdRef.current = window.setTimeout(() => {
      pollingReport({ pollingInfos: nextPollingInfos, interval });
    }, interval * 1000);
  };

  const stopPollingReports = () => {
    window.clearTimeout(timerIdRef.current);
    setHasPollingStarted(false);
  };

  const assembleReportData = (response: ReportResponseDTO): ReportResponseDTO => {
    const exportValidityTime = exportValidityTimeMapper(response.exportValidityTime);
    return { ...response, exportValidityTime: exportValidityTime };
  };

  const resetTimeoutMessage = (metricTypes: string[]) => {
    setReportInfos((preReportInfos) => {
      return preReportInfos.map((reportInfo) => {
        if (metricTypes.length === 2) {
          reportInfo.timeout4Report = { message: DEFAULT_MESSAGE, shouldShow: true };
        } else if (metricTypes.includes(MetricTypes.Board)) {
          reportInfo.timeout4Board = { message: DEFAULT_MESSAGE, shouldShow: true };
        } else {
          reportInfo.timeout4Dora = { message: DEFAULT_MESSAGE, shouldShow: true };
        }
        return reportInfo;
      });
    });
  };

  const resetReportPageLoadingStatus = (dateRangeList: DateRangeList) => {
    const loadingStatus = {
      isLoading: false,
      isLoaded: false,
      isLoadedWithError: false,
    };
    const payload = dateRangeList.map(({ startDate }) => ({
      startDate: formatDateToTimestampString(startDate!),
      loadingStatus: {
        gainPollingUrl: { isLoading: true, isLoaded: false, isLoadedWithError: false },
        polling: { ...loadingStatus },
        boardMetrics: { ...loadingStatus },
        pipelineMetrics: { ...loadingStatus },
        sourceControlMetrics: { ...loadingStatus },
      },
    }));
    dispatch(updateReportPageLoadingStatus(payload));
  };

  function resetPollingLoadingStatusBeforePolling(dates: string[]) {
    const loadingStatus = {
      isLoading: true,
      isLoaded: false,
      isLoadedWithError: false,
    };
    const payload = dates.map((date) => ({
      startDate: formatDateToTimestampString(date),
      loadingStatus: {
        polling: { ...loadingStatus },
        boardMetrics: { ...loadingStatus },
        pipelineMetrics: { ...loadingStatus },
        sourceControlMetrics: { ...loadingStatus },
      },
    }));
    dispatch(updateReportPageLoadingStatus(payload));
  }

  const updateErrorAfterFetchReport = (
    res: PromiseSettledResult<ReportCallbackResponse>[],
    metricTypes: MetricTypes[],
  ) => {
    updateReportPageLoadingStatusAfterReport(res);

    if (res.filter(({ status }) => status === REJECTED).length === 0) return;

    setReportInfos((preReportInfos: IReportInfo[]) => {
      return preReportInfos.map((resInfo, index) => {
        const currentRes = res[index];
        if (currentRes.status === REJECTED) {
          const source: MetricTypes = metricTypes.length === 2 ? MetricTypes.All : metricTypes[0];
          const errorKey = getErrorKey(currentRes.reason, source) as keyof IReportError;
          resInfo[errorKey] = { message: DATA_LOADING_FAILED, shouldShow: true };
        }
        return resInfo;
      });
    });
  };

  function updateReportPageLoadingStatusAfterPolling(
    pollingResponsesWithId: PromiseSettledResultWithId<IPollingRes>[],
  ) {
    const updateReportPageFailedTimeRangeInfosPayload: IPageLoadingStatusPayload<IReportPageLoadingStatus>[] = [];
    pollingResponsesWithId.forEach((currentRes) => {
      const isRejected = currentRes.status === REJECTED;
      if (isRejected || currentRes.value.response.allMetricsCompleted) {
        updateReportPageFailedTimeRangeInfosPayload.push({
          startDate: formatDateToTimestampString(currentRes.id),
          loadingStatus: {
            polling: {
              isLoading: false,
              isLoaded: true,
              isLoadedWithError: isRejected,
            },
            boardMetrics: {
              isLoading: false,
              isLoaded: true,
              isLoadedWithError: !isRejected && !!currentRes.value.response.reportMetricsError.boardMetricsError,
            },
            pipelineMetrics: {
              isLoading: false,
              isLoaded: true,
              isLoadedWithError: !isRejected && !!currentRes.value.response.reportMetricsError.pipelineMetricsError,
            },
            sourceControlMetrics: {
              isLoading: false,
              isLoaded: true,
              isLoadedWithError:
                !isRejected && !!currentRes.value.response.reportMetricsError.sourceControlMetricsError,
            },
          },
        });
      }
    });
    dispatch(updateReportPageLoadingStatus(updateReportPageFailedTimeRangeInfosPayload));
  }

  function updateReportPageLoadingStatusAfterReport(res: PromiseSettledResult<ReportCallbackResponse>[]) {
    const updateReportPageFailedTimeRangeInfosPayload: IPageLoadingStatusPayload<IReportPageLoadingStatus>[] = [];
    res.forEach((currentRes, index) => {
      updateReportPageFailedTimeRangeInfosPayload.push({
        startDate: formatDateToTimestampString(reportInfos[index].id),
        loadingStatus: {
          gainPollingUrl: {
            isLoading: false,
            isLoaded: true,
            isLoadedWithError: currentRes.status === REJECTED,
          },
        },
      });
    });
    dispatch(updateReportPageLoadingStatus(updateReportPageFailedTimeRangeInfosPayload));
  }

  const assemblePollingParams = (res: PromiseSettledResult<ReportCallbackResponse>[]) => {
    const resWithIds: PromiseSettledResultWithId<ReportCallbackResponse>[] = res.map((item, index) => ({
      ...item,
      id: reportInfos[index].id,
    }));

    const fulfilledResponses: PromiseSettledResultWithId<ReportCallbackResponse>[] = resWithIds.filter(
      ({ status }) => status === FULFILLED,
    );

    const pollingInfos: Record<string, string>[] = fulfilledResponses.map((v) => {
      return { callbackUrl: (v as PromiseFulfilledResult<ReportCallbackResponse>).value.callbackUrl, id: v.id };
    });

    const pollingInterval = (fulfilledResponses[0] as PromiseFulfilledResult<ReportCallbackResponse>)?.value.interval;
    return { pollingInfos, pollingInterval };
  };

  const assemblePollingResWithId = (
    pollingResponses: Array<PromiseSettledResult<Awaited<Promise<IPollingRes>>>>,
    pollingInfos: Record<string, string>[],
  ) => {
    const pollingResponsesWithId: PromiseSettledResultWithId<IPollingRes>[] = pollingResponses.map(
      (singleRes, index) => ({
        ...singleRes,
        id: pollingInfos[index].id,
      }),
    );
    return pollingResponsesWithId;
  };

  const getNextPollingInfos = (
    pollingResponsesWithId: PromiseSettledResultWithId<IPollingRes>[],
    pollingInfos: Record<string, string>[],
  ) => {
    const nextPollingInfos: Record<string, string>[] = pollingResponsesWithId
      .filter(
        (pollingResponseWithId) =>
          pollingResponseWithId.status === FULFILLED &&
          !pollingResponseWithId.value.response.allMetricsCompleted &&
          nextHasPollingStarted,
      )
      .map((pollingResponseWithId) => pollingInfos.find((pollingInfo) => pollingInfo.id === pollingResponseWithId.id)!);
    return nextPollingInfos;
  };

  const initReportInfosTimeout4Report = (pollingIds: string[]) => {
    setReportInfos((preInfos) => {
      return preInfos.map((info) => {
        if (pollingIds.includes(info.id)) {
          info.timeout4Report = { message: DEFAULT_MESSAGE, shouldShow: true };
        }
        return info;
      });
    });
  };

  const closeReportInfosErrorStatus = (id: string, errorKey: string) => {
    setReportInfos((preReportInfos) => {
      return preReportInfos.map((reportInfo) => {
        if (reportInfo.id === id) {
          const key = errorKey as keyof IReportError;
          reportInfo[key].shouldShow = false;
        }
        return reportInfo;
      });
    });
  };

  const closeBoardMetricsError = (id: string) => {
    setReportInfos((preReportInfos) => {
      return preReportInfos.map((reportInfo) => {
        if (reportInfo.id === id) {
          reportInfo.shouldShowBoardMetricsError = false;
        }
        return reportInfo;
      });
    });
  };

  const closePipelineMetricsError = (id: string) => {
    setReportInfos((preReportInfos) => {
      return preReportInfos.map((reportInfo) => {
        if (reportInfo.id === id) {
          reportInfo.shouldShowPipelineMetricsError = false;
        }
        return reportInfo;
      });
    });
  };

  const closeSourceControlMetricsError = (id: string) => {
    setReportInfos((preReportInfos) => {
      return preReportInfos.map((reportInfo) => {
        if (reportInfo.id === id) {
          reportInfo.shouldShowSourceControlMetricsError = false;
        }
        return reportInfo;
      });
    });
  };

  return {
    startToRequestData,
    stopPollingReports,
    reportInfos,
    closeReportInfosErrorStatus,
    closeBoardMetricsError,
    closePipelineMetricsError,
    closeSourceControlMetricsError,
    hasPollingStarted,
  };
};
