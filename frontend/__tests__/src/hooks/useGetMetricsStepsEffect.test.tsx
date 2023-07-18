import { act, renderHook } from '@testing-library/react'
import { ERROR_MESSAGE_TIME_DURATION } from '@src/constants'
import { useGetMetricsStepsEffect } from '@src/hooks/useGetMetricsStepsEffect'
import { metricsClient } from '@src/clients/MetricsClient'
import { MOCK_GET_STEPS_PARAMS } from '../fixtures'
import { NotFoundException } from '@src/exceptions/NotFoundException'

describe('use get steps effect', () => {
  const { params, buildId, organizationId, pipelineType, token } = MOCK_GET_STEPS_PARAMS
  it('should init data state when render hook', async () => {
    const { result } = renderHook(() => useGetMetricsStepsEffect())

    expect(result.current.isLoading).toEqual(false)
  })

  it('should set error message when get steps throw error', async () => {
    jest.useFakeTimers()
    metricsClient.getSteps = jest.fn().mockImplementation(() => {
      throw new Error('error')
    })
    const { result } = renderHook(() => useGetMetricsStepsEffect())

    expect(result.current.isLoading).toEqual(false)

    act(() => {
      result.current.getSteps(params, buildId, organizationId, pipelineType, token)
      jest.advanceTimersByTime(ERROR_MESSAGE_TIME_DURATION)
    })

    expect(result.current.errorMessage).toEqual('')
  })

  it('should set error message when get steps response status 404', async () => {
    metricsClient.getSteps = jest.fn().mockImplementation(() => {
      throw new NotFoundException('error message')
    })
    const { result } = renderHook(() => useGetMetricsStepsEffect())

    act(() => {
      result.current.getSteps(params, buildId, organizationId, pipelineType, token)
    })

    expect(result.current.errorMessage).toEqual('BuildKite get steps failed: error message')
  })

  it('should set isError is true when error has response', async () => {
    const error = {
      response: {
        status: 500,
      },
    }

    metricsClient.getSteps = jest.fn().mockImplementation(() => {
      throw error
    })
    const { result } = renderHook(() => useGetMetricsStepsEffect())

    act(() => {
      result.current.getSteps(params, buildId, organizationId, pipelineType, token)
    })

    expect(result.current.isError).toEqual(true)
  })

  it('should set isError is true when error is empty', async () => {
    const error = {}

    metricsClient.getSteps = jest.fn().mockImplementation(() => {
      throw error
    })
    const { result } = renderHook(() => useGetMetricsStepsEffect())

    act(() => {
      result.current.getSteps(params, buildId, organizationId, pipelineType, token)
    })

    expect(result.current.isError).toEqual(true)
  })
})
