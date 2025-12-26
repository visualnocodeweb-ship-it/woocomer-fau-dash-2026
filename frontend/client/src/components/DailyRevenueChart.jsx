import React from 'react';
import { Paper, Typography, CircularProgress, Box } from '@mui/material';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

function DailyRevenueChart({ data, loading, title }) {
  return (
    <Paper elevation={4} sx={{ p: 3, borderRadius: 2, height: '450px', backgroundColor: '#263238', color: '#B0BEC5' }}>
      <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
        {title}
      </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <CircularProgress />
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <ComposedChart data={data} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#455A64" />
            <XAxis dataKey="date" tick={{ fill: '#B0BEC5' }} />
            <YAxis tickFormatter={(value) => `$${value.toLocaleString('es-AR')}`} tick={{ fill: '#B0BEC5' }} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#37474F', border: '1px solid #455A64', color: 'white' }}
                formatter={(value) => `$${value.toLocaleString('es-AR')}`}
            />
            <Legend wrapperStyle={{ color: 'white' }} />
            <Bar dataKey="revenue" barSize={20} fill="#4CAF50" name="Recaudación Diaria" />
            <Line type="monotone" dataKey="revenue" stroke="#FFFFFF" strokeWidth={2} name="Tendencia" />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}

export default DailyRevenueChart;
