import {
  DateRangeContainer,
  DateRangeExpandContainer,
  SingleDateRange,
  StyledArrowForward,
  StyledCalendarToday,
  StyledDivider,
  StyledExpandMoreIcon,
} from './style';
import React, { useRef, useState, forwardRef, useEffect, useCallback } from 'react';
import { DateRange } from '@src/context/config/configSlice';
import { formatDate } from '@src/utils/util';
import { theme } from '@src/theme';

type Props = {
  dateRanges: DateRange;
  expandColor?: string;
  expandBackgroundColor?: string;
  disabledAll: boolean;
};

const DateRangeViewer = ({ dateRanges, disabledAll = true }: Props) => {
  const [showMoreDateRange, setShowMoreDateRange] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState(dateRanges[0]);
  const DateRangeExpandRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (DateRangeExpandRef.current && !DateRangeExpandRef.current?.contains(event.target as Node)) {
      setShowMoreDateRange(false);
    }
  }, []);

  const handleClick = (index: number) => {
    setSelectedDateRange(dateRanges[index]);
    setShowMoreDateRange(false);
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const DateRangeExpand = forwardRef((props, ref: React.ForwardedRef<HTMLDivElement>) => {
    return (
      <DateRangeExpandContainer ref={ref}>
        {dateRanges.map((dateRange, index) => {
          const disabled = disabledAll || dateRange.disabled;
          return (
            <SingleDateRange disabled={disabled} onClick={() => handleClick(index)} key={index}>
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
    <DateRangeContainer data-test-id={'date-range'} disabled={disabledAll}>
      {formatDate(selectedDateRange.startDate as string)}
      <StyledArrowForward />
      {formatDate(selectedDateRange.endDate as string)}
      <StyledCalendarToday />
      <StyledDivider orientation='vertical' />
      <StyledExpandMoreIcon aria-label='expandMore' onClick={() => setShowMoreDateRange(true)} />
      {showMoreDateRange && <DateRangeExpand ref={DateRangeExpandRef} />}
    </DateRangeContainer>
  );
};

export default DateRangeViewer;
