import { createSlice } from '@reduxjs/toolkit'
import camelCase from 'lodash.camelcase'
import { RootState } from '@src/store'
import {
  CLASSIFICATION_WARNING_MESSAGE,
  CYCLE_TIME_LIST,
  METRICS_CONSTANTS,
  ORGANIZATION_WARNING_MESSAGE,
  PIPELINE_NAME_WARNING_MESSAGE,
  PIPELINE_SETTING_TYPES,
  REAL_DONE_WARNING_MESSAGE,
  STEP_WARNING_MESSAGE,
} from '@src/constants'
import { pipeline } from '@src/context/config/pipelineTool/verifyResponseSlice'
import _ from 'lodash'

export interface IPipelineConfig {
  id: number
  organization: string
  pipelineName: string
  step: string
  branches: string[]
}

export interface IPipelineWarningMessageConfig {
  id: number | null
  organization: string | null
  pipelineName: string | null
  step: string | null
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
  cycleTimeWarningMessage: string | null
  classificationWarningMessage: string | null
  realDoneWarningMessage: string | null
  deploymentWarningMessage: IPipelineWarningMessageConfig[]
  leadTimeWarningMessage: IPipelineWarningMessageConfig[]
}

const initialState: savedMetricsSettingState = {
  jiraColumns: [],
  targetFields: [],
  users: [],
  doneColumn: [],
  cycleTimeSettings: [],
  deploymentFrequencySettings: [{ id: 0, organization: '', pipelineName: '', step: '', branches: [] }],
  leadTimeForChanges: [{ id: 0, organization: '', pipelineName: '', step: '', branches: [] }],
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
  cycleTimeWarningMessage: null,
  classificationWarningMessage: null,
  realDoneWarningMessage: null,
  deploymentWarningMessage: [],
  leadTimeWarningMessage: [],
}

const compareArrays = (arrayA: string[], arrayB: string[]): string | null => {
  if (arrayA?.length > arrayB?.length) {
    const differentValues = arrayA?.filter((value) => !arrayB.includes(value))
    return `The column of ${differentValues} is a deleted column, which means this column existed the time you saved config, but was deleted. Please confirm!`
  } else {
    const differentValues = arrayB?.filter((value) => !arrayA.includes(value))
    return differentValues?.length > 0
      ? `The column of ${differentValues} is a new column. Please select a value for it!`
      : null
  }
}
const findDifferentValues = (arrayA: string[], arrayB: string[]): string[] | null => {
  const diffInArrayA = arrayA?.filter((value) => !arrayB.includes(value))
  if (diffInArrayA?.length === 0) {
    return null
  } else {
    return diffInArrayA
  }
}
const findKeyByValues = (arrayA: { [key: string]: string }[], arrayB: string[]): string | null => {
  const matchingKeys: string[] = []

  for (const setting of arrayA) {
    const key = Object.keys(setting)[0]
    const value = setting[key]
    if (arrayB.includes(value)) {
      matchingKeys.push(key)
    }
  }
  return `The value of ${matchingKeys} in imported json is not in dropdown list now. Please select a value for it!`
}

const setSelectUsers = (users: string[], importedCrews: string[]) =>
  users.filter((item: string) => importedCrews?.includes(item))

const setSelectTargetFields = (
  targetFields: { name: string; key: string; flag: boolean }[],
  importedClassification: string[]
) =>
  targetFields.map((item: { name: string; key: string; flag: boolean }) => ({
    ...item,
    flag: importedClassification?.includes(item.key),
  }))

const setCycleTimeSettings = (
  jiraColumns: { key: string; value: { name: string; statuses: string[] } }[],
  importedCycleTimeSettings: { [key: string]: string }[]
) => {
  return jiraColumns?.map((item: { key: string; value: { name: string; statuses: string[] } }) => {
    const controlName = item.value.name
    let defaultOptionValue = METRICS_CONSTANTS.cycleTimeEmptyStr
    const validImportValue = importedCycleTimeSettings?.find((i) => Object.keys(i)[0] === controlName)
    if (validImportValue && CYCLE_TIME_LIST.includes(Object.values(validImportValue)[0])) {
      defaultOptionValue = Object.values(validImportValue)[0]
    }
    return { name: controlName, value: defaultOptionValue }
  })
}

const setSelectDoneColumns = (
  jiraColumns: { key: string; value: { name: string; statuses: string[] } }[],
  cycleTimeSettings: { name: string; value: string }[],
  importedDoneStatus: string[]
) => {
  const doneStatus =
    jiraColumns?.find((item) => item.key === METRICS_CONSTANTS.doneKeyFromBackend)?.value.statuses ?? []
  const selectedDoneColumns = cycleTimeSettings
    ?.filter(({ value }) => value === METRICS_CONSTANTS.doneValue)
    .map(({ name }) => name)
  const filteredStatus = jiraColumns
    ?.filter(({ value }) => selectedDoneColumns.includes(value.name))
    .flatMap(({ value }) => value.statuses)
  const status = selectedDoneColumns?.length < 1 ? doneStatus : filteredStatus
  return status.filter((item: string) => importedDoneStatus?.includes(item))
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
      const newId =
        state.deploymentFrequencySettings.length >= 1
          ? state.deploymentFrequencySettings[state.deploymentFrequencySettings.length - 1].id + 1
          : 0
      state.deploymentFrequencySettings = [
        ...state.deploymentFrequencySettings,
        { id: newId, organization: '', pipelineName: '', step: '', branches: [] },
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
      state.importedData.importedCrews = crews || state.importedData.importedCrews
      state.importedData.importedCycleTime.importedCycleTimeSettings =
        cycleTime?.jiraColumns || state.importedData.importedCycleTime.importedCycleTimeSettings
      state.importedData.importedCycleTime.importedTreatFlagCardAsBlock =
        cycleTime?.treatFlagCardAsBlock || state.importedData.importedCycleTime.importedTreatFlagCardAsBlock
      state.importedData.importedDoneStatus = doneStatus || state.importedData.importedDoneStatus
      state.importedData.importedClassification = classification || state.importedData.importedClassification
      state.importedData.importedDeployment = deployment || state.importedData.importedDeployment
      state.importedData.importedLeadTime = leadTime || state.importedData.importedLeadTime
    },

    updateMetricsState: (state, action) => {
      const { targetFields, users, jiraColumns, isProjectCreated } = action.payload
      const { importedCrews, importedClassification, importedCycleTime, importedDoneStatus } = state.importedData
      state.users = isProjectCreated ? users : setSelectUsers(users, importedCrews)
      state.targetFields = isProjectCreated ? targetFields : setSelectTargetFields(targetFields, importedClassification)

      if (!isProjectCreated && importedCycleTime?.importedCycleTimeSettings?.length > 0) {
        const importedCycleTimeSettingsKeys = importedCycleTime.importedCycleTimeSettings.flatMap((obj) =>
          Object.keys(obj)
        )
        const importedCycleTimeSettingsValues = importedCycleTime.importedCycleTimeSettings.flatMap((obj) =>
          Object.values(obj)
        )
        const jiraColumnsNames = jiraColumns?.map(
          (obj: { key: string; value: { name: string; statuses: string[] } }) => obj.value.name
        )
        const metricsContainsValues = Object.values(METRICS_CONSTANTS)
        const importedKeyMismatchWarning = compareArrays(importedCycleTimeSettingsKeys, jiraColumnsNames)
        const importedValueMismatchWarning = findDifferentValues(importedCycleTimeSettingsValues, metricsContainsValues)

        const getWarningMessage = (): string | null => {
          if (importedKeyMismatchWarning?.length) {
            return compareArrays(importedCycleTimeSettingsKeys, jiraColumnsNames)
          }
          if (importedValueMismatchWarning?.length) {
            return findKeyByValues(importedCycleTime.importedCycleTimeSettings, importedValueMismatchWarning)
          }
          return null
        }
        state.cycleTimeWarningMessage = getWarningMessage()
      } else {
        state.cycleTimeWarningMessage = null
      }
      if (!isProjectCreated && importedClassification?.length > 0) {
        const keyArray = targetFields?.map((field: { key: string; name: string; flag: boolean }) => field.key)
        if (importedClassification.every((item) => keyArray.includes(item))) {
          state.classificationWarningMessage = null
        } else {
          state.classificationWarningMessage = CLASSIFICATION_WARNING_MESSAGE
        }
      } else {
        state.classificationWarningMessage = null
      }

      state.cycleTimeSettings = setCycleTimeSettings(jiraColumns, importedCycleTime.importedCycleTimeSettings)
      if (!isProjectCreated && !!importedDoneStatus.length) {
        setSelectDoneColumns(jiraColumns, state.cycleTimeSettings, importedDoneStatus).length <
        importedDoneStatus.length
          ? (state.realDoneWarningMessage = REAL_DONE_WARNING_MESSAGE)
          : (state.realDoneWarningMessage = null)
      }
      state.doneColumn = isProjectCreated
        ? []
        : setSelectDoneColumns(jiraColumns, state.cycleTimeSettings, importedDoneStatus)
    },

    updatePipelineSettings: (state, action) => {
      const { pipelineList, isProjectCreated } = action.payload
      const { importedDeployment, importedLeadTime } = state.importedData
      const orgNames: Array<string> = _.uniq(pipelineList.map((item: pipeline) => item.orgName))
      const filteredPipelineNames = (organization: string) =>
        pipelineList
          .filter((pipeline: pipeline) => pipeline.orgName.toLowerCase() === organization.toLowerCase())
          .map((item: pipeline) => item.name)
      const getValidPipelines = (pipelines: IPipelineConfig[]) =>
        !pipelines.length || isProjectCreated
          ? [{ id: 0, organization: '', pipelineName: '', step: '', branches: [] }]
          : pipelines.map(({ id, organization, pipelineName }) => ({
              id,
              organization: orgNames.find((i) => (i as string).toLowerCase() === organization.toLowerCase()) || '',
              pipelineName: filteredPipelineNames(organization).includes(pipelineName) ? pipelineName : '',
              step: '',
              branches: [],
            }))

      const createPipelineWarning = ({ id, organization, pipelineName }: IPipelineConfig) => {
        const orgWarning = orgNames.some((i) => (i as string).toLowerCase() === organization.toLowerCase())
          ? null
          : ORGANIZATION_WARNING_MESSAGE
        const pipelineNameWarning =
          orgWarning || filteredPipelineNames(organization).includes(pipelineName)
            ? null
            : PIPELINE_NAME_WARNING_MESSAGE

        return {
          id,
          organization: orgWarning,
          pipelineName: pipelineNameWarning,
          step: null,
        }
      }

      const getPipelinesWarningMessage = (pipelines: IPipelineConfig[]) => {
        if (!pipelines.length || isProjectCreated) {
          return []
        }
        return pipelines.map((pipeline) => createPipelineWarning(pipeline))
      }

      state.deploymentFrequencySettings = getValidPipelines(importedDeployment)
      state.leadTimeForChanges = getValidPipelines(importedLeadTime)
      state.deploymentWarningMessage = getPipelinesWarningMessage(importedDeployment)
      state.leadTimeWarningMessage = getPipelinesWarningMessage(importedLeadTime)
    },

    updatePipelineStep: (state, action) => {
      const { steps, id, type, branches } = action.payload
      const { importedDeployment, importedLeadTime } = state.importedData
      const updatedImportedPipeline =
        type === PIPELINE_SETTING_TYPES.DEPLOYMENT_FREQUENCY_SETTINGS_TYPE ? importedDeployment : importedLeadTime
      const updatedImportedPipelineStep = updatedImportedPipeline.find((pipeline) => pipeline.id === id)?.step ?? ''
      const updatedImportedPipelineBranches =
        updatedImportedPipeline.find((pipeline) => pipeline.id === id)?.branches ?? []
      const validStep = steps.includes(updatedImportedPipelineStep) ? updatedImportedPipelineStep : ''
      const validBranches = _.filter(branches, (branch) => updatedImportedPipelineBranches.includes(branch))
      const stepWarningMessage = steps.includes(updatedImportedPipelineStep) ? null : STEP_WARNING_MESSAGE

      const getPipelineSettings = (pipelines: IPipelineConfig[]) =>
        pipelines.map((pipeline) =>
          pipeline.id === id
            ? {
                ...pipeline,
                step: validStep,
                branches: validBranches,
              }
            : pipeline
        )

      const getStepWarningMessage = (pipelines: IPipelineWarningMessageConfig[]) => {
        return pipelines.map((pipeline) =>
          pipeline?.id === id
            ? {
                ...pipeline,
                step: stepWarningMessage,
              }
            : pipeline
        )
      }

      type === PIPELINE_SETTING_TYPES.DEPLOYMENT_FREQUENCY_SETTINGS_TYPE
        ? (state.deploymentFrequencySettings = getPipelineSettings(state.deploymentFrequencySettings))
        : (state.leadTimeForChanges = getPipelineSettings(state.leadTimeForChanges))

      type === PIPELINE_SETTING_TYPES.DEPLOYMENT_FREQUENCY_SETTINGS_TYPE
        ? (state.deploymentWarningMessage = getStepWarningMessage(state.deploymentWarningMessage))
        : (state.leadTimeWarningMessage = getStepWarningMessage(state.leadTimeWarningMessage))
    },

    deleteADeploymentFrequencySetting: (state, action) => {
      const deleteId = action.payload
      state.deploymentFrequencySettings = [...state.deploymentFrequencySettings.filter(({ id }) => id !== deleteId)]
    },

    initDeploymentFrequencySettings: (state) => {
      state.deploymentFrequencySettings = initialState.deploymentFrequencySettings
    },

    addALeadTimeForChanges: (state) => {
      const newId =
        state.leadTimeForChanges.length >= 1 ? state.leadTimeForChanges[state.leadTimeForChanges.length - 1].id + 1 : 0
      state.leadTimeForChanges = [
        ...state.leadTimeForChanges,
        { id: newId, organization: '', pipelineName: '', step: '', branches: [] },
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
  updatePipelineSettings,
  updatePipelineStep,
} = metricsSlice.actions

export const selectDeploymentFrequencySettings = (state: RootState) => state.metrics.deploymentFrequencySettings
export const selectLeadTimeForChanges = (state: RootState) => state.metrics.leadTimeForChanges

export const selectCycleTimeSettings = (state: RootState) => state.metrics.cycleTimeSettings
export const selectMetricsContent = (state: RootState) => state.metrics
export const selectTreatFlagCardAsBlock = (state: RootState) => state.metrics.treatFlagCardAsBlock
export const selectCycleTimeWarningMessage = (state: RootState) => state.metrics.cycleTimeWarningMessage
export const selectClassificationWarningMessage = (state: RootState) => state.metrics.classificationWarningMessage
export const selectRealDoneWarningMessage = (state: RootState) => state.metrics.realDoneWarningMessage

export const selectOrganizationWarningMessage = (state: RootState, id: number, type: string) => {
  const { deploymentWarningMessage, leadTimeWarningMessage } = state.metrics
  const warningMessage =
    type === PIPELINE_SETTING_TYPES.DEPLOYMENT_FREQUENCY_SETTINGS_TYPE
      ? deploymentWarningMessage
      : leadTimeWarningMessage
  return warningMessage.find((item) => item.id === id)?.organization
}

export const selectPipelineNameWarningMessage = (state: RootState, id: number, type: string) => {
  const { deploymentWarningMessage, leadTimeWarningMessage } = state.metrics
  const warningMessage =
    type === PIPELINE_SETTING_TYPES.DEPLOYMENT_FREQUENCY_SETTINGS_TYPE
      ? deploymentWarningMessage
      : leadTimeWarningMessage
  return warningMessage.find((item) => item.id === id)?.pipelineName
}

export const selectStepWarningMessage = (state: RootState, id: number, type: string) => {
  const { deploymentWarningMessage, leadTimeWarningMessage } = state.metrics
  const warningMessage =
    type === PIPELINE_SETTING_TYPES.DEPLOYMENT_FREQUENCY_SETTINGS_TYPE
      ? deploymentWarningMessage
      : leadTimeWarningMessage
  return warningMessage.find((item) => item.id === id)?.step
}

export default metricsSlice.reducer
