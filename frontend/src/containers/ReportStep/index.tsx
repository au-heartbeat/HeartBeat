import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useGenerateReportEffect } from '@src/hooks/useGenerateReportEffect';
import { useAppSelector } from '@src/hooks';
import { isSelectBoardMetrics, isSelectDoraMetrics, selectConfig } from '@src/context/config/configSlice';
import { MESSAGE, REPORT_PAGE_TYPE, REQUIRED_DATA } from '@src/constants/resources';
import { StyledCalendarWrapper } from '@src/containers/ReportStep/style';
import { Notification, useNotificationLayoutEffectInterface } from '@src/hooks/useNotificationLayoutEffect';
import BoardMetrics from '@src/containers/ReportStep/BoardMetrics';
import DoraMetrics from '@src/containers/ReportStep/DoraMetrics';
import { backStep, selectTimeStamp } from '@src/context/stepper/StepperSlice';
import { ReportButtonGroup } from '@src/containers/ReportButtonGroup';
import DateRangeViewer from '@src/components/Common/DateRangeViewer';
import { BoardDetail, DoraDetail } from './ReportDetail';
import { ReportResponseDTO } from '@src/clients/report/dto/response';
import { useAppDispatch } from '@src/hooks/useAppDispatch';

export interface ReportStepProps {
  notification: useNotificationLayoutEffectInterface;
  handleSave: () => void;
}

const ReportStep = ({ notification, handleSave }: ReportStepProps) => {
  const dispatch = useAppDispatch();
  const {
    startToRequestBoardData,
    startToRequestDoraData,
    reportData,
    stopPollingReports,
    timeout4Board,
    timeout4Dora,
    timeout4Report,
  } = useGenerateReportEffect(notification);

  const [exportValidityTimeMin, setExportValidityTimeMin] = useState<number | undefined | null>(undefined);
  const [pageType, setPageType] = useState<string>(REPORT_PAGE_TYPE.SUMMARY);
  const [isBackFromDetail, setIsBackFromDetail] = useState<boolean>(false);
  const [allMetricsCompleted, setAllMetricsCompleted] = useState<boolean>(false);
  const [notifications4SummaryPage, setNotifications4SummaryPage] = useState<Omit<Notification, 'id'>[]>([]);

  const configData = useAppSelector(selectConfig);
  const csvTimeStamp = useAppSelector(selectTimeStamp);

  const startDate = configData.basic.dateRange.startDate ?? '';
  const endDate = configData.basic.dateRange.endDate ?? '';
  const metrics = configData.basic.metrics;

  const { addNotification, closeAllNotifications } = notification;

  const shouldShowBoardMetrics = useAppSelector(isSelectBoardMetrics);
  const shouldShowDoraMetrics = useAppSelector(isSelectDoraMetrics);
  const onlySelectClassification = metrics.length === 1 && metrics[0] === REQUIRED_DATA.CLASSIFICATION;
  const isSummaryPage = useMemo(() => pageType === REPORT_PAGE_TYPE.SUMMARY, [pageType]);

  useEffect(() => {
    setPageType(onlySelectClassification ? REPORT_PAGE_TYPE.BOARD : REPORT_PAGE_TYPE.SUMMARY);
    return () => {
      stopPollingReports();
    };
  }, []);

  useLayoutEffect(() => {
    exportValidityTimeMin &&
      allMetricsCompleted &&
      addNotification({
        message: MESSAGE.EXPIRE_INFORMATION(exportValidityTimeMin),
      });
  }, [exportValidityTimeMin, allMetricsCompleted]);

  useLayoutEffect(() => {
    if (exportValidityTimeMin && allMetricsCompleted) {
      const startTime = Date.now();
      const timer = setInterval(() => {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;

        const remainingExpireTime = 5 * 60 * 1000;
        const remainingTime = exportValidityTimeMin * 60 * 1000 - elapsedTime;
        if (remainingTime <= remainingExpireTime) {
          addNotification({
            message: MESSAGE.EXPIRE_INFORMATION(5),
          });
          clearInterval(timer);
        }
      }, 1000);

      return () => {
        clearInterval(timer);
      };
    }
  }, [exportValidityTimeMin, allMetricsCompleted]);

  useLayoutEffect(() => {
    closeAllNotifications();
  }, [pageType]);

  useEffect(() => {
    setExportValidityTimeMin(reportData?.exportValidityTime);
    reportData && setAllMetricsCompleted(reportData.allMetricsCompleted);
  }, [reportData]);

  useEffect(() => {
    if (isSummaryPage && notifications4SummaryPage.length > 0) {
      const notification = notifications4SummaryPage[0];
      notification && addNotification(notification);
      setNotifications4SummaryPage(notifications4SummaryPage.slice(1));
    }
  }, [notifications4SummaryPage, isSummaryPage]);

  useEffect(() => {
    if (reportData?.reportMetricsError.boardMetricsError) {
      setNotifications4SummaryPage((prevState) => [
        ...prevState,
        {
          message: MESSAGE.FAILED_TO_GET_DATA('Board Metrics'),
          type: 'error',
        },
      ]);
    }
  }, [reportData?.reportMetricsError.boardMetricsError]);

  useEffect(() => {
    if (reportData?.reportMetricsError.pipelineMetricsError) {
      setNotifications4SummaryPage((prevState) => [
        ...prevState,
        {
          message: MESSAGE.FAILED_TO_GET_DATA('Buildkite'),
          type: 'error',
        },
      ]);
    }
  }, [reportData?.reportMetricsError.pipelineMetricsError]);

  useEffect(() => {
    if (reportData?.reportMetricsError.sourceControlMetricsError) {
      setNotifications4SummaryPage((prevState) => [
        ...prevState,
        {
          message: MESSAGE.FAILED_TO_GET_DATA('Github'),
          type: 'error',
        },
      ]);
    }
  }, [reportData?.reportMetricsError.sourceControlMetricsError]);

  useEffect(() => {
    timeout4Report &&
      setNotifications4SummaryPage((prevState) => [
        ...prevState,
        {
          message: MESSAGE.LOADING_TIMEOUT('Report'),
          type: 'error',
        },
      ]);
  }, [timeout4Report]);

  useEffect(() => {
    timeout4Board &&
      setNotifications4SummaryPage((prevState) => [
        ...prevState,
        {
          message: MESSAGE.LOADING_TIMEOUT('Board metrics'),
          type: 'error',
        },
      ]);
  }, [timeout4Board]);

  useEffect(() => {
    timeout4Dora &&
      setNotifications4SummaryPage((prevState) => [
        ...prevState,
        {
          message: MESSAGE.LOADING_TIMEOUT('DORA metrics'),
          type: 'error',
        },
      ]);
  }, [timeout4Dora]);

  const showSummary = () => (
    <>
      {shouldShowBoardMetrics && (
        <BoardMetrics
          isBackFromDetail={isBackFromDetail}
          startDate={startDate}
          endDate={endDate}
          startToRequestBoardData={startToRequestBoardData}
          onShowDetail={() => setPageType(REPORT_PAGE_TYPE.BOARD)}
          boardReport={reportData}
          csvTimeStamp={csvTimeStamp}
          timeoutError={timeout4Board || timeout4Report}
        />
      )}
      {shouldShowDoraMetrics && (
        <DoraMetrics
          isBackFromDetail={isBackFromDetail}
          startDate={startDate}
          endDate={endDate}
          startToRequestDoraData={startToRequestDoraData}
          onShowDetail={() => setPageType(REPORT_PAGE_TYPE.DORA)}
          doraReport={reportData}
          csvTimeStamp={csvTimeStamp}
          timeoutError={timeout4Dora || timeout4Report}
        />
      )}
    </>
  );
  const showBoardDetail = (data: ReportResponseDTO) => <BoardDetail onBack={() => handleBack()} data={data} />;
  const showDoraDetail = (data: ReportResponseDTO) => <DoraDetail onBack={() => backToSummaryPage()} data={data} />;

  const handleBack = () => {
    isSummaryPage || onlySelectClassification ? dispatch(backStep()) : backToSummaryPage();
  };

  const backToSummaryPage = () => {
    setPageType(REPORT_PAGE_TYPE.SUMMARY);
    setIsBackFromDetail(true);
  };

  return (
    <>
      {startDate && endDate && (
        <StyledCalendarWrapper data-testid={'calendarWrapper'} isSummaryPage={isSummaryPage}>
          <DateRangeViewer startDate={startDate} endDate={endDate} />
        </StyledCalendarWrapper>
      )}
      {isSummaryPage
        ? showSummary()
        : !!reportData &&
          (pageType === REPORT_PAGE_TYPE.BOARD ? showBoardDetail(reportData) : showDoraDetail(reportData))}
      <ReportButtonGroup
        notification={notification}
        isShowSave={isSummaryPage}
        isShowExportMetrics={isSummaryPage}
        isShowExportBoardButton={isSummaryPage ? shouldShowBoardMetrics : pageType === REPORT_PAGE_TYPE.BOARD}
        isShowExportPipelineButton={isSummaryPage ? shouldShowDoraMetrics : pageType === REPORT_PAGE_TYPE.DORA}
        handleBack={() => handleBack()}
        handleSave={() => handleSave()}
        reportData={reportData}
        startDate={startDate}
        endDate={endDate}
        csvTimeStamp={csvTimeStamp}
      />
    </>
  );
};

export default ReportStep;
