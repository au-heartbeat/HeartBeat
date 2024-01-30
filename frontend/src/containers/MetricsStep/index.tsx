import {
  selectDateRange,
  selectJiraColumns,
  selectIsProjectCreated,
  selectMetrics,
  selectUsers,
  updateBoardVerifyState,
  selectBoard,
} from '@src/context/config/configSlice';
import {
  MetricSelectionHeader,
  MetricSelectionWrapper,
  MetricsSelectionTitle,
} from '@src/containers/MetricsStep/style';
import { DeploymentFrequencySettings } from '@src/containers/MetricsStep/DeploymentFrequencySettings';
import { selectMetricsContent, updateMetricsState } from '@src/context/Metrics/metricsSlice';
import { CYCLE_TIME_SETTINGS_TYPES, DONE, REQUIRED_DATA } from '@src/constants/resources';
import { closeAllNotifications } from '@src/context/notification/NotificationSlice';
import { Classification } from '@src/containers/MetricsStep/Classification';
import DateRangeViewer from '@src/components/Common/DateRangeViewer';
import { useGetBoardInfoEffect } from '@src/hooks/useGetBoardInfo';
import { CycleTime } from '@src/containers/MetricsStep/CycleTime';
import { RealDone } from '@src/containers/MetricsStep/RealDone';
import EmptyContent from '@src/components/Common/EmptyContent';
import { useAppSelector, useAppDispatch } from '@src/hooks';
import { Crews } from '@src/containers/MetricsStep/Crews';
import { Loading } from '@src/components/Loading';
import { useLayoutEffect } from 'react';
import isEmpty from 'lodash/isEmpty';
import merge from 'lodash/merge';

const MetricsStep = () => {
  const boardConfig = useAppSelector(selectBoard);
  const isProjectCreated = useAppSelector(selectIsProjectCreated);
  const dispatch = useAppDispatch();
  const requiredData = useAppSelector(selectMetrics);
  const users = useAppSelector(selectUsers);
  const jiraColumns = useAppSelector(selectJiraColumns);
  const targetFields = useAppSelector(selectMetricsContent).targetFields;
  const { cycleTimeSettings, cycleTimeSettingsType } = useAppSelector(selectMetricsContent);
  const { startDate, endDate } = useAppSelector(selectDateRange);
  const isShowCrewsAndRealDone =
    requiredData.includes(REQUIRED_DATA.VELOCITY) ||
    requiredData.includes(REQUIRED_DATA.CYCLE_TIME) ||
    requiredData.includes(REQUIRED_DATA.CLASSIFICATION);
  const isShowRealDone =
    cycleTimeSettingsType === CYCLE_TIME_SETTINGS_TYPES.BY_COLUMN &&
    cycleTimeSettings.filter((e) => e.value === DONE).length > 1;
  const { getBoardInfo, isLoading, errorMessage } = useGetBoardInfoEffect();

  console.log(errorMessage, 'error message is');

  const getInfo = () => {
    getBoardInfo(boardConfig).then((res) => {
      if (res.data) {
        dispatch(updateBoardVerifyState(true));
        dispatch(updateMetricsState(merge(res.data, { isProjectCreated: isProjectCreated })));
      }
    });
  };

  useLayoutEffect(() => {
    dispatch(closeAllNotifications());
    getInfo();
  }, []);

  return (
    <>
      {startDate && endDate && (
        <MetricSelectionHeader>
          <DateRangeViewer startDate={startDate} endDate={endDate} />
        </MetricSelectionHeader>
      )}
      <MetricSelectionWrapper>
        {isLoading && <Loading />}
        {isEmpty(errorMessage) ? (
          <>
            <MetricsSelectionTitle>Board configuration</MetricsSelectionTitle>

            {isShowCrewsAndRealDone && <Crews options={users} title={'Crew settings'} label={'Included Crews'} />}

            {requiredData.includes(REQUIRED_DATA.CYCLE_TIME) && <CycleTime />}

            {isShowCrewsAndRealDone && isShowRealDone && (
              <RealDone columns={jiraColumns} title={'Real done setting'} label={'Consider as Done'} />
            )}

            {requiredData.includes(REQUIRED_DATA.CLASSIFICATION) && (
              <Classification targetFields={targetFields} title={'Classification setting'} label={'Distinguished By'} />
            )}
          </>
        ) : (
          <EmptyContent title={errorMessage.title} message={errorMessage.message} />
        )}
      </MetricSelectionWrapper>

      {(requiredData.includes(REQUIRED_DATA.DEPLOYMENT_FREQUENCY) ||
        requiredData.includes(REQUIRED_DATA.CHANGE_FAILURE_RATE) ||
        requiredData.includes(REQUIRED_DATA.LEAD_TIME_FOR_CHANGES) ||
        requiredData.includes(REQUIRED_DATA.MEAN_TIME_TO_RECOVERY)) && (
        <MetricSelectionWrapper>
          <MetricsSelectionTitle>Pipeline configuration</MetricsSelectionTitle>
          <DeploymentFrequencySettings />
        </MetricSelectionWrapper>
      )}
    </>
  );
};

export default MetricsStep;
