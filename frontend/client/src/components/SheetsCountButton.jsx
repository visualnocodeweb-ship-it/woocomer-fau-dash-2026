import React from 'react';
import { Paper, Typography, Box, CircularProgress, Grid } from '@mui/material'; // Removed DescriptionIcon import

function SheetsCountButton({ data, loading, consolidatedCategoryName }) {
  const consolidatedCount = data?.categorized_sheets_counts?.[consolidatedCategoryName] || 0;

  return (
    <Paper
      elevation={4}
      sx={{
        p: 2, // Adjusted padding for a cleaner look
        borderRadius: 2,
        backgroundColor: '#263238', // Dark Charcoal
        color: 'white',
        height: '100%', // Ensure consistent height
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start', // Align text to start
        justifyContent: 'center',
        minHeight: 100, // Explicit min-height for uniformity
      }}
    >
        {loading ? (
          <CircularProgress color="inherit" size={24} /> // Adjusted loader size
        ) : (
          <>
            <Typography
                variant="subtitle2" // Adjusted variant for a professional look
                sx={{ fontWeight: 'bold', color: '#B0BEC5', lineHeight: 1.2, mb: 0.5 }} // Adjusted line height and margin
            >
                {consolidatedCategoryName}
            </Typography>
            <Typography
                variant="h5" // Adjusted variant for a prominent count
                component="div"
                sx={{ fontWeight: 'bold', lineHeight: 1.2 }}
            >
                {consolidatedCount.toLocaleString('es-AR')}
            </Typography>
          </>
        )}
    </Paper>
  );
}

export default SheetsCountButton;