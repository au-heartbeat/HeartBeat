import {
  ChartType,
  CYCLE_TIME_LIST,
  CycleTimeSettingsTypes,
  DOWN_TREND_IS_BETTER,
  METRICS_CONSTANTS,
  TrendIcon,
  TrendType,
  UP_TREND_IS_BETTER,
} from '@src/constants/resources';
import { CleanedBuildKiteEmoji, OriginBuildKiteEmoji } from '@src/constants/emojis/emoji';
import { ICycleTimeSetting, IPipelineConfig } from '@src/context/Metrics/metricsSlice';
import { ITargetFieldType } from '@src/components/Common/MultiAutoComplete/styles';
import { IPipeline } from '@src/context/config/pipelineTool/verifyResponseSlice';
import { ITrendInfo } from '@src/containers/ReportStep/ChartAndTitleWrapper';
import { includes, isEqual, sortBy, uniq, uniqBy } from 'lodash';
import { DateRangeList } from '@src/context/config/configSlice';
import { BoardInfoResponse } from '@src/hooks/useGetBoardInfo';
import { DATE_FORMAT_TEMPLATE } from '@src/constants/template';
import duration from 'dayjs/plugin/duration';
import dayjs from 'dayjs';

dayjs.extend(duration);

export const exportToJsonFile = (filename: string, json: object) => {
  const dataStr = JSON.stringify(json, null, 4);
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
  const exportFileDefaultName = `${filename}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const downloadCSV = (filename: string, data: string) => {
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const transformToCleanedBuildKiteEmoji = (input: OriginBuildKiteEmoji[]): CleanedBuildKiteEmoji[] =>
  input.map(({ name, image, aliases }) => ({
    image,
    aliases: [...new Set([...aliases, name])],
  }));

export const getJiraBoardToken = (token: string, email: string) => {
  if (!token) return '';
  const encodedMsg = btoa(`${email}:${token}`);

  return `Basic ${encodedMsg}`;
};

export const filterAndMapCycleTimeSettings = (cycleTimeSettings: ICycleTimeSetting[]) =>
  cycleTimeSettings
    .filter((item) => item.value !== METRICS_CONSTANTS.cycleTimeEmptyStr)
    .map(({ status, value }) => ({
      name: status,
      value,
    }));

export const getRealDoneStatus = (
  cycleTimeSettings: ICycleTimeSetting[],
  cycleTimeSettingsType: CycleTimeSettingsTypes,
  realDoneStatus: string[],
) => {
  const selectedDoneStatus = cycleTimeSettings
    .filter(({ value }) => value === METRICS_CONSTANTS.doneValue)
    .map(({ status }) => status);
  if (selectedDoneStatus.length <= 1) {
    return selectedDoneStatus;
  }
  return cycleTimeSettingsType === CycleTimeSettingsTypes.BY_COLUMN
    ? realDoneStatus
    : cycleTimeSettings.filter(({ value }) => value === METRICS_CONSTANTS.doneValue).map(({ status }) => status);
};

export const findCaseInsensitiveType = (option: string[], value: string): string => {
  const newValue = option.find((item) => value.toLowerCase() === item.toLowerCase());
  return newValue ? newValue : value;
};

export const getDisabledOptions = (deploymentFrequencySettings: IPipelineConfig[], option: string) => {
  return includes(
    deploymentFrequencySettings.map((item) => item.pipelineName),
    option,
  );
};

export const sortDisabledOptions = (deploymentFrequencySettings: IPipelineConfig[], options: string[]) => {
  return sortBy(options, (item: string) => getDisabledOptions(deploymentFrequencySettings, item));
};

export const formatDate = (date: Date | string) => {
  return dayjs(date).format(DATE_FORMAT_TEMPLATE);
};

export const formatMinToHours = (duration: number) => {
  return dayjs.duration(duration, 'minutes').asHours();
};

export const formatMillisecondsToHours = (duration: number) => {
  return dayjs.duration(duration, 'milliseconds').asHours();
};

export const formatDateToTimestampString = (date: string) => {
  return dayjs(date).valueOf().toString();
};

export const sortDateRanges = (dateRanges: DateRangeList, descending = true) => {
  const result = [...dateRanges].sort((a, b) => {
    return dayjs(b.startDate as string).diff(dayjs(a.startDate as string));
  });
  return descending ? result : result.reverse();
};

export const formatDuplicatedNameWithSuffix = (data: ITargetFieldType[]) => {
  const nameSumMap = new Map<string, number>();
  const nameCountMap = new Map<string, number>();
  data.forEach((item) => {
    const name = item.name;
    const count = nameCountMap.get(item.name) || 0;
    nameSumMap.set(name, count + 1);
    nameCountMap.set(name, count + 1);
  });
  return data.map((item) => {
    const newItem = { ...item };
    const name = newItem.name;
    const count = nameCountMap.get(name) as number;
    const maxCount = nameSumMap.get(name) as number;
    if (maxCount > 1) {
      newItem.name = `${name}-${maxCount - count + 1}`;
      nameCountMap.set(name, count - 1);
    }
    return newItem;
  });
};

export const getSortedAndDeduplicationBoardingMapping = (boardMapping: ICycleTimeSetting[]) => {
  return [...new Set(boardMapping.map((item) => item.value))].sort((a, b) => {
    return CYCLE_TIME_LIST.indexOf(a) - CYCLE_TIME_LIST.indexOf(b);
  });
};

export const onlyEmptyAndDoneState = (boardingMappingStates: string[]) =>
  isEqual(boardingMappingStates, [METRICS_CONSTANTS.doneValue]) ||
  isEqual(boardingMappingStates, [METRICS_CONSTANTS.cycleTimeEmptyStr, METRICS_CONSTANTS.doneValue]) ||
  isEqual(boardingMappingStates, [METRICS_CONSTANTS.doneValue, METRICS_CONSTANTS.cycleTimeEmptyStr]);

export const convertCycleTimeSettings = (
  cycleTimeSettingsType: CycleTimeSettingsTypes,
  cycleTimeSettings: ICycleTimeSetting[],
) => {
  if (cycleTimeSettingsType === CycleTimeSettingsTypes.BY_COLUMN) {
    return ([...new Set(cycleTimeSettings.map(({ column }: ICycleTimeSetting) => column))] as string[]).map(
      (uniqueColumn) => ({
        [uniqueColumn]:
          cycleTimeSettings.find(({ column }: ICycleTimeSetting) => column === uniqueColumn)?.value ||
          METRICS_CONSTANTS.cycleTimeEmptyStr,
      }),
    );
  }
  return cycleTimeSettings?.map(({ status, value }: ICycleTimeSetting) => ({ [status]: value }));
};

export const updateResponseCrews = (organization: string, pipelineName: string, pipelineList: IPipeline[]) => {
  return pipelineList.map((pipeline) =>
    pipeline.name === pipelineName && pipeline.orgName === organization
      ? {
          ...pipeline,
          crews: [],
        }
      : pipeline,
  );
};

export const uniqPipelineListCrews = (pipelineList: IPipeline[]) =>
  uniq(pipelineList.flatMap(({ crews }) => crews)).filter((crew) => crew !== undefined);

export function existBlockState(cycleTimeSettings: ICycleTimeSetting[]) {
  return cycleTimeSettings.some(({ value }) => METRICS_CONSTANTS.blockValue === value);
}

export function combineBoardInfo(boardInfoResponses: BoardInfoResponse[]) {
  if (boardInfoResponses) {
    const allUsers = [...new Set(boardInfoResponses.flatMap((result) => result.users))];
    const allTargetFields = uniqBy(
      boardInfoResponses.flatMap((result) => result.targetFields),
      (elem) => [elem.key, elem.name, elem.flag].join(),
    );
    const allJiraColumns = boardInfoResponses[boardInfoResponses.length - 1].jiraColumns;
    const allIgnoredTargetFields = uniqBy(
      boardInfoResponses.flatMap((result) => result.ignoredTargetFields),
      (elem) => [elem.key, elem.name, elem.flag].join(),
    );
    return {
      users: allUsers,
      targetFields: allTargetFields,
      ignoredTargetFields: allIgnoredTargetFields,
      jiraColumns: allJiraColumns,
    };
  }
}

export const xAxisLabelDateFormatter = (dateRange: string) => {
  const [startDate, endDate] = dateRange.split('-');
  const startMonthDay = startDate.slice(5);
  const endMonthDay = endDate.slice(5);

  return `${startMonthDay}-${endMonthDay}`;
};

export const getTrendInfo = (trendNumber: number, dateRangeList: string[], type: ChartType) => {
  const result: ITrendInfo = {
    trendNumber: trendNumber,
    dateRangeList: dateRangeList,
    type,
  } as ITrendInfo;

  if (UP_TREND_IS_BETTER.includes(type)) {
    if (trendNumber >= 0) {
      result.icon = TrendIcon.Up;
      result.trendType = TrendType.Better;
    } else {
      result.icon = TrendIcon.Down;
      result.trendType = TrendType.Worse;
    }
  } else if (DOWN_TREND_IS_BETTER.includes(type)) {
    if (trendNumber <= 0) {
      result.icon = TrendIcon.Down;
      result.trendType = TrendType.Better;
    } else {
      result.icon = TrendIcon.Up;
      result.trendType = TrendType.Worse;
    }
  }
  return result;
};

export const calculateTrendInfo = (
  dataList: number[] | undefined,
  dateRangeList: string[],
  type: ChartType,
): ITrendInfo => {
  if (!dataList || dataList.filter((data) => data).length < 2) return { type };

  const latestValidIndex = dataList.findLastIndex((data) => data);
  const beforeLatestValidIndex = dataList.findLastIndex((data, index) => data && index !== latestValidIndex);

  const trendNumber =
    (dataList[latestValidIndex] - dataList[beforeLatestValidIndex]) / dataList[beforeLatestValidIndex];
  const validDateRangeList: string[] = [];
  validDateRangeList.push(dateRangeList[latestValidIndex], dateRangeList[beforeLatestValidIndex]);

  return getTrendInfo(trendNumber, validDateRangeList, type);
};

export const convertNumberToPercent = (num: number): string => {
  const positiveNumber = num >= 0 ? num : -num;
  return (positiveNumber * 100).toFixed(2) + '%';
};

export const percentageFormatter = (showPercentage = true) => {
  return (value: number) => value + (showPercentage ? '%' : '');
};
