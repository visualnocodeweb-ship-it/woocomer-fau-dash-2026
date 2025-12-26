import React from 'react';
import { Paper, Typography, CircularProgress, Box, useMediaQuery, useTheme } from '@mui/material';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

function RegionsChart({ data, loading, title }) {
  // --- Responsive Logic ---
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Paper 
        elevation={4} 
        sx={{ 
            p: 3, 
            borderRadius: 2, 
            height: '600px', 
            backgroundColor: '#263238', 
            color: '#B0BEC5'
        }}
    >
      <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
        {title}
      </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <CircularProgress />
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <ComposedChart
            layout="vertical"
            data={data}
            margin={{
              top: 20,
              right: 30,
              bottom: 5,
              left: isMobile ? 60 : 100,
            }}
          >
            <CartesianGrid stroke="#455A64" />
            <XAxis type="number" tick={{ fill: '#B0BEC5', fontSize: isMobile ? 10 : 12 }} />
            <YAxis
              dataKey="name"
              type="category"
              scale="band"
              tick={{ fill: '#B0BEC5', fontSize: isMobile ? 10 : 12 }}
              width={isMobile ? 80 : 120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#37474F',
                border: '1px solid #455A64',
                color: 'white',
              }}
            />
            <Legend wrapperStyle={{ color: 'white' }} />
            <Bar dataKey="value" barSize={isMobile ? 15 : 20} fill="#00C49F" name="Cantidad" />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}

export default RegionsChart;
