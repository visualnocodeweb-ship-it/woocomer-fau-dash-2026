import React from 'react';
import { Paper, Box, Typography, Grid } from '@mui/material';

function ReportStatCard({ title, value, icon, formatAsCurrency = false }) {
  const formattedValue = () => {
    if (value === null || value === undefined) return '...';
    if (formatAsCurrency) {
      return `$ ${parseFloat(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return value.toLocaleString('es-AR');
  };

  return (
    <Paper 
        elevation={4} 
        sx={{ 
            p: 2, 
            borderRadius: 2, 
            backgroundColor: '#37474F', // Darker shade for report cards
            color: 'white',
            height: '100%'
        }}
    >
        <Grid container spacing={2} alignItems="center" wrap="nowrap">
            {icon && (
              <Grid item>
                  <Box sx={{ backgroundColor: '#546E7A', borderRadius: '50%', p: 1.5 }}>
                      {React.cloneElement(icon, { sx: { fontSize: 28, color: 'white' } })}
                  </Box>
              </Grid>
            )}
            <Grid item xs>
                <Typography 
                    variant="subtitle1" 
                    sx={{ fontWeight: 'bold', color: '#B0BEC5' }}
                >
                  {title}
                </Typography>
                <Typography 
                    variant="h5" 
                    component="div" 
                    sx={{ fontWeight: 'bold' }}
                >
                  {formattedValue()}
                </Typography>
            </Grid>
        </Grid>
    </Paper>
  );
}

export default ReportStatCard;
