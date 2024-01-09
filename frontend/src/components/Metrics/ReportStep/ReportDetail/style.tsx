import { styled } from '@mui/material/styles';
import { Button } from '@mui/material';
import { theme } from '@src/theme';
import { Z_INDEX } from '@src/constants/commons';
import { basicButtonStyle } from '@src/components/Metrics/ReportStep/style';

export const ExportButton = styled(Button)({
  ...basicButtonStyle,
  width: '12rem',
  backgroundColor: theme.main.backgroundColor,
  color: theme.main.color,
  '&:hover': {
    ...basicButtonStyle,
    backgroundColor: theme.main.backgroundColor,
    color: theme.main.color,
  },
});

export const ErrorNotificationContainer = styled('div')({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: Z_INDEX.MODAL_BACKDROP,
  width: '80%',
});
