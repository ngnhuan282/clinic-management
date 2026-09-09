import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
    button: {
      textTransform: 'none',
    },
  },
  palette: {
    primary: {
      main: '#005dac', // from DESIGN.md
      dark: '#004a8f',
      light: '#eff6ff',
    },
    text: {
      primary: '#1f2937', // textHeading
      secondary: '#6b7280', // textMuted
    },
    background: {
      default: '#f6fafe', // background
      paper: '#ffffff', // surface-card
    },
    success: {
      main: '#16a34a',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
  },
});

export default theme;
