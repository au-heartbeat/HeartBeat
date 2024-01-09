import React from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MultiAutoComplete from '@src/components/Common/MultiAutoComplete'
import { act } from 'react-dom/test-utils'
import { ALL, AUTOCOMPLETE_SELECT_ACTION, MOCK_AUTOCOMPLETE_LIST } from '../../../fixtures'

describe('MultiAutoComplete', () => {
  const optionList = ['Option 1', 'Option 2', 'Option 3']
  const selectedOption = ['Option 1']
  const onChangeHandler = jest.fn()
  const isSelectAll = false
  const textFieldLabel = 'Select Options'
  const isError = false
  const testId = 'multi-auto-complete'
  const setup = () =>
    render(
      <MultiAutoComplete
        optionList={optionList}
        selectedOption={selectedOption}
        onChangeHandler={onChangeHandler}
        isSelectAll={isSelectAll}
        textFieldLabel={textFieldLabel}
        isError={isError}
        testId={testId}
      />
    )

  it('renders the component', () => {
    const { getByTestId } = setup()

    expect(getByTestId(testId)).toBeInTheDocument()
  })

  it('When passed selectedoption changed, the correct option would be displayed', async () => {
    const { getByRole } = setup()

    expect(getByRole('button', { name: 'Option 1' })).toBeVisible()
  })

  it('When user select All option, all options in drop box would be selected', async () => {
    const { getByRole } = setup()

    const inputField = getByRole('combobox')
    await act(async () => {
      await userEvent.click(inputField)
    })
    const allOption = getByRole('option', { name: 'All' })
    await act(async () => {
      await userEvent.click(allOption)
    })

    expect(onChangeHandler).toHaveBeenCalledWith(
      expect.anything(),
      [MOCK_AUTOCOMPLETE_LIST[0], ALL],
      AUTOCOMPLETE_SELECT_ACTION,
      {
        option: ALL,
      }
    )
  })
})
