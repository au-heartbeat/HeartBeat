import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';
import { BasicButton } from '@src/components/Common/Buttons';
import { Button, IconButton } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { styled } from '@mui/material/styles';
import { theme } from '@src/theme';

export const DateRangePickerGroupContainer = styled('div')({
  border: `${theme.main.cardBorder}`,
  borderRadius: '0.25rem',
  padding: '1rem 1.5rem 1.5rem 1.5rem',
});

export const TitleContainer = styled('div')({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const StyledFeaturedRangePickerContainer = styled('div')({
  '&:first-of-type>.range-picker-row': {
    marginTop: '1rem',
  },
});

export const StyledDateRangePickerContainer = styled('div')({
  display: 'flex',
  width: '100%',
  justifyContent: 'space-between',
  gap: '1.5rem',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
  },
  position: 'relative',
  paddingBottom: '2.5rem',
});

export const StyledDateRangePicker = styled(DatePicker)({
  width: '50%',
  button: {
    margin: '0.75rem',
  },
  marginTop: '-0.4rem',
  [theme.breakpoints.down('sm')]: {
    width: '100%',
  },
});

export const AddButton = styled(Button)({
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  borderRadius: '0.25rem',
  border: `0.07rem dashed ${theme.main.alert.info.iconColor}`,
  marginTop: '1.5rem',
});

export const RemoveButton = styled(BasicButton)({
  fontFamily: theme.main.font.secondary,
  position: 'absolute',
  right: 0,
  top: '3rem',
});

export const SortTextButton = styled(Button)({
  cursor: 'default',
  backgroundColor: theme.main.button.disabled.color,
  '&:hover': {
    backgroundColor: theme.main.button.disabled.color,
  },
  color: theme.main.color,
});

export const SortButton = styled(IconButton)({
  display: 'flex',
  flexDirection: 'column',
  padding: 0,
  '& svg': {
    margin: '-0.9rem 0',
  },
  marginRight: '2.4rem',
  fontSize: '2.4rem',
  color: theme.main.button.disabled.color,
});

export const SortButtonContainer = styled('div')({
  display: 'flex',
});

export const AscendingIcon = styled(ArrowDropUp)({
  color: theme.main.backgroundColor,
});

export const DescendingIcon = styled(ArrowDropDown)({
  color: theme.main.backgroundColor,
});
