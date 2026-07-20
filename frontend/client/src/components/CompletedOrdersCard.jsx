import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Paper, Box, Typography, CircularProgress, Grid } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

function CompletedOrdersCard({ count }) {
  const [internalCount, setInternalCount] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || '';
  const displayCount = count ?? internalCount;

  useEffect(() => {
    if (count !== undefined) return;

    const fetchCompletedOrders = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/orders/count`);
        setInternalCount(response.data.total_completed || 0);
      } catch (error) {
        console.error('Error fetching completed orders count:', error);
        setInternalCount('Error');
      }
    };

    fetchCompletedOrders();
    const intervalId = setInterval(fetchCompletedOrders, 120000);
    return () => clearInterval(intervalId);
  }, [count, API_URL]);

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
                  backgroundColor: '#bcff00', 
                  borderRadius: '12px', 
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(188, 255, 0, 0.2)'
                }}>
                    <ReceiptLongIcon sx={{ fontSize: 32, color: '#000000' }} />
                </Box>
            </Grid>
            <Grid item xs>
                <Typography 
                    variant="caption" 
                    sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '1.5px' }}
                >
                    Total de Permisos
                </Typography>
                <Typography 
                    variant="h3" 
                    component="div" 
                    sx={{ fontWeight: 900, color: '#ffffff', mt: 0.5, lineHeight: 1 }}
                >
                  {displayCount !== null && displayCount !== 'Error'
                      ? displayCount.toLocaleString('es-AR')
                      : <CircularProgress color="inherit" size={28} />}
                </Typography>
            </Grid>
        </Grid>
    </Paper>
  );
}

export default CompletedOrdersCard;
