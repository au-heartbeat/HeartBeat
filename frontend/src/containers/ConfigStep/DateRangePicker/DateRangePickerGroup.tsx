import { DateRangePickerGroupContainer, AddButton } from '@src/containers/ConfigStep/DateRangePicker/style';
import { DateRangePicker } from '@src/containers/ConfigStep/DateRangePicker/DateRangePicker';
import { ADD_TIME_RANGE_BUTTON_TEXT, MAX_TIME_RANGE_AMOUNT } from '@src/constants/resources';
import { selectDateRange, updateDateRange } from '@src/context/config/configSlice';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useAppDispatch, useAppSelector } from '@src/hooks/useAppDispatch';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Add } from '@mui/icons-material';

export const DateRangePickerGroup = () => {
  const dispatch = useAppDispatch();
  const dateRangeGroup = useAppSelector(selectDateRange);
  const isAddButtonDisabled = dateRangeGroup.length === MAX_TIME_RANGE_AMOUNT;
  const addRangeHandler = () => {
    const newDateRangeGroup = [...dateRangeGroup, { startDate: null, endDate: null }];
    dispatch(updateDateRange(newDateRangeGroup));
  };
  return (
    <DateRangePickerGroupContainer>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {dateRangeGroup.map(({ startDate, endDate }, index) => (
          <DateRangePicker startDate={startDate} endDate={endDate} index={index} key={index} />
        ))}
        <AddButton
          aria-label='Button for adding date range'
          disabled={isAddButtonDisabled}
          startIcon={<Add />}
          onClick={addRangeHandler}
        >
          {ADD_TIME_RANGE_BUTTON_TEXT}
        </AddButton>
      </LocalizationProvider>
    </DateRangePickerGroupContainer>
  );
};