import React from 'react'
import { SingleSelection } from '@src/components/Metrics/MetricsStep/DeploymentFrequencySettings/SingleSelection'
import { useAppDispatch } from '@src/hooks'
import { ButtonWrapper, PipelineMetricSelectionWrapper, RemoveButton, WarningMessage } from './style'
import { Loading } from '@src/components/Loading'
import { useGetMetricsStepsEffect } from '@src/hooks/useGetMetricsStepsEffect'
import { ErrorNotification } from '@src/components/ErrorNotification'
import {
  selectPipelineNames,
  selectPipelineOrganizations,
  selectSteps,
  selectStepsParams,
  updatePipelineToolVerifyResponseSteps,
} from '@src/context/config/configSlice'
import { store } from '@src/store'
import {
  selectOrganizationWarningMessage,
  selectPipelineNameWarningMessage,
  updatePipelineStep,
} from '@src/context/Metrics/metricsSlice'
import { ErrorNotificationAutoDismiss } from '@src/components/Common/ErrorNotificationAutoDismiss'

interface pipelineMetricSelectionProps {
  type: string
  pipelineSetting: {
    id: number
    organization: string
    pipelineName: string
    step: string
  }
  isShowRemoveButton: boolean
  onRemovePipeline: (id: number) => void
  onUpdatePipeline: (id: number, label: string, value: string) => void
  duplicatedIds: number[]
}

export const PipelineMetricSelection = ({
  type,
  pipelineSetting,
  isShowRemoveButton,
  onRemovePipeline,
  onUpdatePipeline,
  duplicatedIds,
}: pipelineMetricSelectionProps) => {
  const { id, organization, pipelineName, step } = pipelineSetting
  const dispatch = useAppDispatch()
  const { isLoading, errorMessage, getSteps } = useGetMetricsStepsEffect()
  const organizationNameOptions = selectPipelineOrganizations(store.getState())
  const pipelineNameOptions = selectPipelineNames(store.getState(), organization)
  const stepsOptions = selectSteps(store.getState(), organization, pipelineName)
  const organizationWarningMessage = selectOrganizationWarningMessage(store.getState(), id, type)
  const pipelineNameWarningMessage = selectPipelineNameWarningMessage(store.getState(), id, type)

  const handleClick = () => {
    onRemovePipeline(id)
  }

  const handleGetSteps = (_pipelineName: string) => {
    const { params, buildId, organizationId, pipelineType, token } = selectStepsParams(
      store.getState(),
      organization,
      _pipelineName
    )
    getSteps(params, organizationId, buildId, pipelineType, token).then((res) => {
      const steps = res ? Object.values(res) : []
      dispatch(updatePipelineToolVerifyResponseSteps({ organization, pipelineName: _pipelineName, steps }))
      dispatch(updatePipelineStep({ steps, id, type }))
    })
  }

  return (
    <PipelineMetricSelectionWrapper>
      {organizationWarningMessage && <ErrorNotificationAutoDismiss message={organizationWarningMessage} />}
      {pipelineNameWarningMessage && <ErrorNotificationAutoDismiss message={pipelineNameWarningMessage} />}
      {isLoading && <Loading />}
      {duplicatedIds.includes(id) && <WarningMessage> This pipeline is the same as another one!</WarningMessage>}
      {errorMessage && <ErrorNotification message={errorMessage} />}
      <SingleSelection
        id={id}
        options={organizationNameOptions}
        label={'Organization'}
        value={organization}
        onUpDatePipeline={(id, label, value) => onUpdatePipeline(id, label, value)}
      />
      {organization && (
        <SingleSelection
          id={id}
          options={pipelineNameOptions}
          label={'Pipeline Name'}
          value={pipelineName}
          step={step}
          onGetSteps={handleGetSteps}
          onUpDatePipeline={(id, label, value) => onUpdatePipeline(id, label, value)}
        />
      )}
      {organization && pipelineName && (
        <SingleSelection
          id={id}
          options={stepsOptions}
          label={'Step'}
          value={step}
          onUpDatePipeline={(id, label, value) => onUpdatePipeline(id, label, value)}
        />
      )}
      <ButtonWrapper>
        {isShowRemoveButton && (
          <RemoveButton data-test-id={'remove-button'} onClick={handleClick}>
            Remove
          </RemoveButton>
        )}
      </ButtonWrapper>
    </PipelineMetricSelectionWrapper>
  )
}
