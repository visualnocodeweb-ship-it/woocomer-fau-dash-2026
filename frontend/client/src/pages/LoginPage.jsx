import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Button, Container, Box, Typography, Paper, TextField, Alert, Link, CircularProgress } from '@mui/material';
import { FaGoogle } from 'react-icons/fa';

function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isSignUp) {
      // Sign Up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError("El usuario ya existe. Intenta iniciar sesión.");
      } else {
        setMessage('¡Registro exitoso! Por favor, revisa tu correo para confirmar tu cuenta.');
      }
    } else {
      // Sign In
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      }
    }
    setLoading(false);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <img src="/guardafauna-1.png" alt="Guardafauna Logo" style={{ width: '100%', maxWidth: '300px', marginBottom: '1rem', backgroundColor: 'white', padding: '10px', borderRadius: '8px' }} />

        <Paper elevation={6} sx={{ p: 4, width: '100%', backgroundColor: '#263238', color: 'white' }}>
          <Typography component="h1" variant="h5" align="center" sx={{ mb: 3 }}>
            {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

          <Box component="form" onSubmit={handleEmailAuth} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Dirección de Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputLabelProps={{ style: { color: '#B0BEC5' } }}
              sx={{ '& .MuiInputBase-root': { color: 'white' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#546E7A' } }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputLabelProps={{ style: { color: '#B0BEC5' } }}
              sx={{ '& .MuiInputBase-root': { color: 'white' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#546E7A' } }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2, height: '48px' }}
            >
              {loading ? <CircularProgress size={24} /> : (isSignUp ? 'Registrarse' : 'Iniciar Sesión')}
            </Button>
            
            <Typography variant="body2" align="center" sx={{ my: 2 }}>
              O
            </Typography>

            <Button
              type="button"
              fullWidth
              variant="contained"
              onClick={handleGoogleLogin}
              disabled={loading}
              startIcon={<FaGoogle />}
              sx={{ 
                  backgroundColor: 'white', 
                  color: '#4285F4',
                  '&:hover': { backgroundColor: '#f1f1f1' }
              }}
            >
              Continuar con Google
            </Button>

            <Box textAlign="center" sx={{ mt: 3 }}>
              <Link href="#" variant="body2" onClick={(e) => { e.preventDefault(); setIsSignUp(!isSignUp); setError(null); setMessage(null); }} sx={{ color: '#90A4AE' }}>
                {isSignUp ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes una cuenta? Regístrate'}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default LoginPage;
