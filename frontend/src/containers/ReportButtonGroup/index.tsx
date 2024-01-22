import { StyledButtonGroup, StyledExportButton, StyledRightButtonGroup } from '@src/containers/ReportButtonGroup/style';
import { BackButton, SaveButton } from '@src/containers/MetricsStepper/style';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import React from 'react';
import { CSVReportRequestDTO } from '@src/clients/report/dto/request';
import { useExportCsvEffect } from '@src/hooks/useExportCsvEffect';
import { ExpiredDialog } from '@src/containers/ReportStep/ExpiredDialog';
import { COMMON_BUTTONS, REPORT_TYPES } from '@src/constants/commons';
import { ReportResponseDTO } from '@src/clients/report/dto/response';
import { TIPS } from '@src/constants/resources';
import { Tooltip } from '@mui/material';
import { useNotificationLayoutEffectInterface } from '@src/hooks/useNotificationLayoutEffect';

interface ReportButtonGroupProps {
  notification: useNotificationLayoutEffectInterface;
  handleSave?: () => void;
  handleBack: () => void;
  csvTimeStamp: number;
  startDate: string;
  endDate: string;
  reportData: ReportResponseDTO | undefined;
  isShowSave: boolean;
  isShowExportBoardButton: boolean;
  isShowExportPipelineButton: boolean;
  isShowExportMetrics: boolean;
}

export const ReportButtonGroup = ({
  notification,
  handleSave,
  handleBack,
  csvTimeStamp,
  startDate,
  endDate,
  reportData,
  isShowSave,
  isShowExportMetrics,
  isShowExportBoardButton,
  isShowExportPipelineButton,
}: ReportButtonGroupProps) => {
  const { fetchExportData, isExpired } = useExportCsvEffect(notification);

  const exportCSV = (dataType: REPORT_TYPES, startDate: string, endDate: string): CSVReportRequestDTO => ({
    dataType: dataType,
    csvTimeStamp: csvTimeStamp,
    startDate: startDate,
    endDate: endDate,
  });

  const handleDownload = (dataType: REPORT_TYPES, startDate: string, endDate: string) => {
    fetchExportData(exportCSV(dataType, startDate, endDate));
  };

  const pipelineButtonDisabled =
    !reportData ||
    reportData.pipelineMetricsCompleted === false ||
    reportData.sourceControlMetricsCompleted === false ||
    reportData?.reportMetricsError?.pipelineMetricsError ||
    reportData?.reportMetricsError?.sourceControlMetricsError;

  const isReportHasError =
    !!reportData?.reportMetricsError.boardMetricsError ||
    !!reportData?.reportMetricsError.pipelineMetricsError ||
    !!reportData?.reportMetricsError.sourceControlMetricsError;

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
              disabled={!(reportData?.allMetricsCompleted && !isReportHasError)}
              onClick={() => handleDownload(REPORT_TYPES.METRICS, startDate, endDate)}
            >
              {COMMON_BUTTONS.EXPORT_METRIC_DATA}
            </StyledExportButton>
          )}
          {isShowExportBoardButton && (
            <StyledExportButton
              disabled={!(reportData?.boardMetricsCompleted && !reportData?.reportMetricsError?.boardMetricsError)}
              onClick={() => handleDownload(REPORT_TYPES.BOARD, startDate, endDate)}
            >
              {COMMON_BUTTONS.EXPORT_BOARD_DATA}
            </StyledExportButton>
          )}
          {isShowExportPipelineButton && (
            <StyledExportButton
              disabled={!!pipelineButtonDisabled}
              onClick={() => handleDownload(REPORT_TYPES.PIPELINE, startDate, endDate)}
            >
              {COMMON_BUTTONS.EXPORT_PIPELINE_DATA}
            </StyledExportButton>
          )}
        </StyledRightButtonGroup>
      </StyledButtonGroup>
      {<ExpiredDialog isExpired={isExpired} handleOk={handleBack} />}
    </>
  );
};
