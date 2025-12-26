import React, { useState, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

import ReportStatCard from './ReportStatCard';
import DailyCountsChart from './DailyCountsChart';
import DailyRevenueChart from './DailyRevenueChart';
import CategoriesChart from './CategoriesChart';
import RegionsChart from './RegionsChart';


function ReportGenerator() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || '';
  const reportRef = useRef();

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError('Por favor, selecciona una fecha de inicio y de fin.');
      return;
    }
    setError(null);
    setLoading(true);
    setReportData(null);
    try {
      const response = await axios.post(`${API_URL}/api/reports/custom`, {
        start_date: startDate,
        end_date: endDate,
      });
      
      // Pre-format data for charts, ensuring arrays exist
      const formattedData = {
        ...response.data,
        daily_counts: (response.data.daily_counts ?? []).map(item => ({
            ...item,
            date: new Date(item.date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
        })),
        daily_revenue: (response.data.daily_revenue ?? []).map(item => ({
            ...item,
            date: new Date(item.date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
            revenue: parseFloat(item.revenue)
        })),
      };
      setReportData(formattedData);

    } catch (err) {
      console.error('Error generating report:', err);
      const errorMessage = err.response?.data?.detail || 'Ocurrió un error al generar el reporte. Revisa la consola para más detalles.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const input = reportRef.current;
    if (!input) {
        return;
    }

    // Hide the download button during capture
    const downloadButton = input.querySelector('.download-pdf-button');
    if (downloadButton) downloadButton.style.display = 'none';

    html2canvas(input, { 
        useCORS: true, 
        scale: 2, // Higher scale for better quality
        backgroundColor: '#1a1a1a' // Match approx background
    }).then(canvas => {
      // Show the button again after capture
      if (downloadButton) downloadButton.style.display = 'block';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`reporte_${startDate}_a_${endDate}.pdf`);
    }).catch(() => {
        // Ensure button is always shown again, even if there's an error
        if (downloadButton) downloadButton.style.display = 'block';
    });
  };
  
  const today = new Date().toISOString().split('T')[0];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={4} sx={{ p: 3, borderRadius: 2, backgroundColor: '#263238', color: 'white' }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          Generador de Reportes Personalizados
        </Typography>
        <Grid container spacing={3} alignItems="center">
          <Grid xs={12} sm={5}>
            <TextField
              label="Fecha de Inicio"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              inputProps={{ max: today }}
              sx={{
                '& .MuiInputBase-root': { color: 'white' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#546E7A' },
                '& .MuiInputLabel-root': { color: '#B0BEC5' },
              }}
            />
          </Grid>
          <Grid xs={12} sm={5}>
            <TextField
              label="Fecha de Fin"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              inputProps={{ min: startDate, max: today }}
              sx={{
                '& .MuiInputBase-root': { color: 'white' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#546E7A' },
                '& .MuiInputLabel-root': { color: '#B0BEC5' },
              }}
            />
          </Grid>
          <Grid xs={12} sm={2}>
            <Button
              variant="contained"
              onClick={handleGenerateReport}
              disabled={loading}
              fullWidth
              sx={{ height: '56px' }}
            >
              {loading ? <CircularProgress size={24} /> : 'Generar'}
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Box sx={{ mt: 2 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}
      </Paper>

      {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 4 }}>
              <CircularProgress />
          </Box>
      )}

      {reportData && !loading && (
        <div ref={reportRef}>
            <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Stat Cards in a row */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                    <ReportStatCard title="Total de Permisos Vendidos" value={reportData.total_permits} icon={<ReceiptLongIcon />} />
                    <ReportStatCard title="Recaudación Total" value={reportData.total_revenue} icon={<MonetizationOnIcon />} formatAsCurrency />
                </Box>
                
                {/* Summary Text */}
                <Box>
                    <Paper elevation={4} sx={{ p: 3, borderRadius: 2, backgroundColor: '#37474F', color: 'white' }}>
                        <Typography variant="h6" gutterBottom>Resumen del Reporte</Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {reportData.summary_text}
                        </Typography>
                    </Paper>
                </Box>

                {/* Charts */}
                <Box><DailyCountsChart data={reportData.daily_counts} loading={loading} title="Permisos por Día" /></Box>
                <Box><DailyRevenueChart data={reportData.daily_revenue} loading={loading} title="Recaudación por Día" /></Box>
                <Box><CategoriesChart data={reportData.category_counts} loading={loading} title="Cantidad por Tipo de Permiso" /></Box>
                <Box><RegionsChart data={reportData.region_counts} loading={loading} title="Cantidad por Región" /></Box>

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                        className="download-pdf-button"
                        variant="contained"
                        color="secondary"
                        onClick={handleDownloadPDF}
                        sx={{ height: '56px' }}
                    >
                        Descargar en PDF
                    </Button>
                </Box>
            </Box>
        </div>
      )}
    </Container>
  );
}

export default ReportGenerator;
