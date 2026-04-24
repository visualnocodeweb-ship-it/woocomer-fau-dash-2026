import React from 'react';
import { Paper, Typography, CircularProgress, Box, useMediaQuery, useTheme, Grid } from '@mui/material';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

// A palette of colors for the chart bars - LemonCash style
const COLORS = [
  "#bcff00", "#ffffff", "#333333", "#666666", "#999999", "#1a1a1a", "#e1ff80", "#cccccc"
];

const CustomLegend = ({ data }) => (
    <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 2 }}>
        <Grid container spacing={2}>
            {(data || []).map((entry, index) => (
                <Grid item xs={12} sm={6} md={4} key={`item-${index}`}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Box
                            sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '2px',
                                backgroundColor: COLORS[index % COLORS.length],
                                mr: 1.5,
                            }}
                        />
                        <Typography variant="caption" sx={{ color: '#a0a0a0', fontWeight: 600 }}>{entry.name}</Typography>
                    </Box>
                </Grid>
            ))}
        </Grid>
    </Box>
);


function CategoriesChart({ data, loading, title }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Function to truncate labels for the Y-axis
  const formatYAxis = (tickItem) => {
    if (tickItem && tickItem.length > 25) {
        return tickItem.substring(0, 25) + '...';
    }
    return tickItem;
  };

  return (
    <Paper 
        elevation={0} 
        sx={{ 
            p: 3,
        }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.8rem', color: '#bcff00', fontWeight: 700, mb: 3, textTransform: 'uppercase', letterSpacing: '1px' }}>
        {title}
      </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress />
        </Box>
      ) : (
        <>
            <Box sx={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    layout="vertical"
                    data={data}
                    margin={{
                    top: 5,
                    right: 20,
                    bottom: 5,
                    left: isMobile ? 60 : 120,
                    }}
                >
                    <CartesianGrid stroke="rgba(255,255,255,0.03)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                        dataKey="name"
                        type="category"
                        scale="band"
                        tickFormatter={formatYAxis} // Use the formatter
                        tick={{ fill: '#666', fontSize: 11 }}
                        width={isMobile ? 100 : 150} // Adjusted width
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
                    <Bar dataKey="value" barSize={20}>
                        {data && data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </ComposedChart>
                </ResponsiveContainer>
            </Box>
            <CustomLegend data={data} />
        </>
      )}
    </Paper>
  );
}

export default CategoriesChart;
