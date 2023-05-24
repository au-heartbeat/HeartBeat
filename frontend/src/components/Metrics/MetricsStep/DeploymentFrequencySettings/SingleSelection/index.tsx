import { FormHelperText, InputLabel, ListItemText, MenuItem, Select, SelectChangeEvent } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { FormControlWrapper } from './style'
import camelCase from 'lodash.camelcase'
import { useAppSelector } from '@src/hooks'
import { selectMetricsContent } from '@src/context/Metrics/metricsSlice'

interface Props {
  options: string[]
  label: string
  value: string
  id: number
  errorMessage: string | undefined
  onGetSteps?: (pipelineName: string) => void
  onUpDatePipeline: (id: number, label: string, value: string) => void
  onClearErrorMessage: (id: number, label: string) => void
}

export const SingleSelection = ({
  options,
  label,
  value,
  id,
  errorMessage,
  onGetSteps,
  onUpDatePipeline,
  onClearErrorMessage,
}: Props) => {
  const labelId = `single-selection-${label.toLowerCase().replace(' ', '-')}`
  const [selectedOptions, setSelectedOptions] = useState(value)
  const step = useAppSelector(selectMetricsContent)
    .deploymentFrequencySettings.filter((i) => i.id === id)
    .map((i) => i.step)
    .join(',')

  const handleChange = (event: SelectChangeEvent) => {
    const newValue = event.target.value
    setSelectedOptions(newValue)
    if (onGetSteps) {
      onUpDatePipeline(id, 'Step', '')
      onGetSteps(newValue)
    }
    onUpDatePipeline(id, label, newValue)
    !!errorMessage && onClearErrorMessage(id, camelCase(label))
  }

  useEffect(() => {
    if (onGetSteps && selectedOptions !== '' && step === '') {
      onGetSteps(selectedOptions)
    }
  }, [])

  return (
    <>
      <FormControlWrapper variant='standard' required error={!!errorMessage}>
        <InputLabel id={labelId}>{label}</InputLabel>
        <Select labelId={labelId} value={value} onChange={handleChange}>
          {options.map((data) => (
            <MenuItem key={data} value={data} data-test-id={labelId}>
              <ListItemText primary={data} />
            </MenuItem>
          ))}
        </Select>
        {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
      </FormControlWrapper>
    </>
  )
}
