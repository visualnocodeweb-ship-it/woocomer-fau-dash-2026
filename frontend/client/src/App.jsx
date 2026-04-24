import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  CssBaseline,
  Toolbar,
  Typography,
  Chip,
  useTheme,
  useMediaQuery,
  Button
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';

function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Check if already logged in on mount
  useEffect(() => {
    const auth = localStorage.getItem('isLoggedIn');
    if (auth === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    navigate('/');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    navigate('/');
  };

  if (!isLoggedIn) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <CssBaseline />
        <Routes>
          <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
        </Routes>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <CssBaseline />
      <AppBar position="fixed" elevation={0}>
        <Toolbar>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ fontWeight: 800, letterSpacing: '1px', fontFamily: "'Orbitron', sans-serif" }}
          >
            {isMobile ? 'PESCA • DASH' : 'PESCA • DASHBOARD'}
          </Typography>
          <Box sx={{ flexGrow: 1 }} /> 
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
             {!isMobile && (
               <Chip 
                 label="MODO ADMINISTRADOR" 
                 sx={{ 
                   fontWeight: 800, 
                   fontSize: '0.65rem',
                   backgroundColor: '#bcff00', 
                   color: '#000000',
                   height: 24
                 }} 
               />
             )}
             <Button 
                variant="outlined" 
                color="inherit" 
                size="small" 
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ borderRadius: 10, borderColor: 'rgba(255,255,255,0.1)' }}
             >
                Salir
             </Button>
             <img src="/guardafauna-1.png" alt="Guardafauna Logo" style={{ height: '40px' }} />
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: 'background.default', p: 0, width: '100%' }}
      >
        <Toolbar /> 
        <Routes>
          <Route path="*" element={<DashboardPage />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
