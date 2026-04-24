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
      
      const [dbResponse, sheetsResponse] = await Promise.all([
        axios.get(`${API_URL}/api/orders/count?${params.toString()}`),
        axios.get(`${API_URL}/api/sheets-counts`)
      ]);

      const dbCount = dbResponse.data.total_completed || 0;
      const staticCount = sheetsResponse.data.static_sheet_total_count || 0;
      const otherSheetsCount = sheetsResponse.data.categorized_sheets_counts?.["Otros Permisos Google Sheets"] || 0;
      const jubiladosCount = sheetsResponse.data.categorized_sheets_counts?.["jubilados"] || 0;
      
      setCount(dbCount + staticCount + otherSheetsCount + jubiladosCount);
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
                    <ElderlyIcon sx={{ fontSize: 32, color: '#000000' }} />
                </Box>
            </Grid>
            <Grid item xs>
                <Typography 
                    variant="caption" 
                    sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '1.5px' }}
                >
                  Jubilados (Sin cargo)
                </Typography>
                <Typography 
                    variant="h3" 
                    component="div" 
                    sx={{ fontWeight: 900, color: '#bcff00', mt: 0.5, lineHeight: 1 }}
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
