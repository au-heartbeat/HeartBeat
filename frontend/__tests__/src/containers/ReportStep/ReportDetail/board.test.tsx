import { ReportResponseDTO } from '@src/clients/report/dto/response';
import { render, screen, within } from '@testing-library/react';
import { BoardDetail } from '@src/containers/ReportStep/ReportDetail';
import { reportMapper } from '@src/hooks/reportMapper/report';
import React from 'react';

jest.mock('@src/hooks/reportMapper/report');

describe('board', () => {
  const data: ReportResponseDTO = {} as ReportResponseDTO;

  afterEach(jest.clearAllMocks);

  it('should render a back link', () => {
    (reportMapper as jest.Mock).mockReturnValue({});
    render(<BoardDetail data={data} onBack={jest.fn()} />);
    expect(screen.getByTestId('ArrowBackIcon')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  describe('Velocity', () => {
    it('should show velocity when velocity data is existing', () => {
      (reportMapper as jest.Mock).mockReturnValue({
        velocityList: [
          { id: 0, name: 'name1', valueList: [{ value: 1 }] },
          { id: 1, name: 'name2', valueList: [{ value: 2 }] },
        ],
      });
      render(<BoardDetail data={data} onBack={jest.fn()} />);
      const velocityTable = screen.getByTestId('Velocity');
      expect(screen.getByText('Velocity')).toBeInTheDocument();
      expect(velocityTable).toBeInTheDocument();
      expect(within(velocityTable).queryAllByTestId('tr').length).toBe(2);
    });

    it('should not show velocity when velocity data is not existing', () => {
      (reportMapper as jest.Mock).mockReturnValue({
        velocityList: null,
      });
      render(<BoardDetail data={data} onBack={jest.fn()} />);
      expect(screen.queryAllByText('Velocity').length).toEqual(0);
    });
  });

  describe('Cycle Time', () => {
    it('should show cycle time when cycle time data is existing', () => {
      (reportMapper as jest.Mock).mockReturnValue({
        cycleTimeList: [
          { id: 0, name: 'name1', valueList: [{ value: 1 }] },
          { id: 1, name: 'name2', valueList: [{ value: 2 }] },
          { id: 2, name: 'name3', valueList: [{ value: 3 }] },
        ],
      });
      render(<BoardDetail data={data} onBack={jest.fn()} />);
      const cycleTimeTable = screen.getByTestId('Cycle Time');
      expect(screen.getByText('Cycle Time')).toBeInTheDocument();
      expect(cycleTimeTable).toBeInTheDocument();
      expect(within(cycleTimeTable).queryAllByTestId('tr').length).toBe(3);
    });

    it('should not show cycle time when cycle time data is not existing', () => {
      (reportMapper as jest.Mock).mockReturnValue({
        cycleTimeList: null,
      });
      render(<BoardDetail data={data} onBack={jest.fn()} />);
      expect(screen.queryAllByText('Cycle Time').length).toEqual(0);
    });
  });

  describe('Classification', () => {
    it('should show classifications when classifications data is existing', () => {
      (reportMapper as jest.Mock).mockReturnValue({
        classification: [
          { id: 0, name: 'name1', valuesList: [{ name: 'test1', value: 1 }] },
          { id: 1, name: 'name2', valuesList: [{ name: 'test2', value: 2 }] },
          { id: 2, name: 'name3', valuesList: [{ name: 'test3', value: 3 }] },
          { id: 3, name: 'name4', valuesList: [{ name: 'test4', value: 4 }] },
        ],
      });

      render(<BoardDetail data={data} onBack={jest.fn()} />);
      const classificationTable = screen.getByTestId('Classification');
      expect(screen.getByText('Classification')).toBeInTheDocument();
      expect(classificationTable).toBeInTheDocument();
      expect(within(classificationTable).queryAllByTestId('tr').length).toBe(8);
    });

    it('should not show classifications when classifications data is not existing', () => {
      (reportMapper as jest.Mock).mockReturnValue({
        classification: null,
      });
      render(<BoardDetail data={data} onBack={jest.fn()} />);
      expect(screen.queryAllByText('Classification').length).toEqual(0);
    });
  });

  it('should show all data when all data is existing', () => {
    (reportMapper as jest.Mock).mockReturnValue({
      velocityList: [{ id: 0, name: 'name1', valueList: [{ value: 1 }] }],
      cycleTimeList: [
        { id: 0, name: 'name1', valueList: [{ value: 1 }] },
        { id: 1, name: 'name2', valueList: [{ value: 2 }] },
      ],
      classification: [
        { id: 0, name: 'name1', valuesList: [{ name: 'test1', value: 1 }] },
        { id: 1, name: 'name2', valuesList: [{ name: 'test2', value: 2 }] },
        { id: 2, name: 'name3', valuesList: [{ name: 'test3', value: 3 }] },
      ],
    });
    render(<BoardDetail data={data} onBack={jest.fn()} />);
    const velocityTable = screen.getByTestId('Velocity');
    const cycleTimeTable = screen.getByTestId('Cycle Time');
    const classificationTable = screen.getByTestId('Classification');
    expect(screen.getByText('Velocity')).toBeInTheDocument();
    expect(velocityTable).toBeInTheDocument();
    expect(screen.getByText('Cycle Time')).toBeInTheDocument();
    expect(cycleTimeTable).toBeInTheDocument();
    expect(screen.getByText('Classification')).toBeInTheDocument();
    expect(classificationTable).toBeInTheDocument();

    expect(within(velocityTable).queryAllByTestId('tr').length).toBe(1);
    expect(within(cycleTimeTable).queryAllByTestId('tr').length).toBe(2);
    expect(within(classificationTable).queryAllByTestId('tr').length).toBe(6);
  });
});
