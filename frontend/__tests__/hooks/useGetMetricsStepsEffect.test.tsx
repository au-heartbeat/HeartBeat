import { useGetMetricsStepsEffect } from '@src/hooks/useGetMetricsStepsEffect';
import { act, renderHook, waitFor } from '@testing-library/react';
import { AxiosRequestErrorCode } from '@src/constants/resources';
import { MetricsDataFailStatus } from '@src/constants/commons';
import { metricsClient } from '@src/clients/MetricsClient';
import { setupStore } from '@test/utils/setupStoreUtil';
import { TimeoutError } from '@src/errors/TimeoutError';
import { MOCK_GET_STEPS_PARAMS } from '../fixtures';
import React, { ReactNode } from 'react';
import { Provider } from 'react-redux';

const mockDispatch = jest.fn();
jest.mock('@src/context/Metrics/metricsSlice', () => ({
  ...jest.requireActual('@src/context/Metrics/metricsSlice'),
  updateShouldRetryPipelineConfig: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

describe('use get steps effect', () => {
  const { params, buildId, organizationId, pipelineType, token } = MOCK_GET_STEPS_PARAMS;
  const store = setupStore();
  const wrapper = ({ children }: { children: ReactNode }) => {
    return <Provider store={store}>{children}</Provider>;
  };

  const setup = () => renderHook(() => useGetMetricsStepsEffect(), { wrapper });
  it('should init data state when render hook', async () => {
    const { result } = renderHook(() => useGetMetricsStepsEffect());

    expect(result.current.isLoading).toEqual(false);
  });

  it('should get the union set from steps res', async () => {
    metricsClient.getSteps = jest
      .fn()
      .mockReturnValueOnce({
        response: ['a', 'b', 'c'],
        haveStep: true,
        branches: ['branchA', 'branchB'],
        pipelineCrews: ['crewA', 'crewB'],
      })
      .mockReturnValueOnce({
        response: ['a', 'd', 'e'],
        haveStep: true,
        branches: ['branchC', 'branchD'],
        pipelineCrews: [],
      })
      .mockReturnValueOnce({
        response: [],
        haveStep: false,
        branches: [],
        pipelineCrews: [],
      });
    const { result } = renderHook(() => useGetMetricsStepsEffect());
    let res;
    await act(async () => {
      res = await result.current.getSteps(params, buildId, organizationId, pipelineType, token);
    });
    expect(res).toEqual({
      response: ['a', 'b', 'c', 'd', 'e'],
      haveStep: true,
      branches: ['branchA', 'branchB', 'branchC', 'branchD'],
      pipelineCrews: ['crewA', 'crewB'],
    });
  });

  it('should get the steps failed status when partial 4xx response from steps res', async () => {
    metricsClient.getSteps = jest
      .fn()
      .mockReturnValueOnce({
        response: ['a', 'b', 'c'],
        haveStep: true,
        branches: ['branchA', 'branchB'],
        pipelineCrews: ['crewA', 'crewB'],
      })
      .mockRejectedValue({
        code: 400,
      });
    const { result } = renderHook(() => useGetMetricsStepsEffect());
    await act(async () => {
      await result.current.getSteps(params, buildId, organizationId, pipelineType, token);
    });
    expect(result.current.stepFailedStatus).toEqual(MetricsDataFailStatus.PartialFailed4xx);
  });

  it('should get the steps failed status when partial 4xx response from steps res and code type is string', async () => {
    metricsClient.getSteps = jest
      .fn()
      .mockReturnValueOnce({
        response: ['a', 'b', 'c'],
        haveStep: true,
        branches: ['branchA', 'branchB'],
        pipelineCrews: ['crewA', 'crewB'],
      })
      .mockRejectedValue({
        code: '404',
      });
    const { result } = renderHook(() => useGetMetricsStepsEffect());
    await act(async () => {
      await result.current.getSteps(params, buildId, organizationId, pipelineType, token);
    });
    expect(result.current.stepFailedStatus).toEqual(MetricsDataFailStatus.PartialFailed4xx);
  });

  it('should get the steps failed status when partial timeout response from steps res', async () => {
    metricsClient.getSteps = jest
      .fn()
      .mockReturnValueOnce({
        response: ['a', 'b', 'c'],
        haveStep: true,
        branches: ['branchA', 'branchB'],
        pipelineCrews: ['crewA', 'crewB'],
      })
      .mockRejectedValue({
        code: 'NETWORK_TIMEOUT',
      });
    const { result } = renderHook(() => useGetMetricsStepsEffect());
    await act(async () => {
      await result.current.getSteps(params, buildId, organizationId, pipelineType, token);
    });
    expect(result.current.stepFailedStatus).toEqual(MetricsDataFailStatus.PartialFailedTimeout);
  });

  it('should get the steps failed status when partial timeout response from steps res and code is null', async () => {
    metricsClient.getSteps = jest
      .fn()
      .mockReturnValueOnce({
        response: ['a', 'b', 'c'],
        haveStep: true,
        branches: ['branchA', 'branchB'],
        pipelineCrews: ['crewA', 'crewB'],
      })
      .mockRejectedValue({
        code: null,
      });
    const { result } = renderHook(() => useGetMetricsStepsEffect());
    await act(async () => {
      await result.current.getSteps(params, buildId, organizationId, pipelineType, token);
    });
    expect(result.current.stepFailedStatus).toEqual(MetricsDataFailStatus.PartialFailedTimeout);
  });

  it('should get the steps failed status when partial timeout response from steps res and code is undefined', async () => {
    metricsClient.getSteps = jest
      .fn()
      .mockReturnValueOnce({
        response: ['a', 'b', 'c'],
        haveStep: true,
        branches: ['branchA', 'branchB'],
        pipelineCrews: ['crewA', 'crewB'],
      })
      .mockRejectedValue({
        code: undefined,
      });
    const { result } = renderHook(() => useGetMetricsStepsEffect());
    await act(async () => {
      await result.current.getSteps(params, buildId, organizationId, pipelineType, token);
    });
    expect(result.current.stepFailedStatus).toEqual(MetricsDataFailStatus.PartialFailedTimeout);
  });

  it('should set error message when get steps throw error', async () => {
    jest.useFakeTimers();
    metricsClient.getSteps = jest.fn().mockImplementation(() => {
      return Promise.reject('error');
    });
    const { result } = setup();

    expect(result.current.isLoading).toEqual(false);

    await act(async () => {
      await result.current.getSteps(params, buildId, organizationId, pipelineType, token);
    });

    expect(result.current.errorMessage).toEqual('Failed to get BuildKite steps');

    jest.runAllTimers();

    await waitFor(() => {
      expect(result.current.errorMessage).toEqual('');
    });
  });

  it('should set error message when get steps responses are failed', async () => {
    metricsClient.getSteps = jest.fn().mockImplementation(() => {
      return Promise.reject('error');
    });
    const { result } = setup();
    await act(async () => {
      await result.current.getSteps(params, buildId, organizationId, pipelineType, token);
    });

    expect(result.current.errorMessage).toEqual('Failed to get BuildKite steps');
  });

  it('should set error message when get steps responses are timeout', async () => {
    metricsClient.getSteps = jest.fn().mockImplementation(() => {
      return Promise.reject(new TimeoutError('error', AxiosRequestErrorCode.Timeout));
    });
    const { result } = setup();
    await act(async () => {
      await result.current.getSteps(params, buildId, organizationId, pipelineType, token);
    });

    expect(result.current.errorMessage).toEqual('Failed to get BuildKite steps: timeout');
  });
});
