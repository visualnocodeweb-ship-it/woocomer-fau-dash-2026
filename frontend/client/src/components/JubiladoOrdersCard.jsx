import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Paper, Box, Typography, CircularProgress, Grid } from '@mui/material';
import ElderlyIcon from '@mui/icons-material/Elderly';

function JubiladoOrdersCard() {
  const [count, setCount] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || '';

  const fetchJubiladoOrders = async () => {
    try {
      const params = new URLSearchParams({
        before_date: '2025-10-15',
        line_item_name: 'Permiso residentes país mayores de 65 años, jubilados y pensionados',
        total: 0
      });
      const response = await axios.get(`${API_URL}/api/orders/count?${params.toString()}`);
      setCount(response.data.total_completed);
    } catch (error) {
      console.error('Error fetching jubilado orders count:', error);
      setCount('Error');
    }
  };

  useEffect(() => {
    fetchJubiladoOrders();
    const intervalId = setInterval(fetchJubiladoOrders, 120000); // Update every 2 minutes
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Paper 
        elevation={4} 
        sx={{ 
            p: 3, 
            borderRadius: 2, 
            backgroundColor: '#263238', // Dark Charcoal
            color: 'white',
            height: '100%'
        }}
    >
        <Grid container spacing={2} alignItems="center" wrap="nowrap">
            <Grid item>
                <Box sx={{ backgroundColor: '#607D8B', borderRadius: '50%', p: 1.5 }}>
                    <ElderlyIcon sx={{ fontSize: 32, color: 'white' }} />
                </Box>
            </Grid>
            <Grid item xs>
                <Typography 
                    variant="subtitle1" 
                    sx={{ fontWeight: 'bold', color: '#B0BEC5' }}
                >
                  Permisos Jubilado (Sin cargo, antes de 15/10/25):
                </Typography>
                <Typography 
                    variant="h4" 
                    component="div" 
                    sx={{ fontWeight: 'bold' }}
                >
                  {count !== null && count !== 'Error'
                      ? count.toLocaleString('es-AR')
                      : <CircularProgress color="inherit" size={28} />}
                </Typography>
            </Grid>
        </Grid>
    </Paper>
  );
}

export default JubiladoOrdersCard;
