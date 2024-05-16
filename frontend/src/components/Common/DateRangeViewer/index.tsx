import {
  DateRangeContainer,
  DateRangeExpandContainer,
  DateRangeFailedIconContainer,
  SingleDateRange,
  StyledArrowForward,
  StyledCalendarToday,
  StyledDateRangeViewerContainer,
  StyledDivider,
  StyledExpandContainer,
  StyledExpandMoreIcon,
} from './style';
import {
  IMetricsPageFailedDateRange,
  IReportPageFailedDateRange,
  selectMetricsPageFailedTimeRangeInfos,
  selectReportPageFailedTimeRangeInfos,
  selectStepNumber,
} from '@src/context/stepper/StepperSlice';
import React, { useRef, useState, forwardRef, useEffect, useCallback } from 'react';
import { DateRange, DateRangeList } from '@src/context/config/configSlice';
import { formatDate, formatDateToTimestampString } from '@src/utils/util';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { useAppSelector } from '@src/hooks';
import { theme } from '@src/theme';

type Props = {
  dateRangeList: DateRangeList;
  selectedDateRange?: DateRange;
  changeDateRange?: (dateRange: DateRange) => void;
  disabledAll?: boolean;
};

const DateRangeViewer = ({ dateRangeList, changeDateRange, selectedDateRange, disabledAll = true }: Props) => {
  const [showMoreDateRange, setShowMoreDateRange] = useState(false);
  const DateRangeExpandRef = useRef<HTMLDivElement>(null);
  const metricsPageFailedTimeRangeInfos = useAppSelector(selectMetricsPageFailedTimeRangeInfos);
  const reportPageFailedTimeRangeInfos = useAppSelector(selectReportPageFailedTimeRangeInfos);
  const stepNumber = useAppSelector(selectStepNumber);
  const currentDateRange: DateRange = selectedDateRange || dateRangeList[0];
  const isMetricsPage = stepNumber === 1;

  const backgroundColor = isMetricsPage ? theme.palette.secondary.dark : theme.palette.common.white;
  const currentDateRangeHasFailed = getCurrentDateRangeHasFailed(
    formatDateToTimestampString(currentDateRange.startDate!),
  );

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (DateRangeExpandRef.current && !DateRangeExpandRef.current?.contains(event.target as Node)) {
      setShowMoreDateRange(false);
    }
  }, []);

  const getBackgroundColor = (currentDate: string) => {
    if (isMetricsPage || currentDate === currentDateRange.startDate) {
      return theme.palette.secondary.dark;
    } else {
      return theme.palette.common.white;
    }
  };

  const handleClick = (key: string) => {
    if (disabledAll) return;
    changeDateRange && changeDateRange(dateRangeList.find((dateRange) => dateRange.startDate === key)!);
    setShowMoreDateRange(false);
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  function getCurrentDateRangeHasFailed(startDate: string) {
    let errorInfo: IMetricsPageFailedDateRange | IReportPageFailedDateRange;
    if (isMetricsPage) {
      errorInfo = metricsPageFailedTimeRangeInfos[startDate] || {};
    } else {
      errorInfo = reportPageFailedTimeRangeInfos[startDate] || {};
    }
    return Object.values(errorInfo).some((value) => value);
  }

  const DateRangeExpand = forwardRef((props, ref: React.ForwardedRef<HTMLDivElement>) => {
    return (
      <DateRangeExpandContainer ref={ref} backgroundColor={backgroundColor}>
        {dateRangeList.map((dateRange) => {
          const disabled = dateRange.disabled || disabledAll;
          const hasError = getCurrentDateRangeHasFailed(formatDateToTimestampString(dateRange.startDate!));
          return (
            <SingleDateRange
              disabled={disabled}
              backgroundColor={getBackgroundColor(dateRange.startDate!)}
              onClick={() => handleClick(dateRange.startDate!)}
              key={dateRange.startDate!}
            >
              <DateRangeFailedIconContainer>
                {hasError && <PriorityHighIcon color='error' />}
              </DateRangeFailedIconContainer>
              {formatDate(dateRange.startDate as string)}
              <StyledArrowForward />
              {formatDate(dateRange.endDate as string)}
            </SingleDateRange>
          );
        })}
      </DateRangeExpandContainer>
    );
  });

  return (
    <StyledDateRangeViewerContainer
      color={disabledAll ? theme.palette.text.disabled : theme.palette.text.primary}
      backgroundColor={backgroundColor}
      aria-label='date range'
    >
      <DateRangeContainer>
        <DateRangeFailedIconContainer>
          {currentDateRangeHasFailed && <PriorityHighIcon color='error' />}
        </DateRangeFailedIconContainer>
        {formatDate(currentDateRange.startDate!)}
        <StyledArrowForward />
        {formatDate(currentDateRange.endDate!)}
        <StyledCalendarToday />
      </DateRangeContainer>
      <StyledDivider orientation='vertical' />
      <StyledExpandContainer aria-label='expandMore' onClick={() => setShowMoreDateRange(true)}>
        <StyledExpandMoreIcon />
      </StyledExpandContainer>
      {showMoreDateRange && <DateRangeExpand ref={DateRangeExpandRef} />}
    </StyledDateRangeViewerContainer>
  );
};

export default DateRangeViewer;
