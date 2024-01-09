import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useGenerateReportEffect } from '@src/hooks/useGenerateReportEffect'
import { useAppSelector } from '@src/hooks'
import { isSelectBoardMetrics, isSelectDoraMetrics, selectConfig } from '@src/context/config/configSlice'
import { MESSAGE } from '@src/constants/resources'
import { StyledErrorNotification } from '@src/components/Metrics/ReportStep/style'
import { ErrorNotification } from '@src/components/ErrorNotification'
import { useNavigate } from 'react-router-dom'
import { useNotificationLayoutEffectInterface } from '@src/hooks/useNotificationLayoutEffect'
import { ROUTE } from '@src/constants/router'
import { ReportButtonGroup } from '@src/components/Metrics/ReportButtonGroup'
import BoardMetrics from '@src/components/Metrics/ReportStep/BoradMetrics'
import DoraMetrics from '@src/components/Metrics/ReportStep/DoraMetrics'
import { selectTimeStamp } from '@src/context/stepper/StepperSlice'
import DateRangeViewer from '@src/components/Common/DateRangeViewer'
import { MetricSelectionHeader } from '../MetricsStep/style'
import { BoardDetail, DoraDetail } from './ReportDetail'
import { ReportResponseDTO } from '@src/clients/report/dto/response'

export interface ReportStepProps {
  notification: useNotificationLayoutEffectInterface
  handleSave: () => void
}

type PageType = 'Summary' | 'BoardReport' | 'DoraReport'

const ReportStep = ({ notification, handleSave }: ReportStepProps) => {
  const navigate = useNavigate()
  const {
    isServerError,
    errorMessage: reportErrorMsg,
    startToRequestBoardData,
    startToRequestDoraData,
    reportData,
    stopPollingReports,
  } = useGenerateReportEffect()

  const [exportValidityTimeMin, setExportValidityTimeMin] = useState<number | undefined | null>(undefined)
  const [pageType, setPageType] = useState<PageType>('Summary')
  const configData = useAppSelector(selectConfig)
  const csvTimeStamp = useAppSelector(selectTimeStamp)

  const startDate = configData.basic.dateRange.startDate ?? ''
  const endDate = configData.basic.dateRange.endDate ?? ''

  const { updateProps } = notification
  const [errorMessage, setErrorMessage] = useState<string>()

  const shouldShowBoardMetrics = useAppSelector(isSelectBoardMetrics)
  const shouldShowDoraMetrics = useAppSelector(isSelectDoraMetrics)

  useLayoutEffect(() => {
    exportValidityTimeMin &&
      updateProps?.({
        open: true,
        title: MESSAGE.NOTIFICATION_FIRST_REPORT.replace('%s', exportValidityTimeMin.toString()),
        closeAutomatically: true,
      })
  }, [exportValidityTimeMin])

  useLayoutEffect(() => {
    if (exportValidityTimeMin) {
      const startTime = Date.now()
      const timer = setInterval(() => {
        const currentTime = Date.now()
        const elapsedTime = currentTime - startTime

        const remainingExpireTime = 5 * 60 * 1000
        const remainingTime = exportValidityTimeMin * 60 * 1000 - elapsedTime
        if (remainingTime <= remainingExpireTime) {
          updateProps?.({
            open: true,
            title: MESSAGE.EXPIRE_IN_FIVE_MINUTES,
            closeAutomatically: true,
          })
          clearInterval(timer)
        }
      }, 1000)

      return () => {
        clearInterval(timer)
      }
    }
  }, [exportValidityTimeMin])

  useEffect(() => {
    setErrorMessage(reportErrorMsg)
  }, [reportErrorMsg])

  useEffect(() => {
    setExportValidityTimeMin(reportData?.exportValidityTime)
  }, [reportData])

  useLayoutEffect(() => {
    return () => {
      stopPollingReports()
    }
  }, [])

  const showSummary = () => (
    <>
      {shouldShowBoardMetrics && (
        <BoardMetrics
          startDate={startDate}
          endDate={endDate}
          startToRequestBoardData={startToRequestBoardData}
          onShowDetail={() => setPageType('BoardReport')}
          boardReport={reportData}
          csvTimeStamp={csvTimeStamp}
        />
      )}
      {shouldShowDoraMetrics && (
        <DoraMetrics
          startDate={startDate}
          endDate={endDate}
          startToRequestDoraData={startToRequestDoraData}
          onShowDetail={() => setPageType('DoraReport')}
          doraReport={reportData}
          csvTimeStamp={csvTimeStamp}
        />
      )}
    </>
  )
  const showBoardDetail = (data: ReportResponseDTO) => <BoardDetail onBack={() => setPageType('Summary')} data={data} />
  const showDoraDetail = (data: ReportResponseDTO) => <DoraDetail onBack={() => setPageType('Summary')} data={data} />

  return (
    <>
      {isServerError ? (
        navigate(ROUTE.ERROR_PAGE)
      ) : (
        <>
          {startDate && endDate && (
            <MetricSelectionHeader>
              <DateRangeViewer startDate={startDate} endDate={endDate} />
            </MetricSelectionHeader>
          )}
          {errorMessage && (
            <StyledErrorNotification>
              <ErrorNotification message={errorMessage} />
            </StyledErrorNotification>
          )}
          {pageType === 'Summary' ? showSummary() : !!reportData && (pageType === 'BoardReport' ? showBoardDetail(reportData) : showDoraDetail(reportData))}
          <ReportButtonGroup
            handleSave={() => handleSave()}
            reportData={reportData}
            startDate={startDate}
            endDate={endDate}
            csvTimeStamp={csvTimeStamp}
            setErrorMessage={(message) => {
              setErrorMessage(message)
            }}
          />
        </>
      )}
    </>
  )
}

export default ReportStep
