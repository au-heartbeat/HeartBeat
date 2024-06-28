import { deploymentFrequencyMapper } from '@src/hooks/reportMapper/deploymentFrequency';

describe('deployment frequency data mapper', () => {
  const mockDeploymentFrequencyRes = {
    avgDeploymentFrequency: {
      name: 'Average',
      deploymentFrequency: 0.4,
    },
    deploymentFrequencyOfPipelines: [
      {
        deployTimes: 1,
        name: 'fs-platform-onboarding',
        step: ' :shipit: deploy to PROD',
        deploymentFrequency: 0.3,
        dailyDeploymentCounts: [
          {
            date: '9/9/2022',
            count: 1,
          },
          {
            date: '9/6/2022',
            count: 1,
          },
          {
            date: '8/18/2022',
            count: 1,
          },
        ],
      },
    ],
    totalDeployTimes: 1,
  };
  it('maps response deployment frequency values to ui display value', () => {
    const expectedDeploymentFrequencyValues = [
      {
        id: 0,
        name: 'fs-platform-onboarding/ :shipit: deploy to PROD',
        valueList: [
          {
            value: '0.30',
          },
          {
            value: '1',
          },
        ],
      },
      {
        id: 1,
        name: 'Average',
        valueList: [
          {
            value: '0.40',
          },
          {
            value: '1',
          },
        ],
      },
    ];
    const mappedDeploymentFrequency = deploymentFrequencyMapper(mockDeploymentFrequencyRes);

    expect(mappedDeploymentFrequency).toEqual(expectedDeploymentFrequencyValues);
  });
});
