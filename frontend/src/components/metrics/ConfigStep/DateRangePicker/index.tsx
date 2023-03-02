import React, { useState } from 'react'
import { Dayjs } from 'dayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers'
import { TextField } from '@mui/material'
import { datePickerPropsStyles, DateRangeBox } from '@src/components/metrics/ConfigStep/DateRangePicker/style'
import { DATE_RANGE, SELECT_OR_WRITE_DATE } from '@src/constants'

export const DateRangePicker = () => {
  const [dateRange, setDateRange] = useState<{
    startDate: Dayjs | null
    endDate: Dayjs | null
  }>({ startDate: null, endDate: null })

  const [dateRangeValueError, setDateRangeValueError] = useState([false, false])

  const checkDateformat = (value: Dayjs | null, dateType: number) => {
    const newDateRangeValueError = [...dateRangeValueError]
    if (value === null || !value.isValid()) newDateRangeValueError.splice(dateType, 1, true)
    else newDateRangeValueError.splice(dateType, 1, false)
    setDateRangeValueError(newDateRangeValueError)
  }

  const checkDateRangeValid = (startDate: Dayjs | null, endDate: Dayjs | null) => {
    setDateRange({ startDate, endDate })
    if (startDate && endDate && startDate.isAfter(endDate)) {
      setDateRangeValueError([dateRangeValueError[0], true])
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <p>Date Range Picker</p>
      <DateRangeBox>
        <DatePicker
          PaperProps={datePickerPropsStyles}
          label='From'
          value={dateRange.startDate}
          disablePast={true}
          onChange={(newValue) => {
            checkDateformat(newValue, DATE_RANGE.START_DATE)
            checkDateRangeValid(newValue, dateRange.endDate)
          }}
          renderInput={(params) => {
            if (params.inputProps) params.inputProps.placeholder = SELECT_OR_WRITE_DATE
            return (
              <TextField {...params} variant='standard' required error={dateRangeValueError[DATE_RANGE.START_DATE]} />
            )
          }}
        />
        <DatePicker
          PaperProps={datePickerPropsStyles}
          label='To'
          value={dateRange.endDate}
          disablePast={true}
          minDate={dateRange.startDate}
          onChange={(newValue) => {
            checkDateformat(newValue, DATE_RANGE.END_DATE)
            checkDateRangeValid(dateRange.startDate, newValue)
          }}
          renderInput={(params) => {
            if (params.inputProps) params.inputProps.placeholder = SELECT_OR_WRITE_DATE
            return (
              <TextField {...params} variant='standard' required error={dateRangeValueError[DATE_RANGE.END_DATE]} />
            )
          }}
        />
      </DateRangeBox>
    </LocalizationProvider>
  )
}
