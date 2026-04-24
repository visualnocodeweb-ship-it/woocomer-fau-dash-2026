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
        elevation={0} 
        sx={{ 
            p: 3, 
            height: '600px', 
        }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.8rem', color: '#bcff00', fontWeight: 700, mb: 3, textTransform: 'uppercase', letterSpacing: '1px' }}>
        {title}
      </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <CircularProgress />
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height="95%">
          <ComposedChart
            layout="vertical"
            data={data}
            margin={{
              top: 10,
              right: 10,
              bottom: 0,
              left: isMobile ? 40 : 80,
            }}
          >
            <CartesianGrid stroke="rgba(255,255,255,0.03)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              dataKey="name"
              type="category"
              scale="band"
              tick={{ fill: '#666', fontSize: 11 }}
              width={isMobile ? 80 : 120}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#000000',
                border: '1px solid rgba(188, 255, 0, 0.2)',
                borderRadius: '4px',
                color: 'white',
              }}
            />
            <Bar dataKey="value" barSize={12} radius={[0, 2, 2, 0]} fill="#bcff00" name="Cantidad" />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}

export default RegionsChart;
