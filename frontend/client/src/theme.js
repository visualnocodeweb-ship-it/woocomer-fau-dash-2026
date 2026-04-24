import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#bcff00', // LemonCash Lime
      light: '#d4ff5e',
      dark: '#8ebf00',
    },
    secondary: {
      main: '#ffffff',
    },
    background: {
      default: '#000000',
      paper: '#0a0a0a', // Slightly lighter than pure black for depth
    },
    text: {
      primary: '#ffffff', // High contrast
      secondary: '#b3b3b3', // Readable grey
    },
  },
  typography: {
    fontFamily: '"Inter", "system-ui", "-apple-system", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontSize: '1.25rem', fontWeight: 600 },
    h6: { fontSize: '1rem', fontWeight: 600 },
    subtitle1: { fontSize: '1rem', fontWeight: 500, color: '#b3b3b3' },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500, color: '#b3b3b3' },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.57 },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.02em' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "#2b2b2b #000000",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "#000000",
            width: '8px',
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "#2b2b2b",
            minHeight: 24,
            border: "2px solid #000000",
          },
          "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
            backgroundColor: "#bcff00",
          },
          "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active": {
            backgroundColor: "#bcff00",
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#bcff00",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0a0a0a',
          border: '1px solid #1f1f1f',
          borderRadius: 20,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #1f1f1f',
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.9375rem',
        },
        containedPrimary: {
          color: '#000000',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 600,
          textTransform: 'none',
          minHeight: 48,
          '&.Mui-selected': {
            color: '#bcff00',
          },
        },
      },
    },
  },
});

export default theme;
