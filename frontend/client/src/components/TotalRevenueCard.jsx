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
        elevation={0} 
        sx={{ 
            p: 3, 
            height: '100%',
            backgroundColor: '#0f0f0f',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            transition: 'transform 0.2s ease-in-out, border-color 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              borderColor: 'rgba(188, 255, 0, 0.3)',
            }
        }}
    >
        <Grid container spacing={2} alignItems="center" wrap="nowrap">
            <Grid item>
                <Box sx={{ 
                  backgroundColor: '#bcff00', 
                  borderRadius: '12px', 
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(188, 255, 0, 0.2)'
                }}>
                    <MonetizationOnIcon sx={{ fontSize: 32, color: '#000000' }} />
                </Box>
            </Grid>
            <Grid item xs>
                <Typography 
                    variant="caption" 
                    sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '1.5px' }}
                >
                  Recaudación Total
                </Typography>
                <Typography 
                    variant="h3" 
                    component="div" 
                    sx={{ fontWeight: 900, color: '#ffffff', mt: 0.5, lineHeight: 1 }}
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
