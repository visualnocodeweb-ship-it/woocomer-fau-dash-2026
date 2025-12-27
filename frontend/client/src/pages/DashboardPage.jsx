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
    Toolbar
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

import SheetsCountButton from '../components/SheetsCountButton'; // Reintroduced for consolidated count
import CategoryStatCard from '../components/CategoryStatCard'; // New import for category stats
import axios from 'axios';

// Helper component for Tab content
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
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
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
    const [sheetsCountsData, setSheetsCountsData] = useState(null); // New state for sheets counts
    const [sheetsCountsLoading, setSheetsCountsLoading] = useState(true); // New state for sheets loading
    const [anchorEl, setAnchorEl] = useState(null); // State for mobile menu
    const API_URL = import.meta.env.VITE_API_URL || '';
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md')); // Changed to 'md' for a better breakpoint

  // --- Data Fetching ---
  const fetchDailyCounts = async () => {
    try {
      setDailyCountsLoading(true);
      const response = await axios.get(`${API_URL}/api/stats/daily_counts?start_date=2025-10-15`);
      const formattedData = response.data.map(item => ({...item, date: new Date(item.date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}));
      setDailyCountsData(formattedData);
    } catch (error) { console.error('Error fetching daily counts:', error); } 
    finally { setDailyCountsLoading(false); }
  };
  
  const fetchDailyRevenue = async () => {
    try {
      setDailyRevenueLoading(true);
      const response = await axios.get(`${API_URL}/api/stats/daily_revenue`);
      const formattedData = response.data.map(item => ({...item, date: new Date(item.date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }), revenue: parseFloat(item.revenue) }));
      setDailyRevenueData(formattedData);
    } catch (error) { console.error('Error fetching daily revenue:', error); } 
    finally { setDailyRevenueLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await axios.get(`${API_URL}/api/combined-category-stats`);
      const formattedData = response.data.map(item => ({ name: item.name, value: item.value }));
      setCategoriesData(formattedData);
    } catch (error) { console.error('Error fetching categories:', error); } 
    finally { setCategoriesLoading(false); }
  };

  const fetchRegions = async () => {
    try {
      setRegionsLoading(true);
      const response = await axios.get(`${API_URL}/api/stats/category_counts`);
      setRegionsData(response.data);
    } catch (error) { console.error('Error fetching regions:', error); } 
    finally { setRegionsLoading(false); }
  };

  const fetchSheetsCounts = async () => { // New fetch function
    try {
        setSheetsCountsLoading(true);
        const response = await axios.get(`${API_URL}/api/sheets-counts`);
        setSheetsCountsData(response.data);
    } catch (error) {
        console.error('Error fetching Google Sheets counts:', error);
    } finally {
        setSheetsCountsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyCounts();
    fetchDailyRevenue();
    fetchCategories();
    fetchRegions();
    fetchSheetsCounts(); // Call new fetch function
    const intervalId = setInterval(() => {
        fetchDailyCounts();
        fetchDailyRevenue();
        fetchCategories();
        fetchRegions();
        fetchSheetsCounts(); // Refresh new fetch function
    }, 120000);
    return () => clearInterval(intervalId);
  }, []);

  // --- Handlers ---
  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (index) => {
    setValue(index);
    handleMenuClose();
  };

  // --- Render ---
  const tabPanels = (
    <>
      <TabPanel value={value} index={0}>
        <Grid container spacing={4} sx={{ mb: 5 }}>
          <Grid item xs={12} sm={6} md={4}><CompletedOrdersCard /></Grid>
          <Grid item xs={12} sm={6} md={4}><RecentOrdersCard /></Grid>
          <Grid item xs={12} sm={12} md={4}><JubiladoOrdersCard /></Grid>


        </Grid>
        <Box mt={5}>
          <Box mb={4}><DailyCountsChart data={dailyCountsData} loading={dailyCountsLoading} title="Permisos por Día (desde 15/10/2025)" /></Box>
          <Box><MonthlyCountsChart /></Box>
        </Box>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <CategoriesChart data={categoriesData} loading={categoriesLoading} title="Permisos por Tipo (desde 15/10/25)" />
        <Box sx={{ mt: 4 }}>
          <SheetsCountButton data={sheetsCountsData} loading={sheetsCountsLoading} consolidatedCategoryName="Residentes mayores de 65 años, jubilados, menores hasta 12 años y personas con discapacidad" /> {/* Consolidated count button */}
        </Box>

        <Grid container spacing={4} sx={{ mt: 4 }}> {/* New grid for category buttons */}
            {categoriesData.map((category, index) => (
                category.name !== "Residentes mayores de 65 años, jubilados, menores hasta 12 años y personas con discapacidad" && (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <CategoryStatCard name={category.name} value={category.value} loading={categoriesLoading} />
                    </Grid>
                )
            ))}
            {/* Specific button for "Permisos Discapacidad" from Google Sheets */}
            {sheetsCountsData && sheetsCountsData.categorized_sheets_counts && (
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
      <TabPanel value={value} index={2}><RegionsChart data={regionsData} loading={regionsLoading} title="Cantidad por Región de Pesca" /></TabPanel>
      <TabPanel value={value} index={3}>
        <Box mb={4}><TotalRevenueCard /></Box>
        <Box mb={4}><DailyRevenueChart data={dailyRevenueData} loading={dailyRevenueLoading} title="Recaudación por Día" /></Box>
        <Box><MonthlyRevenueChart /></Box>
      </TabPanel>
      <TabPanel value={value} index={4}><LatestOrdersTable /></TabPanel>
      <TabPanel value={value} index={5}><ReportGenerator /></TabPanel>
    </>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', flexGrow: { xs: 1, md: 0 } }}>
              Dashboard de Permisos
          </Typography>
          {isMobile && (
              <Typography variant="subtitle1" sx={{ textAlign: 'center', flexGrow: 1 }}>
                  {TAB_LABELS[value]}
              </Typography>
          )}
          {isMobile && (
              <Box>
                <IconButton
                    size="large"
                    edge="end"
                    color="inherit"
                    aria-label="menu"
                    onClick={handleMenuOpen}
                >
                    <MenuIcon />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    {TAB_LABELS.map((label, index) => (
                        <MenuItem 
                            key={label} 
                            selected={index === value} 
                            onClick={() => handleMenuItemClick(index)}
                        >
                            {label}
                        </MenuItem>
                    ))}
                </Menu>
              </Box>
          )}
      </Toolbar>

      {isMobile ? (
        <>
            {tabPanels}
        </>
      ) : (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleTabChange} variant="standard" aria-label="dashboard tabs">
                    {TAB_LABELS.map((label, index) => (
                        <Tab label={label} {...a11yProps(index)} key={label} />
                    ))}
                </Tabs>
            </Box>
            {tabPanels}
        </Box>
      )}
    </Container>
  );
}

export default DashboardPage;