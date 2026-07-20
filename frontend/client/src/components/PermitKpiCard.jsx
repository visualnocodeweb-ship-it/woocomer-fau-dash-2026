import React from 'react';
import { Paper, Box, Typography, CircularProgress, Grid } from '@mui/material';

function PermitKpiCard({
  label,
  count,
  icon: Icon,
  iconBg = '#ffffff',
  valueColor = '#bcff00',
  labelColor = 'text.secondary',
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        backgroundColor: '#0f0f0f',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 5,
        height: '100%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: 'rgba(188, 255, 0, 0.3)',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5), 0 0 20px rgba(188, 255, 0, 0.05)',
        },
      }}
    >
      <Grid container spacing={2} alignItems="center" wrap="nowrap">
        <Grid item>
          <Box
            sx={{
              backgroundColor: iconBg,
              borderRadius: '12px',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: iconBg === '#bcff00'
                ? '0 0 15px rgba(188, 255, 0, 0.2)'
                : '0 0 15px rgba(255, 255, 255, 0.1)',
            }}
          >
            <Icon sx={{ fontSize: 32, color: '#000000' }} />
          </Box>
        </Grid>
        <Grid item xs>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: labelColor,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              display: 'block',
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="h3"
            component="div"
            sx={{ fontWeight: 900, color: valueColor, mt: 0.5, lineHeight: 1 }}
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

export default PermitKpiCard;
