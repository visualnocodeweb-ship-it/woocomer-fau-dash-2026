import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Container, 
  InputAdornment, 
  IconButton,
  Alert
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, Person } from '@mui/icons-material';

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin321') {
      onLogin();
    } else {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <Box 
      sx={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#000000'
      }}
    >
      <Container maxWidth="xs">
        <Paper 
          elevation={0} 
          sx={{ 
            p: 5, 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #1f1f1f',
            borderRadius: 6,
            textAlign: 'center'
          }}
        >
          <Typography 
            variant="h4" 
            sx={{ 
              fontFamily: '"Orbitron", sans-serif', 
              fontWeight: 800, 
              color: '#bcff00', 
              mb: 1,
              letterSpacing: '1px'
            }}
          >
            PESCA • DASH
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
            Inicia sesión para continuar
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#ff5252' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              variant="outlined"
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 4 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button 
              fullWidth 
              variant="contained" 
              type="submit"
              sx={{ 
                py: 1.5, 
                fontSize: '1rem', 
                boxShadow: '0 0 20px rgba(188, 255, 0, 0.2)' 
              }}
            >
              Entrar
            </Button>
          </form>
          
          <Typography variant="caption" sx={{ display: 'block', mt: 4, color: '#333' }}>
            PESCA NEUQUÉN • 2026
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default LoginPage;
