import { render, within, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@src/store';
import userEvent from '@testing-library/user-event';
import { DeploymentFrequencySettings } from '@src/containers/MetricsStep/DeploymentFrequencySettings';
import {
  addADeploymentFrequencySetting,
  deleteADeploymentFrequencySetting,
  updateDeploymentFrequencySettings,
} from '@src/context/Metrics/metricsSlice';
import { DEPLOYMENT_FREQUENCY_SETTINGS, LIST_OPEN, ORGANIZATION, REMOVE_BUTTON } from '../../../fixtures';

jest.mock('@src/hooks', () => ({
  ...jest.requireActual('@src/hooks'),
  useAppDispatch: () => jest.fn(),
}));

jest.mock('@src/context/Metrics/metricsSlice', () => ({
  ...jest.requireActual('@src/context/Metrics/metricsSlice'),
  addADeploymentFrequencySetting: jest.fn(),
  deleteADeploymentFrequencySetting: jest.fn(),
  updateDeploymentFrequencySettings: jest.fn(),
  selectDeploymentFrequencySettings: jest.fn().mockReturnValue([
    { id: 0, organization: '', pipelineName: '', steps: '', branches: [] },
    { id: 1, organization: '', pipelineName: '', steps: '', branches: [] },
  ]),
  selectOrganizationWarningMessage: jest.fn().mockReturnValue(null),
  selectPipelineNameWarningMessage: jest.fn().mockReturnValue(null),
  selectStepWarningMessage: jest.fn().mockReturnValue(null),
  selectMetricsContent: jest.fn().mockReturnValue({ pipelineCrews: [], users: [] }),
}));

jest.mock('@src/context/config/configSlice', () => ({
  ...jest.requireActual('@src/context/config/configSlice'),
  selectPipelineOrganizations: jest.fn().mockReturnValue(['mockOrgName']),
  selectPipelineNames: jest.fn().mockReturnValue(['']),
  selectSteps: jest.fn().mockReturnValue(['']),
  selectBranches: jest.fn().mockReturnValue(['']),
  selectPipelineCrews: jest.fn().mockReturnValue(['']),
}));

const mockValidationCheckContext = {
  isPipelineValid: jest.fn().mockReturnValue(true),
  getDuplicatedPipeLineIds: jest.fn().mockReturnValue([]),
};

jest.mock('@src/hooks/useMetricsStepValidationCheckContext', () => ({
  useMetricsStepValidationCheckContext: () => mockValidationCheckContext,
}));

jest.mock('@src/hooks/useGetPipelineToolInfoEffect', () => ({
  useGetPipelineToolInfoEffect: () => ({
    isLoading: false,
    result: {
      code: 200,
      data: {
        pipelineList: [
          {
            id: 'heartbeat',
            name: 'Heartbeat',
            orgId: 'thoughtworks-Heartbeat',
            orgName: 'Thoughtworks-Heartbeat',
            repository: 'git@github.com:au-heartbeat/Heartbeat.git',
            steps: [':pipeline: Upload pipeline.yml'],
          },
        ],
      },
      errorTitle: '',
      errorMessage: '',
    },
  }),
}));

const setup = () =>
  render(
    <Provider store={store}>
      <DeploymentFrequencySettings />
    </Provider>
  );

describe('DeploymentFrequencySettings', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render DeploymentFrequencySettings component', () => {
    const { getByText, getAllByText } = setup();

    expect(getByText(DEPLOYMENT_FREQUENCY_SETTINGS)).toBeInTheDocument();
    expect(getAllByText(ORGANIZATION).length).toBe(2);
  });

  it('should call addADeploymentFrequencySetting function when click add another pipeline button', async () => {
    const { getByTestId } = await setup();

    await act(async () => {
      await userEvent.click(getByTestId('AddIcon'));
    });
    expect(addADeploymentFrequencySetting).toHaveBeenCalledTimes(1);
  });

  it('should call deleteADeploymentFrequencySetting function when click remove pipeline button', async () => {
    const { getAllByRole } = await setup();

    await act(async () => {
      await userEvent.click(getAllByRole('button', { name: REMOVE_BUTTON })[0]);
    });
    expect(deleteADeploymentFrequencySetting).toHaveBeenCalledTimes(1);
  });

  it('should call updateDeploymentFrequencySetting function and clearErrorMessages function when select organization', async () => {
    const { getAllByRole, getByRole } = setup();

    await act(async () => {
      await userEvent.click(getAllByRole('button', { name: LIST_OPEN })[0]);
    });
    const listBox = within(getByRole('listbox'));
    await act(async () => {
      await userEvent.click(listBox.getByText('mockOrgName'));
    });

    expect(updateDeploymentFrequencySettings).toHaveBeenCalledTimes(1);
  });
});
