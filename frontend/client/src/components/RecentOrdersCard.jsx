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
        elevation={0} 
        sx={{ 
            p: 3, 
            backgroundColor: '#0f0f0f',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 5,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              borderColor: 'rgba(188, 255, 0, 0.3)',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5), 0 0 20px rgba(188, 255, 0, 0.05)'
            }
        }}
    >
        <Grid container spacing={2} alignItems="center" wrap="nowrap">
            <Grid item>
                <Box sx={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '12px', 
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(255, 255, 255, 0.1)'
                }}>
                    <UpdateIcon sx={{ fontSize: 32, color: '#000000' }} />
                </Box>
            </Grid>
            <Grid item xs>
                <Typography 
                    variant="caption" 
                    sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '1.5px' }}
                >
                  Nuevos Permisos
                </Typography>
                <Typography 
                    variant="h3" 
                    component="div" 
                    sx={{ fontWeight: 900, color: '#ffffff', mt: 0.5, lineHeight: 1 }}
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
