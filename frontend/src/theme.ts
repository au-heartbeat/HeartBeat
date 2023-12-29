import { createTheme } from '@mui/material/styles'
import { indigo } from '@mui/material/colors'
import { FIVE_HUNDRED } from '@src/constants/commons'
import '@fontsource/roboto'

declare module '@mui/material/styles' {
  interface Theme {
    main: {
      backgroundColor: string
      color: string
      secondColor: string
      fontSize: string
      boxShadow: string
      cardShadow: string
      cardBorder: string
      font: {
        primary: string
        secondary: string
      }
      button: {
        disabled: {
          backgroundColor: string
          color: string
        }
      }
    }
  }

  // allow configuration using `createTheme`
  interface ThemeOptions {
    main: {
      backgroundColor: string
      color: string
      secondColor: string
      fontSize: string
      boxShadow: string
      cardShadow: string
      cardBorder: string
      font: {
        primary: string
        secondary: string
      }
      button: {
        disabled: {
          backgroundColor: string
          color: string
        }
      }
    }
  }

  interface Components {
    errorMessage: {
      color: string
      paddingBottom: string
    }
    waringMessage: {
      color: string
    }
    tip: {
      color: string
    }
  }
}

export const theme = createTheme({
  palette: {
    primary: {
      main: indigo[FIVE_HUNDRED],
    },
    secondary: {
      main: indigo[FIVE_HUNDRED],
      dark: '#f7f7f7',
      contrastText: '#000000A6',
    },
    info: {
      main: '#3498db',
      light: '#b9c4cc',
    },
  },
  main: {
    backgroundColor: indigo[FIVE_HUNDRED],
    color: '#fff',
    secondColor: 'black',
    fontSize: '1rem',
    boxShadow:
      '0 0.2rem 0.1rem -0.1rem rgb(0 0 0 / 20%), 0 0.1rem 0.1rem 0 rgb(0 0 0 / 14%), 0 0.1rem 0.3rem 0 rgb(0 0 0 / 12%)',
    cardShadow: '0 0.013rem 1rem 0 rgba(0, 0, 0, 0.08);',
    cardBorder: '0.063rem solid rgba(0, 0, 0, 0.10);',
    font: {
      primary: 'Roboto',
      secondary: 'sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, Arial',
    },
    button: {
      disabled: {
        backgroundColor: '#E0E0E0',
        color: '#929292',
      },
    },
  },
  typography: {
    button: {
      textTransform: 'none',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
    keys: ['xs', 'sm', 'md', 'lg', 'xl'],
  },
  components: {
    errorMessage: {
      color: '#ff0000',
      paddingBottom: '1rem',
    },
    waringMessage: {
      color: '#cd5e32',
    },
    tip: {
      color: '#ED6D03CC',
    },
  },
})
