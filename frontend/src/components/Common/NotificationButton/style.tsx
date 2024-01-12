import styled from '@emotion/styled';
import { Alert, AlertTitle } from '@mui/material';
import { Z_INDEX } from '@src/constants/commons';
import { theme } from '@src/theme';

export const AlertWrapper = styled(Alert)((props: { backgroundcolor: string; iconcolor: string }) => ({
  backgroundColor: props.backgroundcolor,
  position: 'fixed',
  zIndex: Z_INDEX.FIXED,
  top: '4.75rem',
  right: '0.75rem',
  padding: '0.75rem 1.5rem',
  '& .MuiAlert-action': {
    padding: '0',
  },
  '& .MuiAlert-message': {
    width: '16.25rem',
  },
  '& .MuiAlert-icon': {
    color: props.iconcolor,
  },
}));

export const AlertTitleWrapper = styled(AlertTitle)({
  color: theme.main.alert.title.color,
  marginBottom: '0.5rem',
});
