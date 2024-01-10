import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { theme } from '@src/theme';

export const BasicButton = styled(Button)({
  width: '3rem',
  fontSize: '0.8rem',
  fontFamily: theme.main.font.secondary,
  fontWeight: 'bold',
});

export const VerifyButton = styled(BasicButton)({});
export const ResetButton = styled(BasicButton)({
  color: '#f44336',
  marginLeft: '0.5rem',
});
