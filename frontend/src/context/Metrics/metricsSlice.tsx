import { createSlice } from '@reduxjs/toolkit'
import camelCase from 'lodash.camelcase'
import { RootState } from '@src/store'
import { CYCLE_TIME_LIST, METRICS_CONSTANTS } from '@src/constants'

export interface IPipelineConfig {
  id: number
  organization: string
  pipelineName: string
  step: string
}

export interface savedMetricsSettingState {
  jiraColumns: { key: string; value: { name: string; statuses: string[] } }[]
  targetFields: { name: string; key: string; flag: boolean }[]
  users: string[]
  doneColumn: string[]
  cycleTimeSettings: { name: string; value: string }[]
  deploymentFrequencySettings: IPipelineConfig[]
  leadTimeForChanges: IPipelineConfig[]
  treatFlagCardAsBlock: boolean
  importedData: {
    importedCrews: string[]
    importedCycleTime: {
      importedCycleTimeSettings: { [key: string]: string }[]
      importedTreatFlagCardAsBlock: boolean
    }
    importedDoneStatus: string[]
    importedClassification: string[]
    importedDeployment: IPipelineConfig[]
    importedLeadTime: IPipelineConfig[]
  }
  warningMessage: string | null
}

const initialState: savedMetricsSettingState = {
  jiraColumns: [],
  targetFields: [],
  users: [],
  doneColumn: [],
  cycleTimeSettings: [],
  deploymentFrequencySettings: [{ id: 0, organization: '', pipelineName: '', step: '' }],
  leadTimeForChanges: [{ id: 0, organization: '', pipelineName: '', step: '' }],
  treatFlagCardAsBlock: true,
  importedData: {
    importedCrews: [],
    importedCycleTime: {
      importedCycleTimeSettings: [],
      importedTreatFlagCardAsBlock: true,
    },
    importedDoneStatus: [],
    importedClassification: [],
    importedDeployment: [],
    importedLeadTime: [],
  },
  warningMessage: null,
}

export const metricsSlice = createSlice({
  name: 'metrics',
  initialState,
  reducers: {
    saveTargetFields: (state, action) => {
      state.targetFields = action.payload
    },
    saveDoneColumn: (state, action) => {
      state.doneColumn = action.payload
    },
    saveUsers: (state, action) => {
      state.users = action.payload
    },
    saveCycleTimeSettings: (state, action) => {
      state.cycleTimeSettings = action.payload
    },
    addADeploymentFrequencySetting: (state) => {
      const newId = state.deploymentFrequencySettings[state.deploymentFrequencySettings.length - 1].id + 1
      state.deploymentFrequencySettings = [
        ...state.deploymentFrequencySettings,
        { id: newId, organization: '', pipelineName: '', step: '' },
      ]
    },

    updateDeploymentFrequencySettings: (state, action) => {
      const { updateId, label, value } = action.payload

      state.deploymentFrequencySettings = state.deploymentFrequencySettings.map((deploymentFrequencySetting) => {
        return deploymentFrequencySetting.id === updateId
          ? {
              ...deploymentFrequencySetting,
              [label === 'Steps' ? 'step' : camelCase(label)]: value,
            }
          : deploymentFrequencySetting
      })
    },

    updateMetricsImportedData: (state, action) => {
      const { crews, cycleTime, doneStatus, classification, deployment, leadTime } = action.payload
      state.importedData.importedCrews = crews
      state.importedData.importedCycleTime.importedCycleTimeSettings = cycleTime?.jiraColumns
      state.importedData.importedCycleTime.importedTreatFlagCardAsBlock = cycleTime?.treatFlagCardAsBlock
      state.importedData.importedDoneStatus = doneStatus
      state.importedData.importedClassification = classification
      state.importedData.importedDeployment = deployment
      state.importedData.importedLeadTime = leadTime
    },

    updateMetricsState: (state, action) => {
      const { targetFields, users, jiraColumns, isProjectCreated } = action.payload
      const { importedCrews, importedClassification, importedCycleTime } = state.importedData
      state.users = isProjectCreated ? users : users?.filter((item: string) => importedCrews?.includes(item))
      state.targetFields = isProjectCreated
        ? targetFields
        : targetFields?.map((item: { name: string; key: string; flag: boolean }) => ({
            ...item,
            flag: importedClassification?.includes(item.key),
          }))

      const importedCycleTimeSettingsKeys = importedCycleTime.importedCycleTimeSettings?.flatMap((obj) =>
        Object.keys(obj)
      )
      const importedCycleTimeSettingsValues = importedCycleTime.importedCycleTimeSettings?.flatMap((obj) =>
        Object.values(obj)
      )

      const jiraColumnsNames = jiraColumns?.map(
        (obj: { key: string; value: { name: string; statuses: string[] } }) => obj.value.name
      )

      const metricsContainsValues = Object.values(METRICS_CONSTANTS)

      const findDifferentValue = (array1: string[], array2: string[]): string | null => {
        const differentValue =
          array1.find((value) => !array2.includes(value)) || array2.find((value) => !array1.includes(value))
        return differentValue !== undefined ? differentValue : null
      }

      const importedKeyMismatchWarning = findDifferentValue(importedCycleTimeSettingsKeys, jiraColumnsNames)
      const importedValueMismatchWarning = findDifferentValue(importedCycleTimeSettingsValues, metricsContainsValues)

      const checkValueInArrays = (value: string | null, arrayA: string[], arrayB: string[]): string | null => {
        if (value) {
          if (arrayA.includes(value)) {
            return `The column of ${importedKeyMismatchWarning} is a deleted column, which means this column existed the time you saved config, but was deleted. Please confirm!`
          } else if (arrayB.includes(value)) {
            return `The column of ${importedKeyMismatchWarning} is a new column. Please select a value for it!`
          } else {
            return null
          }
        } else {
          return null
        }
      }
      state.warningMessage =
        importedKeyMismatchWarning &&
        checkValueInArrays(importedKeyMismatchWarning, importedCycleTimeSettingsKeys, jiraColumnsNames)

      const findKeyByValue = (objArray: { [key: string]: string }[], value: string): string | null => {
        const foundObj = objArray.find((obj) => Object.values(obj)[0] === value)
        if (foundObj) {
          return `The value of ${
            Object.keys(foundObj)[0]
          } in imported json is not in dropdown list now. Please select a value for it!`
        } else {
          return null
        }
      }

      if (!state.warningMessage) {
        state.warningMessage =
          importedValueMismatchWarning &&
          findKeyByValue(importedCycleTime.importedCycleTimeSettings, importedValueMismatchWarning)
      }

      state.cycleTimeSettings = jiraColumns?.map(
        (item: { key: string; value: { name: string; statuses: string[] } }) => {
          const controlName = item.value.name
          let defaultOptionValue = METRICS_CONSTANTS.cycleTimeEmptyStr
          const validImportValue = importedCycleTime.importedCycleTimeSettings?.find(
            (i) => Object.keys(i)[0] === controlName
          )
          if (validImportValue && CYCLE_TIME_LIST.includes(Object.values(validImportValue)[0])) {
            defaultOptionValue = Object.values(validImportValue)[0]
          }
          return { name: controlName, value: defaultOptionValue }
        }
      )
    },
    updateWarningMessage: (state, action) => {
      state.warningMessage = action.payload
    },

    deleteADeploymentFrequencySetting: (state, action) => {
      const deleteId = action.payload
      state.deploymentFrequencySettings = [...state.deploymentFrequencySettings.filter(({ id }) => id !== deleteId)]
    },

    initDeploymentFrequencySettings: (state) => {
      state.deploymentFrequencySettings = initialState.deploymentFrequencySettings
    },

    addALeadTimeForChanges: (state) => {
      const newId = state.leadTimeForChanges[state.leadTimeForChanges.length - 1].id + 1
      state.leadTimeForChanges = [
        ...state.leadTimeForChanges,
        { id: newId, organization: '', pipelineName: '', step: '' },
      ]
    },

    updateLeadTimeForChanges: (state, action) => {
      const { updateId, label, value } = action.payload

      state.leadTimeForChanges = state.leadTimeForChanges.map((leadTimeForChange) => {
        return leadTimeForChange.id === updateId
          ? {
              ...leadTimeForChange,
              [label === 'Steps' ? 'step' : camelCase(label)]: value,
            }
          : leadTimeForChange
      })
    },

    deleteALeadTimeForChange: (state, action) => {
      const deleteId = action.payload
      state.leadTimeForChanges = [...state.leadTimeForChanges.filter(({ id }) => id !== deleteId)]
    },

    initLeadTimeForChanges: (state) => {
      state.leadTimeForChanges = initialState.leadTimeForChanges
    },

    updateTreatFlagCardAsBlock: (state, action) => {
      state.treatFlagCardAsBlock = action.payload
    },
  },
})

export const {
  saveTargetFields,
  saveDoneColumn,
  saveUsers,
  saveCycleTimeSettings,
  addADeploymentFrequencySetting,
  updateDeploymentFrequencySettings,
  deleteADeploymentFrequencySetting,
  updateMetricsImportedData,
  addALeadTimeForChanges,
  updateLeadTimeForChanges,
  deleteALeadTimeForChange,
  initDeploymentFrequencySettings,
  initLeadTimeForChanges,
  updateTreatFlagCardAsBlock,
  updateMetricsState,
} = metricsSlice.actions

export const selectDeploymentFrequencySettings = (state: RootState) => state.metrics.deploymentFrequencySettings
export const selectLeadTimeForChanges = (state: RootState) => state.metrics.leadTimeForChanges

export const selectCycleTimeSettings = (state: RootState) => state.metrics.cycleTimeSettings
export const selectMetricsContent = (state: RootState) => state.metrics
export const selectTreatFlagCardAsBlock = (state: RootState) => state.metrics.treatFlagCardAsBlock
export const selectWarningMessage = (state: RootState) => state.config.warningMessage

export default metricsSlice.reducer
