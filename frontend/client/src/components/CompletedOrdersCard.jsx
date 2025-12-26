import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Paper, Box, Typography, CircularProgress, Grid } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

function CompletedOrdersCard() {
  const [completedCount, setCompletedCount] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || '';

  const fetchCompletedOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/orders/count`);
      setCompletedCount(response.data.total_completed);
    } catch (error) {
      console.error('Error fetching completed orders count:', error);
      setCompletedCount('Error');
    }
  };

  useEffect(() => {
    fetchCompletedOrders();
    const intervalId = setInterval(fetchCompletedOrders, 120000); // Update every 2 minutes
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
                <Box sx={{ backgroundColor: '#1976D2', borderRadius: '50%', p: 1.5 }}>
                    <ReceiptLongIcon sx={{ fontSize: 32, color: 'white' }} />
                </Box>
            </Grid>
            <Grid item xs>
                <Typography 
                    variant="subtitle1" 
                    sx={{ fontWeight: 'bold', color: '#B0BEC5' }}
                >
                    Cantidad Total de Permisos:
                </Typography>
                <Typography 
                    variant="h4" 
                    component="div" 
                    sx={{ fontWeight: 'bold' }}
                >
                  {completedCount !== null && completedCount !== 'Error'
                      ? completedCount.toLocaleString('es-AR')
                      : <CircularProgress color="inherit" size={28} />}
                </Typography>
            </Grid>
        </Grid>
    </Paper>
  );
}

export default CompletedOrdersCard;
