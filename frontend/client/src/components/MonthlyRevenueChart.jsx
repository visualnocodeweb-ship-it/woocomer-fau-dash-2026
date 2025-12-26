import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

function MonthlyRevenueChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || '';

  const fetchMonthlyRevenue = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/stats/monthly_revenue`);
      const formattedData = response.data.map(item => ({
        ...item,
        revenue: parseFloat(item.revenue)
      }));
      setData(formattedData);
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyRevenue();
    const intervalId = setInterval(fetchMonthlyRevenue, 120000); // Refresh every 2 minutes
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Paper elevation={4} sx={{ p: 3, borderRadius: 2, height: '450px', backgroundColor: '#263238', color: '#B0BEC5' }}>
      <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
        Recaudación por Mes
      </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <CircularProgress />
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <ComposedChart data={data} margin={{ top: 20, right: 30, bottom: 5, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#455A64" />
            <XAxis dataKey="date" tick={{ fill: '#B0BEC5' }} />
            <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} tick={{ fill: '#B0BEC5' }} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#37474F', border: '1px solid #455A64', color: 'white' }}
                formatter={(value) => `$${value.toLocaleString('es-AR')}`}
            />
            <Legend wrapperStyle={{ color: 'white' }} />
            <Bar dataKey="revenue" barSize={30} fill="#FFC107" name="Recaudación Mensual" />
            <Line type="monotone" dataKey="revenue" stroke="#FFFFFF" strokeWidth={2} name="Tendencia" />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}

export default MonthlyRevenueChart;
