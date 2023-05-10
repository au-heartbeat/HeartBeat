export interface ReportRequestDTO {
  metrics: string[]
  startTime: string | null
  endTime: string | null
  considerHoliday: boolean
  buildKiteSetting?: {
    type: string
    token: string
    deployment:
      | {
          id: string
          name: string
          orgId: string
          orgName: string
          repository: string
          step: string
        }[]
      | []
  }
  codebaseSetting?: {
    type: string
    token: string
    leadTime: { id: string; name: string; orgId: string; orgName: string; repository: string; step: string }[]
  }
  jiraBoardSetting?: {
    token: string
    type: string
    site: string
    projectKey: string
    boardId: string
    boardColumns: { name: string; value: string }[]
    treatFlagCardAsBlock: boolean
    users: string[]
    targetFields: { key: string; name: string; flag: boolean }[]
    doneColumn: string[]
  }
  csvTimeStamp?: number
}
