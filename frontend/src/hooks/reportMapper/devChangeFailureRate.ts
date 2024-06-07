import { ReportDataWithTwoColumns } from '@src/hooks/reportMapper/reportUIDataStructure';
import { DevChangeFailureRateResponse } from '@src/clients/report/dto/response';

export const devChangeFailureRateMapper = ({
  devChangeFailureRateOfPipelines,
  avgDevChangeFailureRate,
}: DevChangeFailureRateResponse) => {
  const mappedDevChangeFailureRateValue: ReportDataWithTwoColumns[] = [];

  devChangeFailureRateOfPipelines.map((item, index) => {
    const devChangeFailureRateValue: ReportDataWithTwoColumns = {
      id: index,
      name: `${item.name}/${item.step}`,
      valueList: [
        {
          value: `${(item.failureRate * 100).toFixed(2)}%(${item.failedTimesOfPipeline}/${item.totalTimesOfPipeline})`,
        },
      ],
    };
    mappedDevChangeFailureRateValue.push(devChangeFailureRateValue);
  });

  mappedDevChangeFailureRateValue.push({
    id: mappedDevChangeFailureRateValue.length,
    name: avgDevChangeFailureRate.name,
    valueList: [
      {
        value: `${(avgDevChangeFailureRate.failureRate * 100).toFixed(2)}`,
      },
    ],
  });

  return mappedDevChangeFailureRateValue;
};
