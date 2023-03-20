import {
  Checkbox,
  FormControl,
  FormHelperText,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material'
import { DEFAULT_HELPER_TEXT, SELECTED_VALUE_SEPARATOR } from '@src/constants'
import React, { useEffect, useState } from 'react'
import MetricsSettingTitle from '@src/components/Common/MetricsSettingTitle'
import { useAppDispatch } from '@src/hooks/useAppDispatch'
import { saveUsers } from '@src/context/Metrics/metricsSlice'

interface crewsProps {
  options: string[]
  title: string
  label: string
}

export const Crews = ({ options, title, label }: crewsProps) => {
  const dispatch = useAppDispatch()
  const [isEmptyCrewData, setIsEmptyCrewData] = useState<boolean>(false)
  const [selectedCrews, setSelectedCrews] = useState(options)
  const isAllSelected = options.length > 0 && selectedCrews.length === options.length

  useEffect(() => {
    setIsEmptyCrewData(selectedCrews.length === 0)
  }, [selectedCrews])

  const handleCrewChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value
    if (value[value.length - 1] === 'All') {
      setSelectedCrews(selectedCrews.length === options.length ? [] : options)
      return
    }
    setSelectedCrews([...value])
  }

  useEffect(() => {
    dispatch(saveUsers(selectedCrews))
  }, [selectedCrews, dispatch])

  return (
    <>
      <MetricsSettingTitle title={title} />
      <FormControl variant='standard' required error={isEmptyCrewData}>
        <InputLabel id='crew-data-multiple-checkbox-label'>{label}</InputLabel>
        <Select
          labelId='crew-data-multiple-checkbox-label'
          multiple
          value={selectedCrews}
          onChange={handleCrewChange}
          renderValue={(selectedCrews: string[]) => selectedCrews.join(SELECTED_VALUE_SEPARATOR)}
        >
          <MenuItem value='All'>
            <Checkbox checked={isAllSelected} />
            <ListItemText primary='All' />
          </MenuItem>
          {options.map((data) => (
            <MenuItem key={data} value={data}>
              <Checkbox checked={selectedCrews.includes(data)} />
              <ListItemText primary={data} />
            </MenuItem>
          ))}
        </Select>
        {isEmptyCrewData ? (
          <FormHelperText>
            {label} is <strong>required</strong>
          </FormHelperText>
        ) : (
          DEFAULT_HELPER_TEXT
        )}
      </FormControl>
    </>
  )
}
