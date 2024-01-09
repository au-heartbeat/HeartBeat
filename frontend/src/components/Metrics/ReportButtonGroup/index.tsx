import { Tooltip } from '@mui/material'
import { TIPS } from '@src/constants/resources'
import { BackButton, SaveButton } from '@src/components/Metrics/MetricsStepper/style'
import SaveAltIcon from '@mui/icons-material/SaveAlt'
import { COMMON_BUTTONS, DOWNLOAD_TYPES } from '@src/constants/commons'
import React, { useEffect } from 'react'
import { CSVReportRequestDTO } from '@src/clients/report/dto/request'
import { useExportCsvEffect } from '@src/hooks/useExportCsvEffect'
import { ExpiredDialog } from '@src/components/Metrics/ReportStep/ExpiredDialog'
import {
  StyledButtonGroup,
  StyledExportButton,
  StyledRightButtonGroup,
} from '@src/components/Metrics/ReportButtonGroup/style'
import { ReportResponseDTO } from '@src/clients/report/dto/response'

interface ReportButtonGroupProps {
  handleSave?: () => void
  handleBack: () => void
  csvTimeStamp: number
  startDate: string
  endDate: string
  setErrorMessage: (message: string) => void
  reportData: ReportResponseDTO | undefined
  isShowSave: boolean
  isShowExportBoardButton: boolean
  isShowExportPipelineButton: boolean
  isShowExportMetrics: boolean
}

export const ReportButtonGroup = ({
  handleSave,
  handleBack,
  csvTimeStamp,
  startDate,
  endDate,
  setErrorMessage,
  reportData,
  isShowSave,
  isShowExportMetrics,
  isShowExportBoardButton,
  isShowExportPipelineButton,
}: ReportButtonGroupProps) => {
  const { fetchExportData, errorMessage, isExpired } = useExportCsvEffect()

  useEffect(() => {
    setErrorMessage(errorMessage)
  }, [errorMessage])

  const exportCSV = (dataType: DOWNLOAD_TYPES, startDate: string, endDate: string): CSVReportRequestDTO => ({
    dataType: dataType,
    csvTimeStamp: csvTimeStamp,
    startDate: startDate,
    endDate: endDate,
  })

  const handleDownload = (dataType: DOWNLOAD_TYPES, startDate: string, endDate: string) => {
    fetchExportData(exportCSV(dataType, startDate, endDate))
  }

  return (
    <>
      <StyledButtonGroup isShowSave={isShowSave}>
        {isShowSave && (
          <Tooltip title={TIPS.SAVE_CONFIG} placement={'right'}>
            <SaveButton variant='text' onClick={handleSave} startIcon={<SaveAltIcon />}>
              {COMMON_BUTTONS.SAVE}
            </SaveButton>
          </Tooltip>
        )}
        <StyledRightButtonGroup>
          <BackButton onClick={handleBack} variant='outlined'>
            {COMMON_BUTTONS.BACK}
          </BackButton>
          {isShowExportMetrics && (
            <StyledExportButton
              disabled={!reportData?.isAllMetricsReady}
              onClick={() => handleDownload(DOWNLOAD_TYPES.METRICS, startDate, endDate)}
            >
              {COMMON_BUTTONS.EXPORT_METRIC_DATA}
            </StyledExportButton>
          )}
          {isShowExportBoardButton && (
            <StyledExportButton
              disabled={!reportData?.isBoardMetricsReady}
              onClick={() => handleDownload(DOWNLOAD_TYPES.BOARD, startDate, endDate)}
            >
              {COMMON_BUTTONS.EXPORT_BOARD_DATA}
            </StyledExportButton>
          )}
          {isShowExportPipelineButton && (
            <StyledExportButton
              disabled={
                !reportData ||
                reportData.isPipelineMetricsReady === false ||
                reportData.isSourceControlMetricsReady === false
              }
              onClick={() => handleDownload(DOWNLOAD_TYPES.PIPELINE, startDate, endDate)}
            >
              {COMMON_BUTTONS.EXPORT_PIPELINE_DATA}
            </StyledExportButton>
          )}
        </StyledRightButtonGroup>
      </StyledButtonGroup>
      {<ExpiredDialog isExpired={isExpired} handleOk={handleBack} />}
    </>
  )
}
