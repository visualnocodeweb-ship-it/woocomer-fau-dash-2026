import React, { useMemo } from 'react';
import { Paper, Typography, CircularProgress, Box } from '@mui/material';

function getBarColor(name) {
  if (name === 'Con Cargo') return '#bcff00';
  if (name === 'Total Sin Cargo') return '#ffffff';
  if (name.includes('automatizado')) return '#e1ff80';
  return '#8a9a00';
}

function PermitTypesChart({ data, loading, title }) {
  const { maxValue, totalValue } = useMemo(() => {
    const values = (data || []).map((item) => item.value);
    return {
      maxValue: Math.max(...values, 1),
      totalValue: values.reduce((sum, value) => sum + value, 0),
    };
  }, [data]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        backgroundColor: '#0a0a0a',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 3,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography
          variant="h6"
          sx={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '0.8rem',
            color: '#bcff00',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          {title}
        </Typography>
        {!loading && data?.length > 0 && (
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {data.length} tipos · ordenados de mayor a menor
          </Typography>
        )}
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={320}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <Box
          sx={{
            maxHeight: { xs: 480, md: 640 },
            overflowY: 'auto',
            pr: 1,
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(188, 255, 0, 0.25)',
              borderRadius: 8,
            },
          }}
        >
          {(data || []).map((item, index) => {
            const widthPercent = (item.value / maxValue) * 100;
            const sharePercent = totalValue > 0 ? (item.value / totalValue) * 100 : 0;

            return (
              <Box
                key={item.name}
                sx={{
                  mb: 2.5,
                  pb: 2.5,
                  borderBottom: index < data.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) auto' },
                    gap: 1,
                    alignItems: 'start',
                    mb: 1,
                  }}
                >
                  <Typography
                    sx={{
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: { xs: '0.85rem', sm: '0.95rem' },
                      lineHeight: 1.35,
                      wordBreak: 'break-word',
                    }}
                  >
                    {item.name}
                  </Typography>
                  <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, whiteSpace: 'nowrap' }}>
                    <Typography
                      component="span"
                      sx={{ color: '#bcff00', fontWeight: 800, fontSize: '1.1rem', mr: 1 }}
                    >
                      {item.value.toLocaleString('es-AR')}
                    </Typography>
                    <Typography component="span" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 600 }}>
                      {sharePercent.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    height: 10,
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${widthPercent}%`,
                      minWidth: item.value > 0 ? 8 : 0,
                      height: '100%',
                      backgroundColor: getBarColor(item.name),
                      borderRadius: 999,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}

export default PermitTypesChart;
