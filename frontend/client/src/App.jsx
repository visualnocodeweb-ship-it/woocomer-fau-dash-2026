import React from 'react';
import { Routes, Route, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  AppBar,
  CssBaseline,
  Toolbar,
  Typography,
  Button,
  Chip,
  useTheme,
  useMediaQuery,
  IconButton
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout'; // Added LogoutIcon

import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage'; // Restored LoginPage import
import ProtectedRoute from './auth/ProtectedRoute'; // Restored ProtectedRoute import
import { useAuth } from './auth/AuthContext'; // Restored useAuth import
import { supabase } from './supabaseClient'; // Restored supabase import


function App() {
  const { session } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            {isMobile ? 'Dashboard' : 'Dashboard de Permisos'}
          </Typography>
          <Box sx={{ flexGrow: 1 }} /> {/* This spacer pushes everything to the right */}
          {session ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
              {!isMobile && <Chip label={session.user.email} color="info" />}
              {isMobile ? (
                <IconButton color="inherit" onClick={handleLogout} aria-label="Cerrar Sesión">
                  <LogoutIcon />
                </IconButton>
              ) : (
                <Button color="inherit" onClick={handleLogout}>
                  Cerrar Sesión
                </Button>
              )}
              <img src="/guardafauna-1.png" alt="Guardafauna Logo" style={{ height: '40px' }} />
            </Box>
          ) : (
            <Button color="inherit" component={RouterLink} to="/login">
              Iniciar Sesión
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3, width: '100%' }}
      >
        <Toolbar /> {/* This is to offset the content below the AppBar */}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
