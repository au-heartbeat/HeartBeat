import { useRef, useState } from 'react';
import { reportClient } from '@src/clients/report/ReportClient';
import { BoardReportRequestDTO, ReportRequestDTO } from '@src/clients/report/dto/request';
import { UnknownException } from '@src/exceptions/UnkonwException';
import { InternalServerException } from '@src/exceptions/InternalServerException';
import { ReportResponseDTO } from '@src/clients/report/dto/response';
import { DURATION, RETRIEVE_REPORT_TYPES } from '@src/constants/commons';
import { exportValidityTimeMapper } from '@src/hooks/reportMapper/exportValidityTime';
import { TimeoutException } from '@src/exceptions/TimeoutException';

export interface useGenerateReportEffectInterface {
  startToRequestBoardData: (boardParams: BoardReportRequestDTO) => void;
  startToRequestDoraData: (doraParams: ReportRequestDTO) => void;
  stopPollingReports: () => void;
  isServerError: boolean;
  timeout4Board: string;
  timeout4Dora: string;
  reportData: ReportResponseDTO | undefined;
}

export const useGenerateReportEffect = (): useGenerateReportEffectInterface => {
  const reportPath = '/reports';
  const [isServerError, setIsServerError] = useState(false);
  const [timeout4Board, setTimeout4Board] = useState('');
  const [timeout4Dora, setTimeout4Dora] = useState('');
  const [reportData, setReportData] = useState<ReportResponseDTO | undefined>();
  const timerIdRef = useRef<number>();
  let hasPollingStarted = false;

  const startToRequestBoardData = (boardParams: ReportRequestDTO) => {
    setTimeout4Board('');
    reportClient
      .retrieveReportByUrl(boardParams, `${reportPath}/${RETRIEVE_REPORT_TYPES.BOARD}`)
      .then((res) => {
        if (hasPollingStarted) return;
        hasPollingStarted = true;
        pollingReport(res.response.callbackUrl, res.response.interval);
      })
      .catch((e) => {
        handleError(e, 'Board');
        stopPollingReports();
      });
  };

  const handleError = (error: Error, source: string) => {
    if (error instanceof InternalServerException || error instanceof TimeoutException) {
      setIsServerError(true);
    } else {
      if (source === 'Board') {
        setTimeout4Board('Data loading failed');
      } else if (source === 'Dora') {
        setTimeout4Dora('Data loading failed');
      } else {
        setTimeout4Board('Data loading failed');
        setTimeout4Dora('Data loading failed');
      }
    }
  };

  const startToRequestDoraData = (doraParams: ReportRequestDTO) => {
    setTimeout4Dora('');
    reportClient
      .retrieveReportByUrl(doraParams, `${reportPath}/${RETRIEVE_REPORT_TYPES.DORA}`)
      .then((res) => {
        if (hasPollingStarted) return;
        hasPollingStarted = true;
        pollingReport(res.response.callbackUrl, res.response.interval);
      })
      .catch((e) => {
        handleError(e, 'Dora');
        stopPollingReports();
      });
  };

  const pollingReport = (url: string, interval: number) => {
    reportClient
      .pollingReport(url)
      .then((res: { status: number; response: ReportResponseDTO }) => {
        const response = res.response;
        handleAndUpdateData(response);
        if (response.allMetricsCompleted) {
          stopPollingReports();
        } else {
          timerIdRef.current = window.setTimeout(() => pollingReport(url, interval), interval * 1000);
        }
      })
      .catch((e) => {
        handleError(e, 'All');
        stopPollingReports();
      });
  };

  const stopPollingReports = () => {
    window.clearTimeout(timerIdRef.current);
    hasPollingStarted = false;
  };

  const handleAndUpdateData = (response: ReportResponseDTO) => {
    const exportValidityTime = exportValidityTimeMapper(response.exportValidityTime);
    setReportData({ ...response, exportValidityTime: exportValidityTime });
  };

  return {
    startToRequestBoardData,
    startToRequestDoraData,
    stopPollingReports,
    reportData,
    isServerError,
    timeout4Board,
    timeout4Dora,
  };
};
