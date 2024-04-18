import {
  DateRangeContainer,
  DateRangeExpandContainer,
  SingleDateRange,
  StyledArrowForward,
  StyledCalendarToday,
  StyledDivider,
  StyledExpandMoreIcon,
  StyledListItemButton,
  StyledPriorityHighIcon,
  StyledListItemIcon
} from './style';
import React, { useRef, useState, forwardRef, useEffect, useCallback } from 'react';
import { DateRange } from '@src/context/config/configSlice';
import { formatDate } from '@src/utils/util';
import { theme } from '@src/theme';

type Props = {
  dateRanges: DateRange;
  expandColor?: string;
  expandBackgroundColor?: string;
  onSelect?: (value: {startDate: string | null, endDate: string | null}) => void
};

const DateRangeViewer = ({
  dateRanges,
  expandColor = theme.palette.text.disabled,
  expandBackgroundColor = theme.palette.secondary.dark,
  onSelect
}: Props) => {
  const [showMoreDateRange, setShowMoreDateRange] = useState(false);
  const datePick = dateRanges[0];
  const DateRangeExpandRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (DateRangeExpandRef.current && !DateRangeExpandRef.current?.contains(event.target as Node)) {
      setShowMoreDateRange(false);
    }
  }, []);

  const handleSelectOption = (value: {startDate: string | null, endDate: string | null}) => {
    onSelect?.(value)
  }

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
          return (
            <StyledListItemButton key={index} disabled={dateRange.disabled} onClick={() => handleSelectOption(dateRange)} sx={{ backgroundColor: expandBackgroundColor, color: expandColor }}>
              <StyledListItemIcon>
                  <StyledPriorityHighIcon />
              </StyledListItemIcon>
              {formatDate(dateRange.startDate as string)}
              <StyledArrowForward />
              {formatDate(dateRange.endDate as string)}
            </StyledListItemButton>
          );
        })}
      </DateRangeExpandContainer>
    );
  });

  return (
    <DateRangeContainer data-test-id={'date-range'}>
      {formatDate(datePick.startDate as string)}
      <StyledArrowForward />
      {formatDate(datePick.endDate as string)}
      <StyledCalendarToday />
      <StyledDivider orientation='vertical' />
      <StyledExpandMoreIcon aria-label='expandMore' onClick={() => setShowMoreDateRange(true)} />
      {showMoreDateRange && <DateRangeExpand ref={DateRangeExpandRef} />}
    </DateRangeContainer>
  );
};

export default DateRangeViewer;
