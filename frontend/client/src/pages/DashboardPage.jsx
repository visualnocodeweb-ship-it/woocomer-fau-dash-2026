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
import RecentOrdersCard from '../components/RecentOrdersCard';
import JubiladoOrdersCard from '../components/JubiladoOrdersCard';
import DailyCountsChart from '../components/DailyCountsChart';
import MonthlyCountsChart from '../components/MonthlyCountsChart';
import CategoriesChart from '../components/CategoriesChart';
import RegionsChart from '../components/RegionsChart';
import TotalRevenueCard from '../components/TotalRevenueCard';
import DailyRevenueChart from '../components/DailyRevenueChart';
import MonthlyRevenueChart from '../components/MonthlyRevenueChart';
import LatestOrdersTable from '../components/LatestOrdersTable';
import ReportGenerator from '../components/ReportGenerator';
import SheetsCountButton from '../components/SheetsCountButton';
import CategoryStatCard from '../components/CategoryStatCard';
import axios from 'axios';

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
                    <Grid item xs={12} sm={6} md={4} sx={{ minWidth: 0 }}>
                        <CompletedOrdersCard />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} sx={{ minWidth: 0 }}>
                        <RecentOrdersCard />
                    </Grid>
                    <Grid item xs={12} sm={12} md={4} sx={{ minWidth: 0 }}>
                        <JubiladoOrdersCard />
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
                <CategoriesChart data={categoriesData} loading={categoriesLoading} title="Permisos por Tipo" />
                <Box sx={{ mt: 4 }}>
                    <SheetsCountButton 
                        data={sheetsCountsData} 
                        loading={sheetsCountsLoading} 
                        consolidatedCategoryName="Residentes mayores de 65 años, jubilados, menores hasta 12 años y personas con discapacidad" 
                    />
                </Box>
                <Grid container spacing={3} sx={{ mt: 2 }}>
                    {categoriesData.map((category, index) => (
                        category.name !== "Residentes mayores de 65 años, jubilados, menores hasta 12 años y personas con discapacidad" && (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <CategoryStatCard name={category.name} value={category.value} loading={categoriesLoading} />
                            </Grid>
                        )
                    ))}
                    {sheetsCountsData?.categorized_sheets_counts && (
                        <Grid item xs={12} sm={6} md={4} key="permisos-discapacidad">
                            <CategoryStatCard 
                                name="Permisos Discapacidad" 
                                value={sheetsCountsData.categorized_sheets_counts["Permisos Discapacidad"] || 0} 
                                loading={sheetsCountsLoading} 
                            />
                        </Grid>
                    )}
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