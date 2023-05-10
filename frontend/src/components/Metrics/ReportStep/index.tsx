import { useEffect, useState } from 'react'
import { useGenerateReportEffect } from '@src/hooks/useGenerateReportEffect'
import { Loading } from '@src/components/Loading'
import { useAppSelector } from '@src/hooks'
import { selectConfig } from '@src/context/config/configSlice'
import {
  CHINA_CALENDAR,
  INIT_REPORT_DATA_WITH_THREE_COLUMNS,
  INIT_REPORT_DATA_WITH_TWO_COLUMNS,
  INIT_REPORT_DATA_WITH_TWO_COLUMNS_CYCLE,
  NAME,
  PIPELINE_STEP,
} from '@src/constants'
import ReportForTwoColumns from '@src/components/Common/ReportForTwoColumns'
import ReportForThreeColumns from '@src/components/Common/ReportForThreeColumns'
import { ReportRequestDTO } from '@src/clients/report/dto/request'
import { IPipelineConfig, selectMetricsContent } from '@src/context/Metrics/metricsSlice'
import dayjs from 'dayjs'

export const ReportStep = () => {
  const { generateReport, isLoading } = useGenerateReportEffect()
  const [velocityData, setVelocityData] = useState(INIT_REPORT_DATA_WITH_TWO_COLUMNS)
  const [cycleTimeData, setCycleTimeData] = useState(INIT_REPORT_DATA_WITH_TWO_COLUMNS_CYCLE)
  const [classificationData, setClassificationData] = useState(INIT_REPORT_DATA_WITH_THREE_COLUMNS)
  const [deploymentFrequencyData, setDeploymentFrequencyData] = useState(INIT_REPORT_DATA_WITH_THREE_COLUMNS)
  const [leadTimeForChangesData, setLeadTimeForChangesData] = useState(INIT_REPORT_DATA_WITH_THREE_COLUMNS)
  const [changeFailureRateData, setChangeFailureRateData] = useState(INIT_REPORT_DATA_WITH_THREE_COLUMNS)
  const configData = useAppSelector(selectConfig)
  const {
    boardColumns,
    treatFlagCardAsBlock,
    users,
    targetFields,
    doneColumn,
    deploymentFrequencySettings,
    leadTimeForChanges,
  } = useAppSelector(selectMetricsContent)
  const { metrics, calendarType, dateRange } = configData.basic
  const { board, pipelineTool, sourceControl } = configData
  const { token, type, site, projectKey, boardId } = board.config

  const getPipelineConfig = (pipelineConfigs: IPipelineConfig[]) => {
    if (!pipelineConfigs[0].organization && pipelineConfigs.length === 1) {
      return []
    }
    return pipelineConfigs.map(({ organization, pipelineName, step }) => {
      const pipelineConfigFromPipelineList = configData.pipelineTool.verifiedResponse.pipelineList.find(
        (pipeline) => pipeline.name === pipelineName && pipeline.orgName === organization
      )
      if (pipelineConfigFromPipelineList != undefined) {
        const { orgName, orgId, name, id, repository } = pipelineConfigFromPipelineList
        return {
          orgId,
          orgName,
          id,
          name,
          step,
          repository,
        }
      }
    }) as { id: string; name: string; orgId: string; orgName: string; repository: string; step: string }[]
  }
  const getReportRequestBody = (): ReportRequestDTO => ({
    metrics: metrics,
    startTime: dayjs(dateRange.startDate).valueOf().toString(),
    endTime: dayjs(dateRange.endDate).valueOf().toString(),
    considerHoliday: calendarType === CHINA_CALENDAR,
    buildKiteSetting: {
      ...pipelineTool.config,
      deployment: getPipelineConfig(deploymentFrequencySettings),
    },
    codebaseSetting: {
      type: sourceControl.config.type,
      token: sourceControl.config.token,
      leadTime: getPipelineConfig(leadTimeForChanges),
    },
    jiraBoardSetting: {
      token,
      type,
      site,
      projectKey,
      boardId,
      boardColumns,
      treatFlagCardAsBlock,
      users,
      targetFields,
      doneColumn,
    },
  })

  useEffect(() => {
    generateReport(getReportRequestBody()).then((res) => {
      if (res) {
        res.velocityList && setVelocityData(res.velocityList)
        res.cycleTimeList && setCycleTimeData(res.cycleTimeList)
        res.classificationList && setClassificationData(res.classificationList)
        res.deploymentFrequencyList && setDeploymentFrequencyData(res.deploymentFrequencyList)
        res.changeFailureRateList && setChangeFailureRateData(res.changeFailureRateList)
        res.leadTimeForChangesList && setLeadTimeForChangesData(res.leadTimeForChangesList)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <>
          {velocityData && <ReportForTwoColumns title={'Velocity'} data={velocityData} />}
          {cycleTimeData && <ReportForTwoColumns title={'Cycle time'} data={cycleTimeData} />}
          {classificationData && (
            <ReportForThreeColumns
              title={'Classifications'}
              fieldName='Field Name'
              listName='Subtitle'
              data={classificationData}
            />
          )}
          {deploymentFrequencyData && (
            <ReportForThreeColumns
              title={'Deployment frequency'}
              fieldName={PIPELINE_STEP}
              listName={NAME}
              data={deploymentFrequencyData}
            />
          )}
          {leadTimeForChangesData && (
            <ReportForThreeColumns
              title={'Lead time for changes'}
              fieldName={PIPELINE_STEP}
              listName={NAME}
              data={leadTimeForChangesData}
            />
          )}
          {changeFailureRateData && (
            <ReportForThreeColumns
              title={'Change failure rate'}
              fieldName={PIPELINE_STEP}
              listName={NAME}
              data={changeFailureRateData}
            />
          )}
        </>
      )}
    </>
  )
}
