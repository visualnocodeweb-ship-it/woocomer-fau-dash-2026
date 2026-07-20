import React, { useMemo } from 'react';
import { Paper, Typography, CircularProgress, Box } from '@mui/material';

function getBarColor(name) {
  if (name.includes('automatizado')) return '#e1ff80';
  if (name === 'Otros permisos con cargo') return '#bcff00';
  return '#8a9a00';
}

function PermitTypesChart({ data, loading, title, officialTotal }) {
  const { maxValue, breakdownSum } = useMemo(() => {
    const values = (data || []).map((item) => item.value);
    return {
      maxValue: Math.max(...values, 1),
      breakdownSum: values.reduce((sum, value) => sum + value, 0),
    };
  }, [data]);

  const totalForPercent = officialTotal ?? breakdownSum;

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
            {data.length} tipos · suma = total general
          </Typography>
        )}
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={320}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              maxHeight: { xs: 480, md: 640 },
              overflowY: 'auto',
              pr: 1,
              mb: 3,
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(188, 255, 0, 0.25)',
                borderRadius: 8,
              },
            }}
          >
            {(data || []).map((item, index) => {
              const widthPercent = (item.value / maxValue) * 100;
              const sharePercent = totalForPercent > 0 ? (item.value / totalForPercent) * 100 : 0;

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

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pt: 2,
              borderTop: '1px solid rgba(188, 255, 0, 0.15)',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Typography sx={{ color: 'primary.main', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>
              Total de permisos
            </Typography>
            <Typography sx={{ color: '#ffffff', fontWeight: 900, fontSize: '1.5rem' }}>
              {(officialTotal ?? breakdownSum).toLocaleString('es-AR')}
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
}

export default PermitTypesChart;
