import { Autocomplete, Box, ListItemText, TextField } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { FormControlWrapper } from './style'
import { getEmojiUrls, removeExtraEmojiName } from '@src/emojis/emoji'
import { EmojiWrap, StyledAvatar } from '@src/emojis/style'

interface Props {
  options: string[]
  label: string
  value: string
  id: number
  onGetSteps?: (pipelineName: string) => void
  step?: string
  onUpDatePipeline: (id: number, label: string, value: string) => void
}

/* istanbul ignore next */
export const SingleSelection = ({ options, label, value, id, onGetSteps, step, onUpDatePipeline }: Props) => {
  const labelId = `single-selection-${label.toLowerCase().replace(' ', '-')}`
  const [selectedOptions, setSelectedOptions] = useState(value)
  const [inputValue, setInputValue] = useState<string>(value)

  const handleSelectedOptionsChange = (value: string) => {
    setSelectedOptions(value)
    if (onGetSteps) {
      onUpDatePipeline(id, 'Step', '')
      onGetSteps(value)
    }
    onUpDatePipeline(id, label, value)
  }

  useEffect(() => {
    if (onGetSteps && !!selectedOptions && !step) {
      onGetSteps(selectedOptions)
    }
  }, [])

  const emojiView = (pipelineStepName: string) => {
    const emojiUrls: string[] = getEmojiUrls(pipelineStepName)
    return emojiUrls.map((url) => <StyledAvatar key={url} src={url} />)
  }

  return (
    <>
      <FormControlWrapper variant='standard' required>
        <Autocomplete
          disableClearable
          data-test-id={labelId}
          options={options}
          getOptionLabel={(option: string) => removeExtraEmojiName(option).trim()}
          renderOption={(props, option: string) => (
            <Box component='li' {...props}>
              <EmojiWrap>
                {emojiView(option)}
                <ListItemText primary={removeExtraEmojiName(option)} data-test-id={'single-option'} />
              </EmojiWrap>
            </Box>
          )}
          value={value}
          onChange={(event, newValue: string) => {
            handleSelectedOptionsChange(newValue)
          }}
          inputValue={inputValue}
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue)
          }}
          renderInput={(params) => <TextField required {...params} label={label} variant='standard' />}
        />
      </FormControlWrapper>
    </>
  )
}
