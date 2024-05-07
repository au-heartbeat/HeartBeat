import { updateFailedMetricsPipelineTimeRange } from '@src/context/stepper/StepperSlice';
import { updateShouldRetryPipelineConfig } from '@src/context/Metrics/metricsSlice';
import { IStepsParams, IStepsRes, metricsClient } from '@src/clients/MetricsClient';
import { METRICS_DATA_FAIL_STATUS, DURATION } from '@src/constants/commons';
import { useAppDispatch } from '@src/hooks/useAppDispatch';
import { TimeoutError } from '@src/errors/TimeoutError';
import { MESSAGE } from '@src/constants/resources';
import { useState } from 'react';

export interface useGetMetricsStepsEffectInterface {
  getSteps: (
    params: IStepsParams[],
    organizationId: string,
    buildId: string,
    pipelineType: string,
    token: string,
  ) => Promise<IStepsRes | undefined>;
  isLoading: boolean;
  errorMessage: string;
  stepFailedStatus: METRICS_DATA_FAIL_STATUS;
  failedTimeRange: string[];
}

const TIMEOUT = 'timeout';

function isAllTimeoutError(allStepsRes: PromiseSettledResult<IStepsRes>[]) {
  return allStepsRes.every((stepInfo) => {
    return (stepInfo as PromiseRejectedResult).reason instanceof TimeoutError;
  });
}

export const useGetMetricsStepsEffect = (): useGetMetricsStepsEffectInterface => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [stepFailedStatus, setStepFailedStatus] = useState(METRICS_DATA_FAIL_STATUS.NOT_FAILED);
  const [failedTimeRange, setFailedTimeRange] = useState<string[]>([]);

  const getSteps = async (
    params: IStepsParams[],
    organizationId: string,
    buildId: string,
    pipelineType: string,
    token: string,
  ) => {
    setIsLoading(true);
    const allStepsRes = await Promise.allSettled<IStepsRes>(
      params.map((param) => {
        return metricsClient.getSteps(param, organizationId, buildId, pipelineType, token);
      }),
    );
    const hasRejected = allStepsRes.some((stepInfo) => stepInfo.status === 'rejected');
    const hasFulfilled = allStepsRes.some((stepInfo) => stepInfo.status === 'fulfilled');
    const rejectedIndices = allStepsRes.reduce((indices: number[], stepInfo, index) => {
      if (stepInfo.status === 'rejected') {
        indices.push(index);
      }
      return indices;
    }, []);
    const rejectedTimeRanges = rejectedIndices.map((index) => params[index].startTime.toString());
    setFailedTimeRange(rejectedTimeRanges);
    dispatch(updateFailedMetricsPipelineTimeRange(rejectedTimeRanges));
    if (!hasRejected) {
      setStepFailedStatus(METRICS_DATA_FAIL_STATUS.NOT_FAILED);
    } else if (hasRejected && hasFulfilled) {
      const rejectedStep = allStepsRes.find((stepInfo) => stepInfo.status === 'rejected');
      if ((rejectedStep as PromiseRejectedResult).reason.code == 400) {
        setStepFailedStatus(METRICS_DATA_FAIL_STATUS.PARTIAL_FAILED_4XX);
      } else {
        setStepFailedStatus(METRICS_DATA_FAIL_STATUS.PARTIAL_FAILED_TIMEOUT);
      }
    }
    setIsLoading(false);
    if (allStepsRes.every((stepInfo) => stepInfo.status === 'rejected')) {
      if (isAllTimeoutError(allStepsRes)) {
        dispatch(updateShouldRetryPipelineConfig(true));
        setErrorMessageAndTime(pipelineType, TIMEOUT);
        return;
      }
      setErrorMessageAndTime(pipelineType);
      return;
    }

    return allStepsRes
      .filter((stepInfo) => stepInfo.status === 'fulfilled')
      .map((stepInfo) => (stepInfo as PromiseFulfilledResult<IStepsRes>).value)
      .reduce(
        (accumulator, currentValue) => {
          return {
            response: Array.from(new Set([...accumulator.response, ...currentValue.response])),
            haveStep: accumulator.haveStep || currentValue.haveStep,
            branches: Array.from(new Set([...accumulator.branches, ...currentValue.branches])),
            pipelineCrews: Array.from(new Set([...accumulator.pipelineCrews, ...currentValue.pipelineCrews])),
          };
        },
        {
          response: [],
          haveStep: false,
          branches: [],
          pipelineCrews: [],
        } as IStepsRes,
      );
  };

  const setErrorMessageAndTime = (pipelineType: string, errReason?: string) => {
    setErrorMessage(`${MESSAGE.GET_STEPS_FAILED} ${pipelineType} steps${errReason ? ': ' + errReason : ''}`);
    setTimeout(() => {
      setErrorMessage('');
    }, DURATION.ERROR_MESSAGE_TIME);
  };

  return { isLoading, getSteps, errorMessage, stepFailedStatus, failedTimeRange };
};
