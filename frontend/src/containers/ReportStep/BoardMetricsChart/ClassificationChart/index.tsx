import {
  pieOptionMapper,
  stackedAreaOptionMapper,
  stackedBarOptionMapper,
} from '@src/containers/ReportStep/ChartOption';
import ChartAndTitleWrapper from '@src/containers/ReportStep/ChartAndTitleWrapper';
import { AnimationSeconds, EveryFrameMilliSecond } from '@src/constants/commons';
import { LABEL_PERCENT } from '@src/containers/ReportStep/BoardMetricsChart';
import { ReportResponse } from '@src/clients/report/dto/response';
import React, { useEffect, useRef, useState } from 'react';
import { showChart } from '@src/containers/ReportStep';
import { ChartType } from '@src/constants/resources';
import { theme } from '@src/theme';

enum ClassificationChartType {
  PIE = 'pie',
  BAR = 'bar',
}

const PERCENTAGE = 100;

function extractClassificationData(classification: string, dateRanges: string[], mappedData: ReportResponse[]) {
  const data = mappedData.flatMap((item) => item.classification?.filter((it) => it.name === classification));
  const allSubtitle = [
    ...new Set(
      data
        .filter((it) => it !== undefined)
        .flatMap((it) => it!.valueList)
        .map((it) => it.name),
    ),
  ];
  const indicators: { data: number[]; name: string; type: string }[] = [];

  data
    .filter((it) => it !== undefined)
    .map((it) => it!.valueList)
    .forEach((it) => {
      allSubtitle.map((subtitle) => {
        if (it.every((item) => item.name !== subtitle)) {
          it.push({ name: subtitle, value: '0.00%' });
        }
      });
    });

  allSubtitle.forEach((item) => {
    const classificationValue: number[] = data
      .filter((it) => it !== undefined)
      .flatMap((it) => it!.valueList)
      .filter((it) => it.name === item)
      .map((it) => parseFloat(it.value));
    indicators.push({ data: classificationValue, name: item, type: 'bar' });
  });

  const trendInfo = { type: ChartType.Classification };

  return {
    xAxis: dateRanges,
    yAxis: {
      name: 'Value/Total cards',
      alignTick: false,
      axisLabel: LABEL_PERCENT,
    },
    series: indicators,
    color: [
      theme.main.boardChart.barColorA,
      theme.main.boardChart.barColorB,
      theme.main.boardChart.barColorC,
      theme.main.boardChart.barColorD,
      theme.main.boardChart.barColorE,
      theme.main.boardChart.barColorF,
      theme.main.boardChart.barColorG,
      theme.main.boardChart.barColorH,
      theme.main.boardChart.barColorI,
      theme.main.boardChart.barColorJ,
    ],
    trendInfo,
  };
}

function getTotalCardCounts(mappedData: ReportResponse[], classification: string) {
  return mappedData
    .flatMap((it) => it.classificationCardCount)
    .filter((it) => it?.name === classification)
    .map((it) => it!.totalCount!)
    .reduce((res, it) => res + it, 0);
}

function extractedValueList(mappedData: ReportResponse[], classification: string) {
  return mappedData
    .flatMap((it) => it.classificationCardCount)
    .filter((it) => it?.name === classification)
    .flatMap((it) => it?.valueList);
}

function getAllSubtitles(mappedData: ReportResponse[], classification: string) {
  const data = extractedValueList(mappedData, classification);
  return [...new Set(data.filter((it) => it !== undefined).map((it) => it!.name))];
}

function getCardCountForSubtitle(data: ({ name: string; value: string } | undefined)[], subtitle: string) {
  return data
    .filter((it) => it !== undefined)
    .filter((it) => it!.name === subtitle)
    .reduce((res, cardInfo) => {
      return res + Number(cardInfo!.value);
    }, 0);
}

function checkClassificationChartType(classification: string, mappedData: ReportResponse[]) {
  const totalCardCounts = getTotalCardCounts(mappedData, classification);

  const data = extractedValueList(mappedData, classification);

  const totalCounts = data.filter((it) => it !== undefined).reduce((res, cardInfo) => res + Number(cardInfo?.value), 0);
  return totalCounts === totalCardCounts ? ClassificationChartType.PIE : ClassificationChartType.BAR;
}

function extractClassificationCardCountsPieData(classification: string, mappedData: ReportResponse[]) {
  const totalCardCounts = getTotalCardCounts(mappedData, classification);

  const data = extractedValueList(mappedData, classification);

  const allSubtitle = getAllSubtitles(mappedData, classification);
  const indicators: { value: string; name: string }[] = allSubtitle.map((subtitle) => {
    const cardCount = getCardCountForSubtitle(data, subtitle);
    return {
      name: subtitle,
      value: `${((cardCount * PERCENTAGE) / totalCardCounts).toFixed(2)}`,
    };
  });

  const trendInfo = { type: ChartType.Classification };

  return {
    series: indicators,
    color: [
      theme.main.boardChart.barColorA,
      theme.main.boardChart.barColorB,
      theme.main.boardChart.barColorC,
      theme.main.boardChart.barColorD,
      theme.main.boardChart.barColorE,
      theme.main.boardChart.barColorF,
      theme.main.boardChart.barColorG,
      theme.main.boardChart.barColorH,
      theme.main.boardChart.barColorI,
      theme.main.boardChart.barColorJ,
    ],
    trendInfo,
  };
}

function extractClassificationCardCountsBarData(classification: string, mappedData: ReportResponse[]) {
  const totalCardCounts = getTotalCardCounts(mappedData, classification);

  const data = extractedValueList(mappedData, classification);

  const allSubtitle = getAllSubtitles(mappedData, classification);
  const indicators = allSubtitle.map((subtitle) => {
    const cardCount = getCardCountForSubtitle(data, subtitle);
    return Number(((cardCount * PERCENTAGE) / totalCardCounts).toFixed(2));
  });

  const trendInfo = { type: ChartType.Classification };

  return {
    xAxis: {
      data: allSubtitle,
      boundaryGap: true,
      axisLabel: {
        color: 'black',
        alignMaxLabel: 'center',
        alignMinLabel: 'center',
      },
    },
    yAxis: [
      {
        name: '',
        alignTick: false,
        axisLabel: LABEL_PERCENT,
      },
    ],
    series: [
      {
        name: 'reverse',
        type: 'bar',
        data: indicators,
        yAxisIndex: 0,
        setAreaStyle: false,
        smooth: false,
      },
    ],
    color: [
      theme.main.boardChart.barColorA,
      theme.main.boardChart.barColorB,
      theme.main.boardChart.barColorC,
      theme.main.boardChart.barColorD,
      theme.main.boardChart.barColorE,
      theme.main.boardChart.barColorF,
      theme.main.boardChart.barColorG,
      theme.main.boardChart.barColorH,
      theme.main.boardChart.barColorI,
      theme.main.boardChart.barColorJ,
    ],
    trendInfo,
  };
}

export const ClassificationChart = ({
  classification,
  mappedData,
  dateRanges,
}: {
  classification: string;
  mappedData: ReportResponse[];
  dateRanges: string[];
}) => {
  const [isFirstIntoClassification, setIsFirstIntoClassification] = useState<boolean>(true);
  const [isShowTimePeriodChart, setIsShowTimePeriodChart] = useState<boolean>(true);
  const [canSwitchChart, setCanSwitchChart] = useState<boolean>(true);
  const [rotate, setRotate] = useState<number>(0);
  const classificationRef = useRef<HTMLDivElement>(null);
  let classificationData;
  let classificationDataOption;
  if (isShowTimePeriodChart) {
    classificationData = extractClassificationData(classification, dateRanges, mappedData);
    classificationDataOption =
      classificationData && stackedBarOptionMapper(classificationData, true, isFirstIntoClassification);
  } else {
    const chartType = checkClassificationChartType(classification, mappedData);
    if (chartType === ClassificationChartType.PIE) {
      classificationData = extractClassificationCardCountsPieData(classification, mappedData);
      classificationDataOption = classificationData && pieOptionMapper(classificationData);
    } else {
      classificationData = extractClassificationCardCountsBarData(classification, mappedData);
      classificationDataOption =
        classificationData && stackedAreaOptionMapper(classificationData, true, isFirstIntoClassification);
    }
  }
  const isClassificationFinished =
    mappedData.flatMap((value) => value.classification).filter((it) => it?.name === classification)?.length ===
    dateRanges.length;
  const isOnlyOneLegend = classificationDataOption.legend.data?.length === 0;

  const transition = {
    transform: `rotateY(${rotate}deg)`,
  };
  const MilliSecondsPerSecond = 1000;
  const maxRotateDeg = 90;
  const everyRotate = (maxRotateDeg * 2) / (AnimationSeconds * MilliSecondsPerSecond);

  let id: number;
  let start: number = 0;
  function step(timestamp: number) {
    if (start === 0) {
      start = timestamp;
    }
    const elapsed = timestamp - start;

    if (elapsed < (AnimationSeconds * MilliSecondsPerSecond) / 2) {
      setRotate(everyRotate * elapsed);
    } else {
      setRotate(maxRotateDeg);
      const newRotate = maxRotateDeg - everyRotate * (elapsed - (AnimationSeconds * MilliSecondsPerSecond) / 2);
      setRotate(newRotate < 0 ? 0 : newRotate);
    }

    if (Math.abs(elapsed - (AnimationSeconds * MilliSecondsPerSecond) / 2) < EveryFrameMilliSecond) {
      setIsShowTimePeriodChart(!isShowTimePeriodChart);
    }

    if (elapsed < AnimationSeconds * MilliSecondsPerSecond + EveryFrameMilliSecond) {
      id = window.requestAnimationFrame(step);
    } else {
      window.cancelAnimationFrame(id);
      setCanSwitchChart(true);
    }
  }
  const switchChart = () => {
    if (canSwitchChart) {
      setIsFirstIntoClassification(false);
      setCanSwitchChart(false);
      id = window.requestAnimationFrame(step);
    }
  };

  useEffect(() => {
    showChart(classificationRef.current, classificationDataOption);
  }, [classificationRef, classificationDataOption]);

  return (
    <ChartAndTitleWrapper
      subTitle={classification}
      isLoading={!isClassificationFinished}
      trendInfo={classificationData.trendInfo}
      ref={classificationRef}
      isShowRepeat={!isOnlyOneLegend || !isShowTimePeriodChart}
      clickRepeat={switchChart}
      animationStyle={transition}
      disabledClickRepeatButton={!canSwitchChart}
    />
  );
};
