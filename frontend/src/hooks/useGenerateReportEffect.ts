import { ReportCallbackResponse, ReportResponseDTO } from '@src/clients/report/dto/response';
import { exportValidityTimeMapper } from '@src/hooks/reportMapper/exportValidityTime';
import { DATA_LOADING_FAILED, DEFAULT_MESSAGE } from '@src/constants/resources';
import { IPollingRes, reportClient } from '@src/clients/report/ReportClient';
import { DateRange, selectConfig } from '@src/context/config/configSlice';
import { ReportRequestDTO } from '@src/clients/report/dto/request';
import { formatDateToTimestampString } from '@src/utils/util';
import { TimeoutError } from '@src/errors/TimeoutError';
import { METRIC_TYPES } from '@src/constants/commons';
import { useAppSelector } from '@src/hooks/index';
import { useRef, useState } from 'react';
import get from 'lodash/get';

export type PromiseSettledResultWithId<T> = PromiseSettledResult<T> & {
  id: string;
};

export interface IUseGenerateReportEffectInterface {
  startToRequestData: (params: ReportRequestDTO) => void;
  stopPollingReports: () => void;
  reportInfos: IReportInfo[];
  shutReportInfosErrorStatus: (id: string, errorKey: string) => void;
  shutBoardMetricsError: (id: string) => void;
  shutPipelineMetricsError: (id: string) => void;
  shutSourceControlMetricsError: (id: string) => void;
  hasPollingStarted: boolean;
}

export interface IReportError {
  timeout4Board: { message: string; shouldShow: boolean };
  timeout4Dora: { message: string; shouldShow: boolean };
  timeout4Report: { message: string; shouldShow: boolean };
  generalError4Board: { message: string; shouldShow: boolean };
  generalError4Dora: { message: string; shouldShow: boolean };
  generalError4Report: { message: string; shouldShow: boolean };
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
  [METRIC_TYPES.BOARD]: 'timeout4Board',
  [METRIC_TYPES.DORA]: 'timeout4Dora',
  [METRIC_TYPES.ALL]: 'timeout4Report',
};

export const GeneralErrorKey = {
  [METRIC_TYPES.BOARD]: 'generalError4Board',
  [METRIC_TYPES.DORA]: 'generalError4Dora',
  [METRIC_TYPES.ALL]: 'generalError4Report',
};

const getErrorKey = (error: Error, source: METRIC_TYPES): string => {
  return error instanceof TimeoutError ? TimeoutErrorKey[source] : GeneralErrorKey[source];
};

export const useGenerateReportEffect = (): IUseGenerateReportEffectInterface => {
  const reportPath = '/reports';
  const configData = useAppSelector(selectConfig);
  const timerIdRef = useRef<number>();
  const dateRanges: DateRange = get(configData, 'basic.dateRange', []);
  const [reportInfos, setReportInfos] = useState<IReportInfo[]>(
    dateRanges.map((dateRange) => ({ ...initReportInfo(), id: dateRange.startDate as string })),
  );
  const [hasPollingStarted, setHasPollingStarted] = useState<boolean>(false);
  let nextHasPollingStarted = false;
  const startToRequestData = async (params: ReportRequestDTO) => {
    const { metricTypes } = params;
    resetTimeoutMessage(metricTypes);
    const res: PromiseSettledResult<ReportCallbackResponse>[] = await Promise.allSettled(
      dateRanges.map(({ startDate, endDate }) =>
        reportClient.retrieveByUrl(
          {
            ...params,
            startTime: formatDateToTimestampString(startDate!),
            endTime: formatDateToTimestampString(endDate!),
          },
          reportPath,
        ),
      ),
    );

    updateErrorAfterFetchReport(res, metricTypes);

    if (hasPollingStarted) return;
    nextHasPollingStarted = true;
    setHasPollingStarted(nextHasPollingStarted);

    const { pollingInfos, pollingInterval } = assemblePollingParams(res);

    await pollingReport({ pollingInfos, interval: pollingInterval });
  };

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

    updateReportInfosAfterPolling(pollingResponsesWithId);

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

  function updateReportInfosAfterPolling(pollingResponsesWithId: PromiseSettledResultWithId<IPollingRes>[]) {
    setReportInfos((preReportInfos) => {
      return preReportInfos.map((reportInfo) => {
        const matchedRes = pollingResponsesWithId.find((singleRes) => singleRes.id === reportInfo.id);
        if (!matchedRes) return reportInfo;

        if (matchedRes.status === 'fulfilled') {
          const { response } = matchedRes.value;
          reportInfo.reportData = assembleReportData(response);
          reportInfo.shouldShowBoardMetricsError = true;
          reportInfo.shouldShowPipelineMetricsError = true;
          reportInfo.shouldShowSourceControlMetricsError = true;
        } else {
          const errorKey = getErrorKey(matchedRes.reason, METRIC_TYPES.ALL) as keyof IReportError;
          reportInfo[errorKey] = { message: DATA_LOADING_FAILED, shouldShow: true };
        }
        return reportInfo;
      });
    });
  }

  const assembleReportData = (response: ReportResponseDTO): ReportResponseDTO => {
    const exportValidityTime = exportValidityTimeMapper(response.exportValidityTime);
    return { ...response, exportValidityTime: exportValidityTime };
  };

  const resetTimeoutMessage = (metricTypes: string[]) => {
    if (metricTypes.length === 2) {
      setReportInfos((preReportInfos) => {
        return preReportInfos.map((reportInfo) => {
          reportInfo.timeout4Report = { message: DEFAULT_MESSAGE, shouldShow: true };
          return reportInfo;
        });
      });
    } else if (metricTypes.includes(METRIC_TYPES.BOARD)) {
      setReportInfos((preReportInfos) => {
        return preReportInfos.map((reportInfo) => {
          reportInfo.timeout4Board = { message: DEFAULT_MESSAGE, shouldShow: true };
          return reportInfo;
        });
      });
    } else {
      setReportInfos((preReportInfos) => {
        return preReportInfos.map((reportInfo) => {
          reportInfo.timeout4Dora = { message: DEFAULT_MESSAGE, shouldShow: true };
          return reportInfo;
        });
      });
    }
  };

  const updateErrorAfterFetchReport = (
    res: PromiseSettledResult<ReportCallbackResponse>[],
    metricTypes: METRIC_TYPES[],
  ) => {
    if (res.filter(({ status }) => status === 'rejected').length === 0) return;

    setReportInfos((preReportInfos: IReportInfo[]) => {
      return preReportInfos.map((resInfo, index) => {
        const currentRes = res[index];
        if (currentRes.status === 'rejected') {
          const source: METRIC_TYPES = metricTypes.length === 2 ? METRIC_TYPES.ALL : metricTypes[0];
          const errorKey = getErrorKey(currentRes.reason, source) as keyof IReportError;
          resInfo[errorKey] = { message: DATA_LOADING_FAILED, shouldShow: true };
        }
        return resInfo;
      });
    });
  };

  const assemblePollingParams = (res: PromiseSettledResult<ReportCallbackResponse>[]) => {
    const resWithIds: PromiseSettledResultWithId<ReportCallbackResponse>[] = res.map((item, index) => ({
      ...item,
      id: reportInfos[index].id,
    }));

    const fulfilledResponses: PromiseSettledResultWithId<ReportCallbackResponse>[] = resWithIds.filter(
      ({ status }) => status === 'fulfilled',
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
          pollingResponseWithId.status === 'fulfilled' &&
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

  const shutReportInfosErrorStatus = (id: string, errorKey: string) => {
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

  const shutBoardMetricsError = (id: string) => {
    setReportInfos((preReportInfos) => {
      return preReportInfos.map((reportInfo) => {
        if (reportInfo.id === id) {
          reportInfo.shouldShowBoardMetricsError = false;
        }
        return reportInfo;
      });
    });
  };

  const shutPipelineMetricsError = (id: string) => {
    setReportInfos((preReportInfos) => {
      return preReportInfos.map((reportInfo) => {
        if (reportInfo.id === id) {
          reportInfo.shouldShowPipelineMetricsError = false;
        }
        return reportInfo;
      });
    });
  };

  const shutSourceControlMetricsError = (id: string) => {
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
    shutReportInfosErrorStatus,
    shutBoardMetricsError,
    shutPipelineMetricsError,
    shutSourceControlMetricsError,
    hasPollingStarted,
  };
};
