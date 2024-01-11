import { theme } from '@src/theme';
import styled from '@emotion/styled';
import { Typography } from '@mui/material';

export const StyledReportCard = styled.div({
  position: 'relative',
  padding: '0.8rem 1.5rem 0.8rem 1.5rem',
  height: '6.5rem',
  borderRadius: '1rem',
  border: theme.main.cardBorder,
  background: theme.main.color,
  boxShadow: theme.main.cardShadow,
});

export const StyledItemSection = styled.div({
  display: 'flex',
  alignItems: 'center',
  minWidth: '25%',
  padding: '0.75rem 0',
});

export const StyledReportCardTitle = styled(Typography)({
  fontWeight: 500,
  fontSize: '1rem',
});

export const StyledErrorSection = styled.div({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
})

export const StyledImgSection = styled.img({
  height: '4.43rem',
})

export const StyledErrorMessage = styled.div({
  color: '#A2A2A2',
  fontSize: '0.875rem',
})
