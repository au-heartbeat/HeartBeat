import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@src/store'
import { ZERO } from '@src/constants'

export interface StepState {
  stepNumber: number
  timeStamp: number
}

const initialState: StepState = {
  stepNumber: 0,
  timeStamp: 0,
}

export const stepperSlice = createSlice({
  name: 'stepper',
  initialState,
  reducers: {
    nextStep: (state) => {
      state.stepNumber += 1
    },
    backStep: (state) => {
      state.stepNumber = state.stepNumber === ZERO ? ZERO : state.stepNumber - 1
    },
    updateTimeStamp: (state, action) => {
      state.timeStamp = action.payload
    },
  },
})

export const { nextStep, backStep, updateTimeStamp } = stepperSlice.actions

export const selectStepNumber = (state: RootState) => state.stepper.stepNumber
export const selectTimeStamp = (state: RootState) => state.stepper.timeStamp

export default stepperSlice.reducer
