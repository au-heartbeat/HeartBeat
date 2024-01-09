import { configureStore } from '@reduxjs/toolkit'
import stepperReducer from './context/stepper/StepperSlice'
import configReducer from './context/config/configSlice'
import metricsSlice from './context/Metrics/metricsSlice'
import headerSlice from '@src/context/header/headerSlice'
import reportSlice from '@src/context/report/reportSlice'

export const store = configureStore({
  reducer: {
    stepper: stepperReducer,
    config: configReducer,
    metrics: metricsSlice,
    header: headerSlice,
    report: reportSlice,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
