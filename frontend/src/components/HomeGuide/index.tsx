import Stack from '@mui/material/Stack'

import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@src/hooks/useAppDispatch'
import { resetImportedData, updateBasicConfigState, updateProjectCreatedState } from '@src/context/config/configSlice'
import React, { useState } from 'react'
import { updateMetricsImportedData } from '@src/context/Metrics/metricsSlice'
import { resetStep } from '@src/context/stepper/StepperSlice'
import { WarningNotification } from '@src/components/Common/WarningNotification'
import { convertToNewFileConfig, NewFileConfig, OldFileConfig } from '@src/fileConfig/fileConfig'
import { GuideButton, HomeGuideContainer, StyledStack } from '@src/components/HomeGuide/style'
import { MESSAGE } from '@src/constants/resources'
import { ROUTE } from '@src/constants/router'

export const HomeGuide = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [validConfig, setValidConfig] = useState(true)

  const getImportFileElement = () => document.getElementById('importJson') as HTMLInputElement
  const isValidImportedConfig = (config: NewFileConfig) => {
    try {
      const {
        projectName,
        metrics,
        dateRange: { startDate, endDate },
      } = config
      return projectName || startDate || endDate || metrics.length > 0
    } catch {
      return false
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.files?.[0]
    const reader = new FileReader()
    if (input) {
      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          const importedConfig: OldFileConfig | NewFileConfig = JSON.parse(reader.result)
          const config: NewFileConfig = convertToNewFileConfig(importedConfig)
          if (isValidImportedConfig(config)) {
            dispatch(updateProjectCreatedState(false))
            dispatch(updateBasicConfigState(config))
            dispatch(updateMetricsImportedData(config))
            navigate(ROUTE.METRICS_PAGE)
          } else {
            setValidConfig(false)
          }
        }
        const fileInput = getImportFileElement()
        fileInput.value = ''
      }
      reader.readAsText(input, 'utf-8')
    }
  }

  const openFileImportBox = () => {
    setValidConfig(true)
    dispatch(resetImportedData())
    dispatch(resetStep())
    const fileInput = getImportFileElement()
    fileInput.click()
  }

  const createNewProject = () => {
    dispatch(resetStep())
    dispatch(resetImportedData())
    navigate(ROUTE.METRICS_PAGE)
  }

  return (
    <HomeGuideContainer>
      {!validConfig && <WarningNotification message={MESSAGE.HOME_VERIFY_IMPORT_WARNING} />}
      <StyledStack direction='column' justifyContent='center' alignItems='center' flex={'auto'}>
        <GuideButton onClick={openFileImportBox}>Import project from file</GuideButton>
        <input hidden type='file' data-testid='testInput' id='importJson' accept='.json' onChange={handleChange} />
        <GuideButton onClick={createNewProject}>Create a new project</GuideButton>
      </StyledStack>
    </HomeGuideContainer>
  )
}
