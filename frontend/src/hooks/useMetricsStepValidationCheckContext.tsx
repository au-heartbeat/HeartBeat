import React, { createContext, useContext } from 'react'
import { useAppSelector } from '@src/hooks/index'
import { selectDeploymentFrequencySettings, selectLeadTimeForChanges } from '@src/context/Metrics/metricsSlice'
import { PIPELINE_SETTING_TYPES } from '@src/constants'

interface ProviderContextType {
  isPipelineValid: (type: string) => boolean
  getDuplicatedPipeLineIds: (
    pipelineSettings: { id: number; organization: string; pipelineName: string; step: string }[]
  ) => number[]
}

interface ContextProviderProps {
  children: React.ReactNode
}

export const ValidationContext = createContext<ProviderContextType>({
  isPipelineValid: () => false,
  getDuplicatedPipeLineIds: () => [],
})

const assignErrorMessage = (label: string, value: string, id: number, duplicatedPipeLineIds: number[]) =>
  !value ? `${label} is required` : duplicatedPipeLineIds.includes(id) ? `duplicated ${label}` : ''

const getDuplicatedPipeLineIds = (
  pipelineSettings: { id: number; organization: string; pipelineName: string; step: string }[]
) => {
  const errors: { [key: string]: number[] } = {}
  pipelineSettings.forEach(({ id, organization, pipelineName, step }) => {
    if (organization && pipelineName && step) {
      const errorString = `${organization}${pipelineName}${step}`
      if (errors[errorString]) errors[errorString].push(id)
      else errors[errorString] = [id]
    }
  })
  return Object.values(errors)
    .filter((ids) => ids.length > 1)
    .flat()
}

const getErrorMessages = (
  pipelineSettings: { id: number; organization: string; pipelineName: string; step: string }[]
) => {
  const duplicatedPipelineIds: number[] = getDuplicatedPipeLineIds(pipelineSettings)
  return pipelineSettings.map(({ id, organization, pipelineName, step }) => ({
    id,
    error: {
      organization: assignErrorMessage('organization', organization, id, duplicatedPipelineIds),
      pipelineName: assignErrorMessage('pipelineName', pipelineName, id, duplicatedPipelineIds),
      step: assignErrorMessage('step', step, id, duplicatedPipelineIds),
    },
  }))
}

export const ContextProvider = ({ children }: ContextProviderProps) => {
  const deploymentFrequencySettings = useAppSelector(selectDeploymentFrequencySettings)
  const leadTimeForChanges = useAppSelector(selectLeadTimeForChanges)

  const isPipelineValid = (type: string) => {
    const pipelines =
      type === PIPELINE_SETTING_TYPES.LEAD_TIME_FOR_CHANGES_TYPE ? leadTimeForChanges : deploymentFrequencySettings
    const errorMessages = getErrorMessages(pipelines)
    return errorMessages.every(({ error }) => Object.values(error).every((val) => !val))
  }

  return (
    <ValidationContext.Provider
      value={{
        isPipelineValid,
        getDuplicatedPipeLineIds,
      }}
    >
      {children}
    </ValidationContext.Provider>
  )
}

export const useMetricsStepValidationCheckContext = () => useContext(ValidationContext)
