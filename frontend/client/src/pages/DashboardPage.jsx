import React, { useState, useEffect } from 'react';
import { 
    Grid, 
    Typography, 
    Container, 
    Box, 
    Tabs, 
    Tab, 
    useTheme, 
    useMediaQuery,
    IconButton,
    Menu,
    MenuItem,
    Toolbar,
    CircularProgress
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CompletedOrdersCard from '../components/CompletedOrdersCard';
import PermitKpiCard from '../components/PermitKpiCard';
import DailyCountsChart from '../components/DailyCountsChart';
import MonthlyCountsChart from '../components/MonthlyCountsChart';
import PermitTypesChart from '../components/PermitTypesChart';
import RegionsChart from '../components/RegionsChart';
import TotalRevenueCard from '../components/TotalRevenueCard';
import DailyRevenueChart from '../components/DailyRevenueChart';
import MonthlyRevenueChart from '../components/MonthlyRevenueChart';
import LatestOrdersTable from '../components/LatestOrdersTable';
import ReportGenerator from '../components/ReportGenerator';
import CategoryStatCard from '../components/CategoryStatCard';
import axios from 'axios';
import { JUBILADOS_PRODUCT_NAME } from '../constants/permits';
import ElderlyIcon from '@mui/icons-material/Elderly';
import SyncIcon from '@mui/icons-material/Sync';
import AccessibleIcon from '@mui/icons-material/Accessible';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import PaidIcon from '@mui/icons-material/Paid';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TAB_LABELS = [
    "Dashboard Principal",
    "Tipos de Permiso",
    "Regiones",
    "Recaudación",
    "Últimos Registros",
    "Reportes"
];

function DashboardPage() {
    const [value, setValue] = useState(0);
    const [dailyCountsData, setDailyCountsData] = useState([]);
    const [dailyCountsLoading, setDailyCountsLoading] = useState(true);
    const [dailyRevenueData, setDailyRevenueData] = useState([]);
    const [dailyRevenueLoading, setDailyRevenueLoading] = useState(true);
    const [categoriesData, setCategoriesData] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [regionsData, setRegionsData] = useState([]);
    const [regionsLoading, setRegionsLoading] = useState(true);
    const [sheetsCountsData, setSheetsCountsData] = useState(null);
    const [sheetsCountsLoading, setSheetsCountsLoading] = useState(true);
    const [kpiRecentCount, setKpiRecentCount] = useState(null);
    const [kpiSinCargoCount, setKpiSinCargoCount] = useState(null);
    const [kpiSinCargoNuevosCount, setKpiSinCargoNuevosCount] = useState(null);
    const [kpiDiscapacidadCount, setKpiDiscapacidadCount] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const API_URL = import.meta.env.VITE_API_URL || '';

    const fetchData = async () => {
        try {
            // Fetch all in parallel
            const [dailyC, dailyR, cats, regs, sheets] = await Promise.all([
                axios.get(`${API_URL}/api/stats/daily_counts`),
                axios.get(`${API_URL}/api/stats/daily_revenue`),
                axios.get(`${API_URL}/api/combined-category-stats`),
                axios.get(`${API_URL}/api/stats/category_counts`),
                axios.get(`${API_URL}/api/sheets-counts`)
            ]);

            setDailyCountsData(dailyC.data.map(item => ({
                ...item, 
                date: new Date(item.date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
            })));
            
            setDailyRevenueData(dailyR.data.map(item => ({
                ...item, 
                date: new Date(item.date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }), 
                revenue: parseFloat(item.revenue) 
            })));

            setCategoriesData(cats.data.map(item => ({ name: item.name, value: item.value })));
            setRegionsData(regs.data);
            setSheetsCountsData(sheets.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setDailyCountsLoading(false);
            setDailyRevenueLoading(false);
            setCategoriesLoading(false);
            setRegionsLoading(false);
            setSheetsCountsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 120000);
        return () => clearInterval(intervalId);
    }, []);

    const fetchKpiCounts = async () => {
        try {
            const sinCargoParams = new URLSearchParams({
                before_date: '2025-10-15',
                line_item_name: JUBILADOS_PRODUCT_NAME,
                total: 0,
            });

            const [recentResponse, sinCargoResponse, externalResponse] = await Promise.all([
                axios.get(`${API_URL}/api/orders/count`),
                axios.get(`${API_URL}/api/orders/count?${sinCargoParams.toString()}`),
                axios.get(`${API_URL}/api/external-permits/stats`),
            ]);

            setKpiRecentCount(recentResponse.data.total_completed || 0);
            setKpiSinCargoCount(sinCargoResponse.data.total_completed || 0);
            setKpiSinCargoNuevosCount(externalResponse.data.sin_cargo_nuevos?.total_enviados || 0);
            setKpiDiscapacidadCount(externalResponse.data.discapacidad?.total_enviados || 0);
        } catch (error) {
            console.error('Error fetching KPI counts:', error);
        }
    };

    useEffect(() => {
        fetchKpiCounts();
        const intervalId = setInterval(fetchKpiCounts, 120000);
        return () => clearInterval(intervalId);
    }, []);

    const totalPermitsCount =
        kpiRecentCount !== null &&
        kpiSinCargoCount !== null &&
        kpiSinCargoNuevosCount !== null &&
        kpiDiscapacidadCount !== null
            ? kpiRecentCount + kpiSinCargoCount + kpiSinCargoNuevosCount + kpiDiscapacidadCount
            : null;

    const totalSinCargoCount =
        kpiSinCargoCount !== null &&
        kpiSinCargoNuevosCount !== null &&
        kpiDiscapacidadCount !== null
            ? kpiSinCargoCount + kpiSinCargoNuevosCount + kpiDiscapacidadCount
            : null;

    const conCargoCount =
        totalPermitsCount !== null && totalSinCargoCount !== null
            ? totalPermitsCount - totalSinCargoCount
            : null;

    const kpiLoading =
        kpiSinCargoCount === null ||
        kpiSinCargoNuevosCount === null ||
        kpiDiscapacidadCount === null ||
        conCargoCount === null;

    const permitTypesData = React.useMemo(() => {
        const excludedName =
            'Residentes mayores de 65 años, jubilados, menores hasta 12 años y personas con discapacidad';

        const wooCategories = categoriesData.filter(
            (category) => category.value > 0 && category.name !== excludedName
        );

        const automatedCategories = [
            { name: 'Con Cargo', value: conCargoCount ?? 0 },
            { name: 'Total Sin Cargo', value: totalSinCargoCount ?? 0 },
            { name: 'Sin Cargo (automatizado)', value: kpiSinCargoCount ?? 0 },
            { name: 'Sin Cargo Nuevos (automatizado)', value: kpiSinCargoNuevosCount ?? 0 },
            { name: 'Discapacidad (automatizado)', value: kpiDiscapacidadCount ?? 0 },
        ].filter((category) => category.value > 0);

        return [...wooCategories, ...automatedCategories].sort((a, b) => b.value - a.value);
    }, [
        categoriesData,
        conCargoCount,
        totalSinCargoCount,
        kpiSinCargoCount,
        kpiSinCargoNuevosCount,
        kpiDiscapacidadCount,
    ]);

    const permitTypesLoading = categoriesLoading || kpiLoading;

    const handleChange = (event, newValue) => setValue(newValue);
    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const handleMenuItemClick = (index) => {
        setValue(index);
        handleMenuClose();
    };

    return (
        <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, sm: 6 } }}>
            {/* Header Section */}
            <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 3 }}>
                <Box>
                    <Typography 
                        variant="h4" 
                        sx={{ 
                            fontWeight: 900, 
                            color: '#ffffff', 
                            mb: 1,
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            lineHeight: 1,
                            fontSize: { xs: '1.2rem', sm: '1.8rem' }
                        }}
                    >
                        Registro de Permisos
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Panel Estratégico • Gestión Fauna
                    </Typography>
                </Box>

                {isMobile ? (
                    <Box>
                        <IconButton
                            size="large"
                            color="inherit"
                            onClick={handleMenuOpen}
                            sx={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                            PaperProps={{
                                sx: { backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', width: 220, mt: 1 }
                            }}
                        >
                            {TAB_LABELS.map((label, index) => (
                                <MenuItem 
                                    key={label} 
                                    selected={index === value} 
                                    onClick={() => handleMenuItemClick(index)}
                                    sx={{ py: 1.5, fontSize: '0.85rem', fontWeight: 600 }}
                                >
                                    {label}
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>
                ) : (
                    <Tabs 
                        value={value} 
                        onChange={handleChange} 
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ 
                            '& .MuiTabs-indicator': { backgroundColor: 'primary.main', height: 2 },
                            '& .MuiTab-root': { 
                                color: 'rgba(255,255,255,0.4)', 
                                fontWeight: 800, 
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                minWidth: 'auto',
                                px: 3,
                                '&.Mui-selected': { color: '#ffffff' }
                            }
                        }}
                    >
                        {TAB_LABELS.map((label) => (
                            <Tab key={label} label={label} />
                        ))}
                    </Tabs>
                )}
            </Box>

            {/* Content Section */}
            <TabPanel value={value} index={0}>
                {/* KPI Cards Row */}
                <Grid container spacing={4} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} lg={4} sx={{ minWidth: 0 }}>
                        <CompletedOrdersCard count={totalPermitsCount} />
                    </Grid>
                    <Grid item xs={12} sm={6} lg={4} sx={{ minWidth: 0 }}>
                        <PermitKpiCard
                            label="Con Cargo"
                            count={conCargoCount}
                            icon={PaidIcon}
                            iconBg="#bcff00"
                            valueColor="#ffffff"
                            labelColor="primary.main"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} lg={4} sx={{ minWidth: 0 }}>
                        <PermitKpiCard
                            label="Total Sin Cargo"
                            count={totalSinCargoCount}
                            icon={MoneyOffIcon}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} lg={4} sx={{ minWidth: 0 }}>
                        <PermitKpiCard
                            label="Sin Cargo (automatizado)"
                            count={kpiSinCargoCount}
                            icon={ElderlyIcon}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} lg={4} sx={{ minWidth: 0 }}>
                        <PermitKpiCard
                            label="Sin Cargo Nuevos (automatizado)"
                            count={kpiSinCargoNuevosCount}
                            icon={SyncIcon}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} lg={4} sx={{ minWidth: 0 }}>
                        <PermitKpiCard
                            label="Discapacidad (automatizado)"
                            count={kpiDiscapacidadCount}
                            icon={AccessibleIcon}
                            iconBg="#ffffff"
                        />
                    </Grid>
                </Grid>

                {/* Charts Row - Stacked Vertically */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Box sx={{ width: '100%', minWidth: 0 }}>
                        <DailyCountsChart data={dailyCountsData} loading={dailyCountsLoading} title="Permisos por Día" />
                    </Box>
                    <Box sx={{ width: '100%', minWidth: 0 }}>
                        <MonthlyCountsChart />
                    </Box>
                </Box>
            </TabPanel>

            <TabPanel value={value} index={1}>
                <PermitTypesChart data={permitTypesData} loading={permitTypesLoading} title="Permisos por Tipo" />
                <Grid container spacing={3} sx={{ mt: 2 }}>
                    {permitTypesData.map((category) => (
                        <Grid item xs={12} sm={6} md={4} key={category.name}>
                            <CategoryStatCard
                                name={category.name}
                                value={category.value}
                                loading={permitTypesLoading}
                            />
                        </Grid>
                    ))}
                </Grid>
            </TabPanel>

            <TabPanel value={value} index={2}>
                <RegionsChart data={regionsData} loading={regionsLoading} title="Cantidad por Región" />
            </TabPanel>

            <TabPanel value={value} index={3}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Box sx={{ width: '100%' }}><TotalRevenueCard /></Box>
                    <Box sx={{ width: '100%', minWidth: 0 }}>
                        <DailyRevenueChart data={dailyRevenueData} loading={dailyRevenueLoading} title="Recaudación Diaria" />
                    </Box>
                    <Box sx={{ width: '100%', minWidth: 0 }}>
                        <MonthlyRevenueChart />
                    </Box>
                </Box>
            </TabPanel>

            <TabPanel value={value} index={4}>
                <LatestOrdersTable />
            </TabPanel>

            <TabPanel value={value} index={5}>
                <ReportGenerator />
            </TabPanel>
        </Container>
    );
}

export default DashboardPage;