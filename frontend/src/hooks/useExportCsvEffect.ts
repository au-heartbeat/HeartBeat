import { useState } from 'react'
import { CSVReportRequestDTO } from '@src/clients/report/dto/request'
import { csvClient } from '@src/clients/report/CSVClient'
import { ERROR_MESSAGE_TIME_DURATION } from '@src/constants'

export interface useExportCsvEffectInterface {
  fetchExportData: (params: CSVReportRequestDTO) => void
  errorMessage: string
  isError: boolean
}

export const useExportCsvEffect = (): useExportCsvEffectInterface => {
  const [errorMessage, setErrorMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const fetchExportData = async (params: CSVReportRequestDTO) => {
    try {
      return await csvClient.exportCSVData(params)
    } catch (e) {
      const err = e as Error
      const { response } = err
      if (response && response.status && response.status >= 500 && response.status < 600) {
        setIsError(true)
      } else {
        setErrorMessage(`failed to export csv: ${err.message}`)
        setTimeout(() => {
          setErrorMessage('')
        }, ERROR_MESSAGE_TIME_DURATION)
      }
    }
  }

  return { fetchExportData, errorMessage, isError }
}
