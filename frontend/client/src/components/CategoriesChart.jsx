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

// A palette of colors for the chart bars
const COLORS = [
  "#F44336", "#673AB7", "#03A9F4", "#4CAF50", "#FFEB3B", "#FF5722", "#607D8B",
  "#E91E63", "#3F51B5", "#00BCD4", "#8BC34A", "#FFC107", "#795548", "#9C27B0",
  "#2196F3", "#009688", "#CDDC39", "#FF9800", "#9E9E9E", "#F48FB1", "#8C9EFF",
  "#80DEEA", "#C5E1A5", "#FFE082", "#FFAB91", "#BCAAA4", "#CE93D8", "#90CAF9",
  "#80CBC4", "#E6EE9C", "#FFCC80", "#EEEEEE", "#EF9A9A", "#B39DDB", "#4FC3F7",
  "#A5D6A7", "#FFF59D", "#FFCCBC", "#D7CCC8", "#BA68C8", "#64B5F6", "#4DB6AC",
  "#DCE775", "#FFB74D", "#BDBDBD", "#E57373", "#9575CD", "#29B6F6", "#81C784",
  "#FFF176", "#FF8A65", "#A1887F"
];

const CustomLegend = ({ data }) => (
    <Box sx={{ mt: 2, p: 1, color: 'white' }}>
        <Grid container spacing={1}>
            {(data || []).map((entry, index) => (
                <Grid item xs={12} sm={6} md={4} key={`item-${index}`}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Box
                            sx={{
                                width: 14,
                                height: 14,
                                backgroundColor: COLORS[index % COLORS.length],
                                mr: 1,
                            }}
                        />
                        <Typography variant="caption">{entry.name}</Typography>
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
    if (tickItem && tickItem.length > 20) {
        return tickItem.substring(0, 20) + '...';
    }
    return tickItem;
  };

  return (
    <Paper 
        elevation={4} 
        sx={{ 
            p: 2,
            borderRadius: 2, 
            backgroundColor: '#263238', 
            color: '#B0BEC5'
        }}
    >
      <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
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
                    top: 20,
                    right: 20,
                    bottom: 20, // Increased bottom margin for legend space
                    left: isMobile ? 60 : 120, // Adjusted margin
                    }}
                >
                    <CartesianGrid stroke="#455A64" />
                    <XAxis type="number" tick={{ fill: '#B0BEC5', fontSize: 12 }} />
                    <YAxis
                        dataKey="name"
                        type="category"
                        scale="band"
                        tickFormatter={formatYAxis} // Use the formatter
                        tick={{ fill: '#B0BEC5', fontSize: 12 }}
                        width={isMobile ? 100 : 150} // Adjusted width
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#37474F',
                            border: '1px solid #455A64',
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
