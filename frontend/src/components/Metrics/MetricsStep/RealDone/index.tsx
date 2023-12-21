import { FormHelperText } from '@mui/material'
import React, { useEffect, useState } from 'react'
import {
  saveDoneColumn,
  selectCycleTimeSettings,
  selectMetricsContent,
  selectRealDoneWarningMessage,
} from '@src/context/Metrics/metricsSlice'
import { useAppDispatch } from '@src/hooks/useAppDispatch'
import { MetricsSettingTitle } from '@src/components/Common/MetricsSettingTitle'
import { METRICS_CONSTANTS } from '@src/constants/resources'
import { DEFAULT_HELPER_TEXT } from '@src/constants/commons'
import { useAppSelector } from '@src/hooks'
import { WarningNotification } from '@src/components/Common/WarningNotification'
import MultiAutoComplete from '@src/components/Common/MultiAutoComplete'
import { WarningMessage } from '@src/components/Metrics/MetricsStep/Crews/style'

interface realDoneProps {
  columns: { key: string; value: { name: string; statuses: string[] } }[]
  title: string
  label: string
}

const getSelectedDoneColumns = (selectedBoardColumns: { name: string; value: string }[]) =>
  selectedBoardColumns.filter(({ value }) => value === METRICS_CONSTANTS.doneValue).map(({ name }) => name)

const getFilteredStatus = (
  columns: { key: string; value: { name: string; statuses: string[] } }[],
  selectedDoneColumns: string[]
): string[] =>
  columns.filter(({ value }) => selectedDoneColumns.includes(value.name)).flatMap(({ value }) => value.statuses)

const getDoneStatus = (columns: { key: string; value: { name: string; statuses: string[] } }[]) =>
  columns.find((column) => column.key === METRICS_CONSTANTS.doneKeyFromBackend)?.value.statuses ?? []

export const RealDone = ({ columns, title, label }: realDoneProps) => {
  const dispatch = useAppDispatch()
  const selectedCycleTimeSettings = useAppSelector(selectCycleTimeSettings)
  const savedDoneColumns = useAppSelector(selectMetricsContent).doneColumn
  const realDoneWarningMessage = useAppSelector(selectRealDoneWarningMessage)
  const doneStatus = getDoneStatus(columns)
  const selectedDoneColumns = getSelectedDoneColumns(selectedCycleTimeSettings)
  const filteredStatus = getFilteredStatus(columns, selectedDoneColumns)
  const status = selectedDoneColumns.length < 1 ? doneStatus : filteredStatus
  const [selectedDoneStatus, setSelectedDoneStatus] = useState<string[]>([])
  const isAllSelected = savedDoneColumns.length === status.length
  const [useDefaultValue, setUseDefaultValue] = useState(false)

  const handleRealDoneChange = (event: React.SyntheticEvent, value: string[]) => {
    if (value[value.length - 1] === 'All') {
      setSelectedDoneStatus(selectedDoneStatus.length === status.length ? [] : status)
      dispatch(saveDoneColumn(selectedDoneStatus.length === status.length ? [] : status))
      return
    }
    setSelectedDoneStatus([...value])
    dispatch(saveDoneColumn([...value]))
  }

  useEffect(() => {
    if (status.length === 1) {
      if (savedDoneColumns.length !== 1) {
        dispatch(saveDoneColumn(status))
      }
      setUseDefaultValue(true)
    } else {
      setUseDefaultValue(false)
    }
  }, [status.length, useDefaultValue])

  return useDefaultValue ? (
    <></>
  ) : (
    <div aria-label='Real done setting section'>
      <MetricsSettingTitle title={title} />
      {realDoneWarningMessage && <WarningNotification message={realDoneWarningMessage} />}
      <MultiAutoComplete
        optionList={status}
        selectedOption={savedDoneColumns}
        textFieldLabel={label}
        isError={!savedDoneColumns.length}
        onChangeHandler={handleRealDoneChange}
        isSelectAll={isAllSelected}
      />
      <FormHelperText>
        {!savedDoneColumns.length ? (
          <WarningMessage>
            Must select which you want to <strong>consider as Done</strong>
          </WarningMessage>
        ) : (
          DEFAULT_HELPER_TEXT
        )}
      </FormHelperText>
    </div>
  )
}
