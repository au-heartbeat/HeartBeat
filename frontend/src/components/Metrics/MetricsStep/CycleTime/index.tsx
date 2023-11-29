import React, { useEffect, useState } from 'react'
import { MetricsSettingTitle } from '@src/components/Common/MetricsSettingTitle'
import FlagCard from '@src/components/Metrics/MetricsStep/CycleTime/FlagCard'
import { FormSelectPart } from '@src/components/Metrics/MetricsStep/CycleTime/FormSelectPart'
import { useAppDispatch } from '@src/hooks/useAppDispatch'
import {
  saveCycleTimeSettings,
  saveDoneColumn,
  selectCycleTimeWarningMessage,
  selectMetricsContent,
} from '@src/context/Metrics/metricsSlice'
import { useAppSelector } from '@src/hooks'
import { WarningNotification } from '@src/components/Common/WarningNotification'
import { DONE } from '@src/constants'
import {
  CycleTimeContainer,
  TitleAndTooltipContainer,
  TooltipContainer,
} from '@src/components/Metrics/MetricsStep/CycleTime/style'
import { IconButton, Tooltip } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

interface cycleTimeProps {
  title: string
}

export const CycleTime = ({ title }: cycleTimeProps) => {
  const dispatch = useAppDispatch()
  const { cycleTimeSettings } = useAppSelector(selectMetricsContent)
  const warningMessage = useAppSelector(selectCycleTimeWarningMessage)
  const [cycleTimeOptions, setCycleTimeOptions] = useState(cycleTimeSettings)
  const [saveDone, setSaveDone] = useState<string[]>([])

  const saveCycleTimeOptions = (name: string, value: string) => {
    setCycleTimeOptions(
      cycleTimeOptions.map((item) =>
        item.name === name
          ? {
              ...item,
              value,
            }
          : item
      )
    )

    if (value === DONE) {
      setSaveDone([...saveDone, name])
      dispatch(saveDoneColumn([]))
    } else if (saveDone.includes(name)) {
      setSaveDone(saveDone.filter((e) => e !== name))
      dispatch(saveDoneColumn([]))
    }
  }

  useEffect(() => {
    dispatch(saveCycleTimeSettings(cycleTimeOptions))
    cycleTimeOptions.forEach((item) => {
      if (item.value === DONE) {
        setSaveDone([...saveDone, item.name])
      }
    })
  }, [cycleTimeOptions, dispatch])

  return (
    <>
      <TitleAndTooltipContainer>
        <MetricsSettingTitle title={title} />
        <TooltipContainer>
          <Tooltip title='The report page will sum all the status in the column for cycletime calculation'>
            <IconButton aria-label='info'>
              <InfoOutlinedIcon />
            </IconButton>
          </Tooltip>
        </TooltipContainer>
      </TitleAndTooltipContainer>
      <CycleTimeContainer>
        {warningMessage && <WarningNotification message={warningMessage} />}
        <FormSelectPart selectedOptions={cycleTimeOptions} saveCycleTimeOptions={saveCycleTimeOptions} />
        <FlagCard />
      </CycleTimeContainer>
    </>
  )
}
