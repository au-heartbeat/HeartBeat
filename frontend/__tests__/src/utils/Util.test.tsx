import {
  exportToJsonFile,
  filterAndMapCycleTimeSettings,
  findCaseInsensitiveType,
  getJiraBoardToken,
  getRealDoneStatus,
  transformToCleanedBuildKiteEmoji,
} from '@src/utils/util'
import { CleanedBuildKiteEmoji, OriginBuildKiteEmoji } from '@src/emojis/emoji'
import { EMPTY_STRING } from '@src/constants/commons'
import { PIPELINE_TOOL_TYPES } from '../fixtures'
import { CYCLE_TIME_SETTINGS_TYPES } from '@src/constants/resources'

describe('exportToJsonFile function', () => {
  it('should create a link element with the correct attributes and click it', () => {
    const filename = 'test'
    const json = { key: 'value' }
    const documentCreateSpy = jest.spyOn(document, 'createElement')

    exportToJsonFile(filename, json)

    expect(documentCreateSpy).toHaveBeenCalledWith('a')
  })
})

describe('transformToCleanedBuildKiteEmoji function', () => {
  it('should transform to cleaned emoji', () => {
    const mockOriginEmoji: OriginBuildKiteEmoji = {
      name: 'zap',
      image: 'abc.com',
      aliases: [],
    }

    const expectedCleanedEmoji: CleanedBuildKiteEmoji = {
      image: 'abc.com',
      aliases: ['zap'],
    }

    const [result] = transformToCleanedBuildKiteEmoji([mockOriginEmoji])

    expect(result).toEqual(expectedCleanedEmoji)
  })
})

describe('getJiraToken function', () => {
  it('should return an valid string when token is not empty string', () => {
    const email = 'test@example.com'
    const token = 'myToken'

    const jiraToken = getJiraBoardToken(token, email)
    const encodedMsg = `Basic ${btoa(`${email}:${token}`)}`

    expect(jiraToken).toBe(encodedMsg)
  })

  it('should return an empty string when token is missing', () => {
    const email = 'test@example.com'
    const token = ''

    const jiraToken = getJiraBoardToken(token, email)

    expect(jiraToken).toBe('')
  })
})

describe('findCaseInsensitiveType function', () => {
  it('Should return "BuildKite" when passing a type given case insensitive input bUildkite', () => {
    const selectedValue = 'bUildkite'
    const value = findCaseInsensitiveType(Object.values(PIPELINE_TOOL_TYPES), selectedValue)
    expect(value).toBe(PIPELINE_TOOL_TYPES.BUILD_KITE)
  })

  it('Should return "GoCD" when passing a type given case sensitive input GoCD', () => {
    const selectedValue = 'GoCD'
    const value = findCaseInsensitiveType(Object.values(PIPELINE_TOOL_TYPES), selectedValue)
    expect(value).toBe(PIPELINE_TOOL_TYPES.GO_CD)
  })

  it('Should return "GoCD" when passing a type given case insensitive input Gocd', () => {
    const selectedValue = 'Gocd'
    const value = findCaseInsensitiveType(Object.values(PIPELINE_TOOL_TYPES), selectedValue)
    expect(value).toBe(PIPELINE_TOOL_TYPES.GO_CD)
  })

  it('Should return "_BuildKite" when passing a type given the value mismatches with PIPELINE_TOOL_TYPES', () => {
    const selectedValue = '_BuildKite'
    const value = findCaseInsensitiveType(Object.values(PIPELINE_TOOL_TYPES), selectedValue)
    expect(value).not.toBe(PIPELINE_TOOL_TYPES.BUILD_KITE)
    expect(value).not.toBe(PIPELINE_TOOL_TYPES.GO_CD)
    expect(value).toBe(selectedValue)
  })

  it('Should return empty string when passing a type given empty string', () => {
    const selectedValue = ''
    const value = findCaseInsensitiveType(Object.values(PIPELINE_TOOL_TYPES), selectedValue)
    expect(value).toBe(EMPTY_STRING)
  })
})

describe('filterAndMapCycleTimeSettings function', () => {
  it('should filter and map CycleTimeSettings when generate report', () => {
    const MOCK_CYCLE_TIME_SETTING = [
      { column: 'TODO', status: 'ToDo', value: 'TODO' },
      { column: 'TODO', status: 'Backlog', value: 'TODO' },
      { column: 'IN DEV', status: 'InDev', value: 'IN DEV' },
      { column: 'IN DEV', status: 'Doing', value: 'IN DEV' },
      { column: 'DONE', status: 'Done', value: 'DONE' },
    ]

    const value = filterAndMapCycleTimeSettings(MOCK_CYCLE_TIME_SETTING)

    expect(value).toStrictEqual([
      { name: 'ToDo', value: 'TODO' },
      { name: 'Backlog', value: 'TODO' },
      { name: 'InDev', value: 'IN DEV' },
      { name: 'Doing', value: 'IN DEV' },
      { name: 'Done', value: 'DONE' },
    ])
  })
})

describe('getRealDoneStatus', () => {
  it('should return selected done status when cycle time settings only have one done value and type is by column', () => {
    const MOCK_CYCLE_TIME_SETTING = [
      { column: 'TODO', status: 'ToDo', value: 'TODO' },
      { column: 'TODO', status: 'Backlog', value: 'TODO' },
      { column: 'IN DEV', status: 'InDev', value: 'IN DEV' },
      { column: 'IN DEV', status: 'Doing', value: 'IN DEV' },
      { column: 'DONE', status: 'DONE', value: 'Done' },
    ]

    const result = getRealDoneStatus(MOCK_CYCLE_TIME_SETTING, CYCLE_TIME_SETTINGS_TYPES.BY_COLUMN, [])

    expect(result).toEqual(['DONE'])
  })

  it('should return selected done status when cycle time settings only have one done value and type is by status', () => {
    const MOCK_CYCLE_TIME_SETTING = [
      { column: 'TODO', status: 'ToDo', value: 'TODO' },
      { column: 'TODO', status: 'Backlog', value: 'TODO' },
      { column: 'IN DEV', status: 'InDev', value: 'IN DEV' },
      { column: 'IN DEV', status: 'Doing', value: 'IN DEV' },
      { column: 'DONE', status: 'DONE', value: 'Done' },
    ]

    const result = getRealDoneStatus(MOCK_CYCLE_TIME_SETTING, CYCLE_TIME_SETTINGS_TYPES.BY_STATUS, [])

    expect(result).toEqual(['DONE'])
  })

  it('should return real done status when cycle time settings type is by column', () => {
    const MOCK_CYCLE_TIME_SETTING = [
      { column: 'TODO', status: 'ToDo', value: 'TODO' },
      { column: 'TODO', status: 'Backlog', value: 'TODO' },
      { column: 'IN DEV', status: 'InDev', value: 'IN DEV' },
      { column: 'IN DEV', status: 'Doing', value: 'Done' },
      { column: 'DONE', status: 'DONE', value: 'Done' },
    ]

    const result = getRealDoneStatus(MOCK_CYCLE_TIME_SETTING, CYCLE_TIME_SETTINGS_TYPES.BY_COLUMN, ['Doing'])

    expect(result).toEqual(['Doing'])
  })

  it('should return selected done status when cycle time settings type is by column', () => {
    const MOCK_CYCLE_TIME_SETTING = [
      { column: 'TODO', status: 'ToDo', value: 'TODO' },
      { column: 'TODO', status: 'Backlog', value: 'TODO' },
      { column: 'IN DEV', status: 'InDev', value: 'IN DEV' },
      { column: 'IN DEV', status: 'Doing', value: 'Done' },
      { column: 'DONE', status: 'DONE', value: 'Done' },
    ]

    const result = getRealDoneStatus(MOCK_CYCLE_TIME_SETTING, CYCLE_TIME_SETTINGS_TYPES.BY_STATUS, ['something'])

    expect(result).toEqual(['Doing', 'DONE'])
  })
})
