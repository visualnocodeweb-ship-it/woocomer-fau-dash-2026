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
    <Paper elevation={0} sx={{ 
        p: 3, 
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minWidth: 0
    }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'primary.main', mb: 3, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
        {title}
      </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="250px">
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 10, right: 30, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(value) => `$${value.toLocaleString('es-AR')}`} tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip 
                contentStyle={{ 
                    backgroundColor: '#000000', 
                    border: '1px solid rgba(188, 255, 0, 0.2)',
                    borderRadius: '8px',
                    color: 'white'
                }}
                formatter={(value) => `$${value.toLocaleString('es-AR')}`}
            />
            <Bar dataKey="revenue" barSize={8} radius={[4, 4, 0, 0]} fill="#bcff00" name="Recaudación" />
            <Line type="monotone" dataKey="revenue" stroke="#ffffff" strokeWidth={1} dot={false} activeDot={{ r: 4 }} name="Tendencia" />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}

export default DailyRevenueChart;
