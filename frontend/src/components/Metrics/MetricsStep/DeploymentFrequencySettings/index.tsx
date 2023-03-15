import React from 'react'
import { AddButton, Divider, Title } from './style'
import { PipelineMetricSelection } from './PipelineMetricSelection'
import { useAppDispatch, useAppSelector } from '@src/hooks'
import {
  addADeploymentFrequencySetting,
  selectDeploymentFrequencySettings,
} from '@src/context/pipelineMetricsSettings/pipelineMetricsSettingsSlice'
import { v4 as uuidV4 } from 'uuid'

export const DeploymentFrequencySettings = () => {
  const dispatch = useAppDispatch()
  const deploymentFrequencySettings = useAppSelector(selectDeploymentFrequencySettings)

  const handleClick = () => {
    dispatch(addADeploymentFrequencySetting())
  }

  return (
    <>
      <Divider>
        <Title>Deployment frequency settings</Title>
      </Divider>
      {deploymentFrequencySettings.map((deploymentFrequencySetting, index) => (
        <PipelineMetricSelection
          key={uuidV4()}
          deploymentFrequencySetting={deploymentFrequencySetting}
          index={index}
          isShowRemoveButton={deploymentFrequencySettings.length > 1}
        />
      ))}
      <AddButton onClick={handleClick}> Add another pipeline</AddButton>
    </>
  )
}
