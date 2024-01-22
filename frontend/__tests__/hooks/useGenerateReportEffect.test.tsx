import {
  INTERNAL_SERVER_ERROR_MESSAGE,
  MOCK_GENERATE_REPORT_REQUEST_PARAMS,
  MOCK_REPORT_RESPONSE,
  MOCK_RETRIEVE_REPORT_RESPONSE,
} from '../fixtures';
import { InternalServerException } from '@src/exceptions/InternalServerException';
import { useGenerateReportEffect } from '@src/hooks/useGenerateReportEffect';
import { UnknownException } from '@src/exceptions/UnknownException';
import { act, renderHook, waitFor } from '@testing-library/react';
import { reportClient } from '@src/clients/report/ReportClient';
import { HttpStatusCode } from 'axios';
import { TimeoutException } from '@src/exceptions/TimeoutException';
import clearAllMocks = jest.clearAllMocks;
import resetAllMocks = jest.resetAllMocks;

jest.mock('@src/hooks/reportMapper/report', () => ({
  pipelineReportMapper: jest.fn(),
  sourceControlReportMapper: jest.fn(),
}));

describe('use generate report effect', () => {
  afterAll(() => {
    clearAllMocks();
  });
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    resetAllMocks();
    jest.useRealTimers();
  });

  it('should set error message when generate report response status 500', async () => {
    reportClient.retrieveByUrl = jest.fn().mockImplementation(async () => {
      throw new InternalServerException(INTERNAL_SERVER_ERROR_MESSAGE, HttpStatusCode.InternalServerError);
    });

    const { result } = renderHook(() => useGenerateReportEffect());

    await waitFor(() => {
      result.current.startToRequestBoardData(MOCK_GENERATE_REPORT_REQUEST_PARAMS);
      expect(result.current.isServerError).toEqual(true);
    });
  });

  it('should set isServerError is true when throw InternalServerException', async () => {
    reportClient.retrieveByUrl = jest.fn().mockImplementation(async () => {
      throw new InternalServerException('5xx error', 500);
    });

    const { result } = renderHook(() => useGenerateReportEffect());

    await waitFor(() => {
      result.current.startToRequestBoardData(MOCK_GENERATE_REPORT_REQUEST_PARAMS);
      expect(result.current.isServerError).toEqual(true);
    });
  });

  it('should set isServerError is true when throw TimeoutException', async () => {
    reportClient.retrieveByUrl = jest.fn().mockRejectedValue(new TimeoutException('5xx error', 503));

    const { result } = renderHook(() => useGenerateReportEffect());

    await waitFor(() => {
      result.current.startToRequestBoardData(MOCK_GENERATE_REPORT_REQUEST_PARAMS);
      expect(result.current.isServerError).toEqual(true);
    });
  });

  it('should set timeout4Board is "Data loading failed" when timeout', async () => {
    reportClient.retrieveByUrl = jest.fn().mockRejectedValue(new UnknownException());

    const { result } = renderHook(() => useGenerateReportEffect());

    await waitFor(() => {
      result.current.startToRequestBoardData(MOCK_GENERATE_REPORT_REQUEST_PARAMS);
      expect(result.current.timeout4Board).toEqual('Data loading failed');
    });
  });

  it('should return error message when calling startToRequestBoardData given pollingReport response return 5xx ', async () => {
    reportClient.polling = jest.fn().mockImplementation(async () => {
      throw new InternalServerException('error', HttpStatusCode.InternalServerError);
    });
    reportClient.retrieveByUrl = jest
      .fn()
      .mockImplementation(async () => ({ response: MOCK_RETRIEVE_REPORT_RESPONSE }));

    const { result } = renderHook(() => useGenerateReportEffect());

    await waitFor(() => {
      result.current.startToRequestBoardData(MOCK_GENERATE_REPORT_REQUEST_PARAMS);
      expect(reportClient.polling).toBeCalledTimes(1);
      expect(result.current.isServerError).toEqual(true);
    });
  });

  it('should call polling report and setTimeout when calling startToRequestBoardData given pollingReport response return 204 ', async () => {
    reportClient.polling = jest
      .fn()
      .mockImplementation(async () => ({ status: HttpStatusCode.NoContent, response: MOCK_REPORT_RESPONSE }));
    reportClient.retrieveByUrl = jest
      .fn()
      .mockImplementation(async () => ({ response: MOCK_RETRIEVE_REPORT_RESPONSE }));

    const { result } = renderHook(() => useGenerateReportEffect());

    await waitFor(() => {
      result.current.startToRequestBoardData(MOCK_GENERATE_REPORT_REQUEST_PARAMS);
    });

    jest.runOnlyPendingTimers();

    await waitFor(() => {
      expect(reportClient.polling).toHaveBeenCalledTimes(1);
    });
  });

  it('should call polling report more than one time when allMetricsReady field in response is false', async () => {
    reportClient.polling = jest.fn().mockImplementation(async () => ({
      status: HttpStatusCode.NoContent,
      response: { ...MOCK_REPORT_RESPONSE, allMetricsCompleted: false },
    }));
    reportClient.retrieveByUrl = jest
      .fn()
      .mockImplementation(async () => ({ response: MOCK_RETRIEVE_REPORT_RESPONSE }));

    const { result } = renderHook(() => useGenerateReportEffect());

    await waitFor(() => {
      result.current.startToRequestBoardData(MOCK_GENERATE_REPORT_REQUEST_PARAMS);
    });
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    await waitFor(() => {
      expect(reportClient.polling).toHaveBeenCalledTimes(2);
    });
  });

  it('should call polling report only once when calling startToRequestBoardData but startToRequestDoraData called before', async () => {
    reportClient.polling = jest
      .fn()
      .mockImplementation(async () => ({ status: HttpStatusCode.NoContent, response: MOCK_REPORT_RESPONSE }));
    reportClient.retrieveByUrl = jest
      .fn()
      .mockImplementation(async () => ({ response: MOCK_RETRIEVE_REPORT_RESPONSE }));

    const { result } = renderHook(() => useGenerateReportEffect());

    await waitFor(() => {
      result.current.startToRequestDoraData(MOCK_GENERATE_REPORT_REQUEST_PARAMS);
      result.current.startToRequestBoardData(MOCK_GENERATE_REPORT_REQUEST_PARAMS);
    });

    jest.runOnlyPendingTimers();

    await waitFor(() => {
      expect(reportClient.polling).toHaveBeenCalledTimes(1);
    });
  });

  it('should set error message when generate report response status 500', async () => {
    reportClient.retrieveByUrl = jest
      .fn()
      .mockRejectedValue(new InternalServerException(INTERNAL_SERVER_ERROR_MESSAGE, HttpStatusCode.NotFound));

    const { result } = renderHook(() => useGenerateReportEffect());

    await waitFor(() => {
      result.current.startToRequestDoraData(MOCK_GENERATE_REPORT_REQUEST_PARAMS);
      expect(result.current.isServerError).toEqual(true);
    });
  });

  it('should set isServerError is true when throw InternalServerException', async () => {
    reportClient.retrieveByUrl = jest.fn().mockRejectedValue(new InternalServerException('5xx error', 500));

    const { result } = renderHook(() => useGenerateReportEffect());

    await waitFor(() => {
      result.current.startToRequestDoraData(MOCK_GENERATE_REPORT_REQUEST_PARAMS);
      expect(result.current.isServerError).toEqual(true);
    });
  });

  it('should set isServerError is true when throw TimeoutException', async () => {
    reportClient.retrieveByUrl = jest.fn().mockRejectedValue(new TimeoutException('5xx error', 503));

    const { result } = renderHook(() => useGenerateReportEffect());

    await waitFor(() => {
      result.current.startToRequestDoraData(MOCK_GENERATE_REPORT_REQUEST_PARAMS);
      expect(result.current.isServerError).toEqual(true);
    });
  });

  it('should set timeout4Dora is "Data loading failed" when timeout', async () => {
    reportClient.retrieveByUrl = jest.fn().mockRejectedValue(new UnknownException());

    const { result } = renderHook(() => useGenerateReportEffect());

    await waitFor(() => {
      result.current.startToRequestDoraData(MOCK_GENERATE_REPORT_REQUEST_PARAMS);
      expect(result.current.timeout4Dora).toEqual('Data loading failed');
    });
  });

  it('should set timeout4Report is "Data loading failed" when polling timeout', async () => {
    reportClient.polling = jest.fn().mockImplementation(async () => {
      throw new UnknownException();
    });

    reportClient.retrieveByUrl = jest
      .fn()
      .mockImplementation(async () => ({ response: MOCK_RETRIEVE_REPORT_RESPONSE }));

    const { result } = renderHook(() => useGenerateReportEffect());

    await waitFor(() => {
      result.current.startToRequestDoraData(MOCK_GENERATE_REPORT_REQUEST_PARAMS);
      expect(result.current.timeout4Report).toEqual('Data loading failed');
    });
  });

  it('should return error message when calling startToRequestDoraData given pollingReport response return 5xx ', async () => {
    reportClient.polling = jest.fn().mockImplementation(async () => {
      throw new InternalServerException('error', HttpStatusCode.InternalServerError);
    });

    reportClient.retrieveByUrl = jest
      .fn()
      .mockImplementation(async () => ({ response: MOCK_RETRIEVE_REPORT_RESPONSE }));

    const { result } = renderHook(() => useGenerateReportEffect());

    await waitFor(() => {
      result.current.startToRequestDoraData(MOCK_GENERATE_REPORT_REQUEST_PARAMS);
      expect(reportClient.polling).toBeCalledTimes(1);
      expect(result.current.isServerError).toEqual(true);
    });
  });

  it('should call polling report and setTimeout when calling startToRequestDoraData given pollingReport response return 204 ', async () => {
    reportClient.polling = jest
      .fn()
      .mockImplementation(async () => ({ status: HttpStatusCode.NoContent, response: MOCK_REPORT_RESPONSE }));

    reportClient.retrieveByUrl = jest
      .fn()
      .mockImplementation(async () => ({ response: MOCK_RETRIEVE_REPORT_RESPONSE }));

    const { result } = renderHook(() => useGenerateReportEffect());

    await waitFor(() => {
      result.current.startToRequestDoraData(MOCK_GENERATE_REPORT_REQUEST_PARAMS);
    });

    jest.runOnlyPendingTimers();

    await waitFor(() => {
      expect(reportClient.polling).toHaveBeenCalledTimes(1);
    });
  });

  it('should call polling report only once when calling startToRequestDoraData but startToRequestBoardData called before', async () => {
    reportClient.polling = jest
      .fn()
      .mockImplementation(async () => ({ status: HttpStatusCode.NoContent, response: MOCK_REPORT_RESPONSE }));

    reportClient.retrieveByUrl = jest
      .fn()
      .mockImplementation(async () => ({ response: MOCK_RETRIEVE_REPORT_RESPONSE }));

    const { result } = renderHook(() => useGenerateReportEffect());

    await waitFor(() => {
      result.current.startToRequestBoardData(MOCK_GENERATE_REPORT_REQUEST_PARAMS);
      result.current.startToRequestDoraData(MOCK_GENERATE_REPORT_REQUEST_PARAMS);
    });

    jest.runOnlyPendingTimers();

    await waitFor(() => {
      expect(reportClient.polling).toHaveBeenCalledTimes(1);
    });
  });
});
