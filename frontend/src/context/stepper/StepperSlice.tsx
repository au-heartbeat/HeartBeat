import { createSlice } from '@reduxjs/toolkit';
import { ZERO } from '@src/constants/commons';
import type { RootState } from '@src/store';

export interface IMetricsPageFailedDateRange {
  boardInfoError?: boolean;
  pipelineInfoError?: boolean;
  pipelineStepError?: boolean;
}

export interface IMetricsPageFailedDateRangePayload {
  startDate: string;
  errors: IMetricsPageFailedDateRange;
}

export interface StepState {
  stepNumber: number;
  timeStamp: number;
  shouldMetricsLoaded: boolean;
  metricsPageFailedTimeRangeInfos: Record<string, IMetricsPageFailedDateRange>;
}

const initialState: StepState = {
  stepNumber: 0,
  timeStamp: 0,
  shouldMetricsLoaded: true,
  metricsPageFailedTimeRangeInfos: {},
};

export const stepperSlice = createSlice({
  name: 'stepper',
  initialState,
  reducers: {
    resetStep: (state) => {
      state.stepNumber = initialState.stepNumber;
      state.timeStamp = initialState.timeStamp;
    },
    nextStep: (state) => {
      if (state.shouldMetricsLoaded && state.stepNumber === 0) {
        state.metricsPageFailedTimeRangeInfos = {};
      }
      state.shouldMetricsLoaded = true;
      state.stepNumber += 1;
    },
    backStep: (state) => {
      state.shouldMetricsLoaded = false;
      state.stepNumber = state.stepNumber === ZERO ? ZERO : state.stepNumber - 1;
    },
    updateShouldMetricsLoaded: (state, action) => {
      state.shouldMetricsLoaded = action.payload;
    },
    updateTimeStamp: (state, action) => {
      state.timeStamp = action.payload;
    },
    updateMetricsPageFailedTimeRangeInfos: (state, action) => {
      let errorInfoList: IMetricsPageFailedDateRangePayload[] | IMetricsPageFailedDateRangePayload = action.payload;

      if (!(errorInfoList instanceof Array)) {
        errorInfoList = [action.payload];
      }

      errorInfoList.forEach((singleTimeRangeInfo) => updateInfo(singleTimeRangeInfo));

      function updateInfo(errorInfo: IMetricsPageFailedDateRangePayload) {
        const { startDate, errors } = errorInfo;
        state.metricsPageFailedTimeRangeInfos[startDate] = {
          ...state.metricsPageFailedTimeRangeInfos[startDate],
          ...errors,
        };
      }
    },
  },
});

export const {
  resetStep,
  nextStep,
  backStep,
  updateShouldMetricsLoaded,
  updateTimeStamp,
  updateMetricsPageFailedTimeRangeInfos,
} = stepperSlice.actions;

export const selectStepNumber = (state: RootState) => state.stepper.stepNumber;
export const selectTimeStamp = (state: RootState) => state.stepper.timeStamp;
export const shouldMetricsLoaded = (state: RootState) => state.stepper.shouldMetricsLoaded;
export const selectMetricsPageFailedTimeRangeInfos = (state: RootState) =>
  state.stepper.metricsPageFailedTimeRangeInfos;

export default stepperSlice.reducer;
