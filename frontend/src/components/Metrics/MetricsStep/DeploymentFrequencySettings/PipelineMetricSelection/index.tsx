import React, { useState } from 'react'
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
  selectStepWarningMessage,
  updatePipelineStep,
} from '@src/context/Metrics/metricsSlice'
import { WarningNotification } from '@src/components/Common/WarningNotification'
import { NO_STEP_WARNING_MESSAGE } from '@src/constants'
import { useNavigate } from 'react-router-dom'

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
  isDuplicated: boolean
}

export const PipelineMetricSelection = ({
  type,
  pipelineSetting,
  isShowRemoveButton,
  onRemovePipeline,
  onUpdatePipeline,
  isDuplicated,
}: pipelineMetricSelectionProps) => {
  const { id, organization, pipelineName, step } = pipelineSetting
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isLoading, isServerError, errorMessage, getSteps } = useGetMetricsStepsEffect()
  const organizationNameOptions = selectPipelineOrganizations(store.getState())
  const pipelineNameOptions = selectPipelineNames(store.getState(), organization)
  const stepsOptions = selectSteps(store.getState(), organization, pipelineName)
  const organizationWarningMessage = selectOrganizationWarningMessage(store.getState(), id, type)
  const pipelineNameWarningMessage = selectPipelineNameWarningMessage(store.getState(), id, type)
  const stepWarningMessage = selectStepWarningMessage(store.getState(), id, type)
  const [isShowNoStepWarning, setIsShowNoStepWarning] = useState(false)

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
      const steps = res?.response ?? []
      dispatch(updatePipelineToolVerifyResponseSteps({ organization, pipelineName: _pipelineName, steps }))
      res?.haveStep && dispatch(updatePipelineStep({ steps, id, type }))
      res && setIsShowNoStepWarning(!res.haveStep)
    })
  }

  return (
    <>
      {isServerError ? (
        navigate('/error-page')
      ) : (
        <PipelineMetricSelectionWrapper>
          {organizationWarningMessage && <WarningNotification message={organizationWarningMessage} />}
          {pipelineNameWarningMessage && <WarningNotification message={pipelineNameWarningMessage} />}
          {stepWarningMessage && <WarningNotification message={stepWarningMessage} />}
          {isShowNoStepWarning && <WarningNotification message={NO_STEP_WARNING_MESSAGE} />}
          {isLoading && <Loading />}
          {isDuplicated && <WarningMessage>This pipeline is the same as another one!</WarningMessage>}
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
      )}
    </>
  )
}
