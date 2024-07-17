import { ReportDataWithTwoColumns } from '@src/hooks/reportMapper/reportUIDataStructure';
import ReportForThreeColumns from '@src/components/Common/ReportForThreeColumns';
import { MESSAGE, MetricsTitle, RequiredData } from '@src/constants/resources';
import { addNotification } from '@src/context/notification/NotificationSlice';
import ReportForTwoColumns from '@src/components/Common/ReportForTwoColumns';
import { ReportResponseDTO } from '@src/clients/report/dto/response';
import { reportMapper } from '@src/hooks/reportMapper/report';
import { useAppDispatch } from '@src/hooks/useAppDispatch';
import { Optional } from '@src/utils/types';
import React, { useEffect } from 'react';
import { withGoBack } from './withBack';

interface Property {
  data: ReportResponseDTO | undefined;
  onBack: () => void;
  errorMessage: string;
  metrics: string[];
  isShowBack: boolean;
}

const showSectionWith2Columns = (title: string, value: Optional<ReportDataWithTwoColumns[]>) =>
  value && <ReportForTwoColumns title={title} data={value} />;

export const BoardDetail = withGoBack(({ data, errorMessage, metrics }: Property) => {
  const dispatch = useAppDispatch();
  const onlySelectClassification = metrics.length === 1 && metrics[0] === RequiredData.Classification;
  const mappedData = data && reportMapper(data);

  useEffect(() => {
    if (onlySelectClassification && errorMessage) {
      dispatch(
        addNotification({
          message: MESSAGE.FAILED_TO_GET_CLASSIFICATION_DATA,
          type: 'error',
        }),
      );
    }
  }, [dispatch, onlySelectClassification, errorMessage]);

  return (
    <div style={{ margin: '2.25rem 0 0 0' }}>
      {showSectionWith2Columns(MetricsTitle.Velocity, mappedData?.velocityList)}
      {showSectionWith2Columns(MetricsTitle.CycleTime, mappedData?.cycleTimeList)}
      {metrics.includes(RequiredData.Classification) && (
        <ReportForThreeColumns
          title={MetricsTitle.Classification}
          fieldName={'Field Name'}
          listName={'Subtitle'}
          data={mappedData?.classification}
          errorMessage={errorMessage}
        />
      )}
      {showSectionWith2Columns(MetricsTitle.Rework, mappedData?.reworkList)}
    </div>
  );
});
