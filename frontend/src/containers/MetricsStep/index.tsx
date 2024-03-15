import {
  selectDateRange,
  selectIsProjectCreated,
  selectMetrics,
  updateBoardVerifyState,
  selectBoard,
  updateJiraVerifyResponse,
  selectUsers,
  selectJiraColumns,
} from '@src/context/config/configSlice';
import {
  CYCLE_TIME_SETTINGS_TYPES,
  DONE,
  PipelineConfigInfoTitle,
  PIPELINE_TOOL_GET_INFO_NO_CONTENT_ERROR_MESSAGE,
  REQUIRED_DATA,
} from '@src/constants/resources';
import {
  selectMetricsContent,
  updateMetricsState,
  selectShouldGetBoardConfig,
  updateShouldGetBoardConfig,
} from '@src/context/Metrics/metricsSlice';
import {
  MetricSelectionHeader,
  MetricSelectionWrapper,
  MetricsSelectionTitle,
} from '@src/containers/MetricsStep/style';
import { DeploymentFrequencySettings } from '@src/containers/MetricsStep/DeploymentFrequencySettings';
import { StyledRetryButton, StyledErrorMessage } from '@src/containers/MetricsStep/style';
import { closeAllNotifications } from '@src/context/notification/NotificationSlice';
import { IMetricsInitialValues } from '@src/containers/MetricsStep/form/types';
import { Classification } from '@src/containers/MetricsStep/Classification';
import { BoardCrews } from '@src/containers/MetricsStep/Crews/BoardCrews';
import { shouldMetricsLoad } from '@src/context/stepper/StepperSlice';
import DateRangeViewer from '@src/components/Common/DateRangeViewer';
import { HEARTBEAT_EXCEPTION_CODE } from '@src/constants/resources';
import { useGetBoardInfoEffect } from '@src/hooks/useGetBoardInfo';
import { CycleTime } from '@src/containers/MetricsStep/CycleTime';
import { RealDone } from '@src/containers/MetricsStep/RealDone';
import EmptyContent from '@src/components/Common/EmptyContent';
import { useAppSelector, useAppDispatch } from '@src/hooks';
import { useCallback, useLayoutEffect } from 'react';
import { Loading } from '@src/components/Loading';
import { useFormik, Formik, Form } from 'formik';
import { Advance } from './Advance/Advance';
import isEmpty from 'lodash/isEmpty';
import merge from 'lodash/merge';
import dayjs from 'dayjs';

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
  const shouldLoad = useAppSelector(shouldMetricsLoad);
  const shouldGetBoardConfig = useAppSelector(selectShouldGetBoardConfig);
  const isFutureTime = dayjs().isBefore(startDate);

  const getInfo = useCallback(
    () =>
      getBoardInfo({
        ...boardConfig,
        startTime: dayjs(startDate).valueOf().toString(),
        endTime: dayjs(endDate).valueOf().toString(),
      }).then((res) => {
        if (res.data) {
          dispatch(updateBoardVerifyState(true));
          dispatch(updateJiraVerifyResponse(res.data));
          dispatch(updateMetricsState(merge(res.data, { isProjectCreated: isProjectCreated })));
          dispatch(updateShouldGetBoardConfig(false));
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useLayoutEffect(() => {
    if (!shouldLoad) return;
    dispatch(closeAllNotifications());
    if (!isShowCrewsAndRealDone || !shouldGetBoardConfig) return;
    getInfo();
  }, [shouldLoad, isShowCrewsAndRealDone, shouldGetBoardConfig, dispatch, getInfo]);

  const formik = useFormik<IMetricsInitialValues>({
    initialValues: {
      board: {
        crews: [],
      },
      pipeline: {
        crews: [],
      },
    },
    onSubmit(values) {
      console.log('values', values);
    },
  });

  console.log('formik', formik);
  return (
    <>
      <Formik initialValues={formik.initialValues} onSubmit={() => formik.handleSubmit()}>
        <Form>
          {startDate && endDate && (
            <MetricSelectionHeader>
              <DateRangeViewer startDate={startDate} endDate={endDate} />
            </MetricSelectionHeader>
          )}

          {isShowCrewsAndRealDone && (
            <MetricSelectionWrapper>
              {isLoading && <Loading />}
              <MetricsSelectionTitle>Board configuration</MetricsSelectionTitle>
              {isEmpty(errorMessage) ? (
                <>
                  <BoardCrews name={'board.crews'} options={users} title={'Crew settings'} label={'Included Crews'} />

                  <CycleTime />

                  {isShowRealDone && (
                    <RealDone columns={jiraColumns} title={'Real done setting'} label={'Consider as Done'} />
                  )}

                  {requiredData.includes(REQUIRED_DATA.CLASSIFICATION) && (
                    <Classification
                      targetFields={targetFields}
                      title={'Classification setting'}
                      label={'Distinguished By'}
                    />
                  )}
                  <Advance />
                </>
              ) : (
                <EmptyContent
                  title={errorMessage.title}
                  message={
                    errorMessage.code !== HEARTBEAT_EXCEPTION_CODE.TIMEOUT ? (
                      errorMessage.message
                    ) : (
                      <>
                        <StyledErrorMessage>{errorMessage.message}</StyledErrorMessage>
                        {<StyledRetryButton onClick={getInfo}>try again</StyledRetryButton>}
                      </>
                    )
                  }
                />
              )}
            </MetricSelectionWrapper>
          )}

          {(requiredData.includes(REQUIRED_DATA.DEPLOYMENT_FREQUENCY) ||
            requiredData.includes(REQUIRED_DATA.CHANGE_FAILURE_RATE) ||
            requiredData.includes(REQUIRED_DATA.LEAD_TIME_FOR_CHANGES) ||
            requiredData.includes(REQUIRED_DATA.MEAN_TIME_TO_RECOVERY)) && (
            <MetricSelectionWrapper aria-label='Pipeline Configuration Section'>
              <MetricsSelectionTitle>Pipeline configuration</MetricsSelectionTitle>
              {isFutureTime ? (
                <EmptyContent
                  title={PipelineConfigInfoTitle.NO_CONTENT}
                  message={PIPELINE_TOOL_GET_INFO_NO_CONTENT_ERROR_MESSAGE}
                />
              ) : (
                <DeploymentFrequencySettings />
              )}
            </MetricSelectionWrapper>
          )}
        </Form>
      </Formik>
    </>
  );
};

export default MetricsStep;
