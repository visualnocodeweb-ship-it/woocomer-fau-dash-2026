import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Paper, Box, Typography, CircularProgress, Grid, IconButton } from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

function TotalRevenueCard() {
  const [totalRevenue, setTotalRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false); // State for visibility
  const API_URL = import.meta.env.VITE_API_URL || '';

  const fetchTotalRevenue = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/stats/total_revenue`);
      setTotalRevenue(response.data.total_revenue);
    } catch (error) {
      console.error('Error fetching total revenue:', error);
      setTotalRevenue('Error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  useEffect(() => {
    fetchTotalRevenue(); // Initial fetch
    const intervalId = setInterval(fetchTotalRevenue, 120000); // Refresh every 2 minutes
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array means it runs once on mount and cleans up on unmount

  return (
    <Paper 
        elevation={4} 
        sx={{ 
            p: 3, 
            borderRadius: 2, 
            backgroundColor: '#263238', 
            color: 'white',
            height: '100%'
        }}
    >
        <Grid container spacing={2} alignItems="center" wrap="nowrap">
            <Grid item>
                <Box sx={{ backgroundColor: '#4CAF50', borderRadius: '50%', p: 1.5 }}>
                    <MonetizationOnIcon sx={{ fontSize: 32, color: 'white' }} />
                </Box>
            </Grid>
            <Grid item xs>
                <Typography 
                    variant="subtitle1" 
                    sx={{ fontWeight: 'bold', color: '#B0BEC5' }}
                >
                  Recaudación Total:
                </Typography>
                <Typography 
                    variant="h4" 
                    component="div" 
                    sx={{ fontWeight: 'bold' }}
                >
                  {isVisible ? (
                    loading ? <CircularProgress color="inherit" size={28} /> : (
                      totalRevenue !== null && totalRevenue !== 'Error'
                        ? `$ ${parseFloat(totalRevenue).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : 'Error'
                    )
                  ) : '••••••••'}
                </Typography>
            </Grid>
            <Grid item>
                <IconButton onClick={handleToggleVisibility} sx={{ color: 'white' }}>
                    {isVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
            </Grid>
        </Grid>
    </Paper>
  );
}

export default TotalRevenueCard;
