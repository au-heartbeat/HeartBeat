import { CircularProgress } from '@mui/material';
import { LoadingDrop, LoadingTypography } from './style';

export type Placement = 'start' | 'center';

export interface LoadingProps {
  message?: string;
  size?: string;
  backgroundColor?: string;
  placement?: Placement;
}

export const Loading = ({ message, size = '8rem', backgroundColor, placement = 'center' }: LoadingProps) => {
  return (
    <LoadingDrop placement={placement} open style={{ backgroundColor: backgroundColor }}>
      <CircularProgress size={size} data-testid='loading-page' />
      {message && <LoadingTypography>{message}</LoadingTypography>}
    </LoadingDrop>
  );
};
