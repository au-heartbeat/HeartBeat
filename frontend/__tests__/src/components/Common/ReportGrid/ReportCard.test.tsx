import React from 'react';
import { render, screen } from '@testing-library/react';
import { ReportCard } from '@src/components/Common/ReportGrid/ReportCard';

describe('Report Card', () => {
  it('should not show exceeding items', () => {
    const items = [
      {
        value: 1,
        subtitle: 'PR Lead Time',
      },
      {
        value: 2,
        subtitle: 'Pipeline Lead Time',
      },
      {
        value: 3,
        subtitle: 'Total Lead Time',
      },
    ];

    const { getByText, queryByText } = render(<ReportCard title={'card'} items={items} xs={6} errorMessage={''} />)

    expect(screen.getByText('1.00')).toBeInTheDocument();
    expect(screen.getByText('2.00')).toBeInTheDocument();
    expect(screen.queryByText('3.00')).not.toBeInTheDocument();
  });
});
