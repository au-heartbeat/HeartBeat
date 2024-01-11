import { DateRangeContainer, StyledArrowForward, StyledCalendarToday } from './style';
import { formatDate } from '@src/utils/util';

type Props = {
  startDate: string;
  endDate: string;
};

const DateRangeViewer = ({ startDate, endDate }: Props) => {
  return (
    <DateRangeContainer>
      {formatDate(startDate)}
      <StyledArrowForward />
      {formatDate(endDate)}
      <StyledCalendarToday />
    </DateRangeContainer>
  );
};

export default DateRangeViewer;
