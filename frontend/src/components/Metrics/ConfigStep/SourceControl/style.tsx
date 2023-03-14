import { styled } from '@mui/material/styles'
import { FormControl, TextField } from '@mui/material'

export const SourceControlSection = styled('div')({
  position: 'relative',
  boxShadow:
    '0 0.125rem 0.0625rem -0.0625rem rgb(0 0 0 / 20%), 0 0.125rem 0.25rem 0 rgb(0 0 0 / 14%), 0 0.0625rem 0.1875rem 0 rgb(0 0 0 / 12%);',
  borderRadius: '0.25rem',
  width: '85%',
  margin: '1rem 0',
  padding: '1rem',
  fontSize: '1rem',
  lineHeight: '2rem',
})

export const SourceControlTitle = styled('h2')({
  margin: '0 1rem',
  fontSize: '1.5rem',
})

export const SourceControlForm = styled('form')({
  margin: '1rem',
})

export const SourceControlTypeSelections = styled(FormControl)({
  width: '20rem',
  margin: '0 4rem 1rem 0',
})

export const SourceControlTextField = styled(TextField)({
  width: '20rem',
  margin: '0 4rem 1rem 0',
  padding: '0.5rem 0',
})

export const SourceControlButtonGroup = styled('div')({
  display: 'flex',
  justifyContent: 'flex-end',
  padding: '1rem',
  gap: '1rem',
})
