import { useState } from 'react'
import { ERROR_MESSAGE_TIME_DURATION } from '@src/constants'
import { reportClient } from '@src/clients/ReportClient'
import { CycleTimeRes, VelocityRes } from '@src/models/response/reportRes'
import { ReportReq } from '@src/models/request/reportReq'

export interface useGenerateReportEffectInterface {
  generateReport: (params: ReportReq) => Promise<
    | {
        response: {
          velocity: VelocityRes
          cycleTime: CycleTimeRes
        }
      }
    | undefined
  >
  isLoading: boolean
  errorMessage: string
}

export const useGenerateReportEffect = (): useGenerateReportEffectInterface => {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const generateReport = async (params: ReportReq) => {
    setIsLoading(true)
    try {
      return await reportClient.report(params)
    } catch (e) {
      const err = e as Error
      setErrorMessage(`generate report: ${err.message}`)
      setTimeout(() => {
        setErrorMessage('')
      }, ERROR_MESSAGE_TIME_DURATION)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    generateReport,
    isLoading,
    errorMessage,
  }
}
