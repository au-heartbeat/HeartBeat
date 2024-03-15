import {
  selectReworkTimesSettings,
  updateReworkTimesSettings,
  selectCycleTimeSettings,
} from '@src/context/Metrics/metricsSlice';
import { MetricsSettingTitle } from '@src/components/Common/MetricsSettingTitle';
import { METRICS_CONSTANTS, REWORK_TIME_LIST } from '@src/constants/resources';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import MultiAutoComplete from '@src/components/Common/MultiAutoComplete';
import { ReworkHeaderWrapper, ReworkSettingsWrapper } from './style';
import { StyledLink } from '@src/containers/MetricsStep/style';
import { useAppDispatch, useAppSelector } from '@src/hooks';
import { SingleSelection } from './SingleSelection';
import React, { useEffect, useMemo } from 'react';

const url = 'XXX';

function ReworkSettings() {
  const reworkTimesSettings = useAppSelector(selectReworkTimesSettings);
  const cycleTimeSettings = useAppSelector(selectCycleTimeSettings);
  const dispatch = useAppDispatch();
  const boardingMappingStatus = useMemo(() => {
    return [...new Set(cycleTimeSettings.map((item) => item.value))];
  }, [cycleTimeSettings]);

  const boardingMappingHasDoneStatus = boardingMappingStatus.includes(METRICS_CONSTANTS.doneValue);
  const singleOptions = boardingMappingStatus
    .filter((item) => item !== METRICS_CONSTANTS.doneValue && item !== METRICS_CONSTANTS.cycleTimeEmptyStr)
    .sort((a, b) => {
      return REWORK_TIME_LIST.indexOf(a) - REWORK_TIME_LIST.indexOf(b);
    });

  const multiOptions = reworkTimesSettings.rework2State
    ? [
        ...singleOptions.slice(singleOptions.indexOf(reworkTimesSettings.rework2State as string) + 1),
        ...(boardingMappingHasDoneStatus ? [METRICS_CONSTANTS.doneValue] : []),
      ]
    : [];

  const isAllSelected = multiOptions.length > 0 && reworkTimesSettings.excludeStates.length === multiOptions.length;

  const handleReworkSettingsChange = (_: React.SyntheticEvent, value: string[]) => {
    let selectValue = value;
    if (value[value.length - 1] === 'All') {
      selectValue = reworkTimesSettings.excludeStates.length === multiOptions.length ? [] : multiOptions;
    }
    dispatch(updateReworkTimesSettings({ ...reworkTimesSettings, excludeStates: selectValue }));
  };

  useEffect(() => {
    dispatch(updateReworkTimesSettings({ excludeStates: [], rework2State: null }));
  }, [boardingMappingStatus, dispatch]);

  return (
    <>
      <ReworkHeaderWrapper>
        <MetricsSettingTitle title='Rework times settings' />
        <StyledLink underline='none' href={url} target='_blank' rel='noopener'>
          <HelpOutlineOutlinedIcon fontSize='small' />
          How to setup
        </StyledLink>
      </ReworkHeaderWrapper>
      <ReworkSettingsWrapper>
        <SingleSelection
          options={singleOptions}
          label={'Rework to which state'}
          value={reworkTimesSettings.rework2State}
          onValueChange={(newValue: string) =>
            dispatch(updateReworkTimesSettings({ excludeStates: [], rework2State: newValue }))
          }
        />
        <MultiAutoComplete
          testId='rework-settings-exclude-selection'
          ariaLabel='Exclude which states (optional)'
          disabled={!reworkTimesSettings.rework2State}
          optionList={multiOptions}
          isError={false}
          isSelectAll={isAllSelected}
          onChangeHandler={handleReworkSettingsChange}
          selectedOption={reworkTimesSettings.excludeStates}
          textFieldLabel={'Exclude which states (optional)'}
          isBoardCrews={false}
        />
      </ReworkSettingsWrapper>
    </>
  );
}

export default ReworkSettings;
