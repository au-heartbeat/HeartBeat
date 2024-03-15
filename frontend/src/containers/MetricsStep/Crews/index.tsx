import { AssigneeFilter } from '@src/containers/MetricsStep/Crews/AssigneeFilter';
import { MetricsSettingTitle } from '@src/components/Common/MetricsSettingTitle';
import { IMetricsInitialValues } from '@src/containers/MetricsStep/form/types';
import MultiAutoComplete from '@src/components/Common/MultiAutoComplete';
import { WarningMessage } from '@src/containers/MetricsStep/Crews/style';
import { selectMetricsContent } from '@src/context/Metrics/metricsSlice';
import { useFormikContext, Field } from 'formik';
import { FormHelperText } from '@mui/material';
import { useAppSelector } from '@src/hooks';
import React, { useEffect } from 'react';

interface crewsProps {
  options: string[];
  title: string;
  label: string;
  type?: string;
}

export const Crews = ({ options, title, label, type = 'board' }: crewsProps) => {
  const isBoardCrews = type === 'board';
  const { users, pipelineCrews } = useAppSelector(selectMetricsContent);

  const formikProps = useFormikContext<IMetricsInitialValues>();
  console.log('formikProps', formikProps);
  const selectedUsers = isBoardCrews ? formikProps.values.board.crews : formikProps.values.pipeline.crews;
  const errors = formikProps.errors;
  console.log('errors', errors);
  console.log('selectedUsers', selectedUsers);
  const isEmptyCrewData = selectedUsers.length === 0;
  const isAllSelected = options.length > 0 && formikProps.values.board.crews.length === options.length;

  const handleCrewChange = (_: React.SyntheticEvent, value: string[]) => {
    console.log('[<Crews />] handleCrewChange value =>', value);
    if (value[value.length - 1] === 'All') {
      formikProps.setFieldValue('board.crews', value.length === options.length + 1 ? [] : [...options]);
      return;
    }
    formikProps.setFieldValue('board.crews', [...value]);
  };

  useEffect(() => {
    formikProps.setFieldValue('board.crews', users);
  }, [formikProps, users]);

  useEffect(() => {
    formikProps.setFieldValue('pipeline.crews', pipelineCrews);
  }, [formikProps, pipelineCrews]);

  return (
    <>
      <MetricsSettingTitle title={title} />
      <Field
        name='board.crews'
        component={MultiAutoComplete}
        ariaLabel='Included Crews multiple select'
        optionList={options}
        isError={isEmptyCrewData && isBoardCrews}
        isSelectAll={isAllSelected}
        onChangeHandler={handleCrewChange}
        selectedOption={selectedUsers}
        textFieldLabel={label}
        isBoardCrews={isBoardCrews}
      />
      {isBoardCrews && <AssigneeFilter />}
      <FormHelperText>
        {isEmptyCrewData && isBoardCrews && (
          <WarningMessage>
            {label} is <strong>required</strong>
          </WarningMessage>
        )}
      </FormHelperText>
    </>
  );
};
