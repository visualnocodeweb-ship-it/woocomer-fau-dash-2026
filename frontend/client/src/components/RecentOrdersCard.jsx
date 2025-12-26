import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Paper, Box, Typography, CircularProgress, Grid } from '@mui/material';
import UpdateIcon from '@mui/icons-material/Update';

function RecentOrdersCard() {
  const [recentCount, setRecentCount] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || '';

  const fetchRecentOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/orders/count?after_date=2025-10-15`);
      setRecentCount(response.data.total_completed);
    } catch (error) {
      console.error('Error fetching recent orders count:', error);
      setRecentCount('Error');
    }
  };

  useEffect(() => {
    fetchRecentOrders();
    const intervalId = setInterval(fetchRecentOrders, 120000); // Update every 2 minutes
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
                <Box sx={{ backgroundColor: '#00796B', borderRadius: '50%', p: 1.5 }}>
                    <UpdateIcon sx={{ fontSize: 32, color: 'white' }} />
                </Box>
            </Grid>
            <Grid item xs>
                <Typography 
                    variant="subtitle1" 
                    sx={{ fontWeight: 'bold', color: '#B0BEC5' }}
                >
                  Permisos desde 15/10/2025:
                </Typography>
                <Typography 
                    variant="h4" 
                    component="div" 
                    sx={{ fontWeight: 'bold' }}
                >
                  {recentCount !== null && recentCount !== 'Error'
                      ? recentCount.toLocaleString('es-AR')
                      : <CircularProgress color="inherit" size={28} />}
                </Typography>
            </Grid>
        </Grid>
    </Paper>
  );
}

export default RecentOrdersCard;
