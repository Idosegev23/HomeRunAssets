import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  TextField, Button, Grid, Typography, CircularProgress, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Slider,
  Container, useTheme, useMediaQuery, ThemeProvider, createTheme,
  Switch, Fade, Box
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import EditIcon from '@mui/icons-material/Edit';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';

// Import custom components
import PLTableView from './PLTableView';
import PLCardView from './PLCardView';
import PLFilterDialog from './PLFilterDialog';
import { StyledAppBar, Root, SliderContainer } from './PropertyListStyles';

// Create RTL cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

const parseCurrency = (value) => {
  if (typeof value === 'number') return value;
  return parseFloat(value?.replace(/[^\d.-]/g, '') || '0');
};

const PropertyList = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    city: '',
    street: '',
    rooms: '',
    priceMin: '',
    priceMax: '',
    square_metersMin: '',
    square_metersMax: '',
    floor: '',
    max_floor: ''
  });
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const [squareMetersRange, setSquareMetersRange] = useState([0, 500]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState('table');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const customTheme = React.useMemo(
    () =>
      createTheme({
        direction: 'rtl',
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
        },
      }),
    [isDarkMode]
  );

  useEffect(() => {
    fetchProperties();
    fetchCustomers();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await api.get('/properties');
      console.log("Properties fetched successfully:", response.data);
      setProperties(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching properties:", err);
      setError('שגיאה בטעינת הנתונים. אנא נסה שוב מאוחר יותר.');
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      console.log("Fetching customers...");
      const response = await api.get('/customers');
      console.log("Customers fetched successfully:", response.data);
      setCustomers(response.data);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError('שגיאה בטעינת נתוני הלקוחות. אנא נסה שוב מאוחר יותר.');
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
  };

  const handlePriceChange = (event, newValue) => {
    setPriceRange(newValue);
    setFilters(prevFilters => ({
      ...prevFilters,
      priceMin: newValue[0],
      priceMax: newValue[1]
    }));
  };

  const handleSquareMetersChange = (event, newValue) => {
    setSquareMetersRange(newValue);
    setFilters(prevFilters => ({
      ...prevFilters,
      square_metersMin: newValue[0],
      square_metersMax: newValue[1]
    }));
  };

  const applyFilters = () => {
    setOpenFilterDialog(false);
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      street: '',
      rooms: '',
      priceMin: '',
      priceMax: '',
      square_metersMin: '',
      square_metersMax: '',
      floor: '',
      max_floor: ''
    });
    setPriceRange([0, 10000000]);
    setSquareMetersRange([0, 500]);
  };

  const filteredProperties = properties.filter(property => {
    return (
      (filters.city === '' || property.city.toLowerCase().includes(filters.city.toLowerCase())) &&
      (filters.street === '' || property.street.toLowerCase().includes(filters.street.toLowerCase())) &&
      (filters.rooms === '' || property.rooms.toString() === filters.rooms) &&
      (filters.priceMin === '' || parseCurrency(property.price) >= parseCurrency(filters.priceMin)) &&
      (filters.priceMax === '' || parseCurrency(property.price) <= parseCurrency(filters.priceMax)) &&
      (filters.square_metersMin === '' || property.square_meters >= parseInt(filters.square_metersMin)) &&
      (filters.square_metersMax === '' || property.square_meters <= parseInt(filters.square_metersMax)) &&
      (filters.floor === '' || property.floor.toString() === filters.floor) &&
      (filters.max_floor === '' || property.max_floor.toString() === filters.max_floor)
    );
  });

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedProperties = React.useMemo(() => {
    let sortableProperties = [...filteredProperties];
    if (sortConfig.key !== null) {
      sortableProperties.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'price') {
          aValue = parseCurrency(a.price);
          bValue = parseCurrency(b.price);
        }

        if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
          aValue = Number(aValue);
          bValue = Number(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableProperties;
  }, [filteredProperties, sortConfig]);

  const handlePropertySelect = (property) => {
    setSelectedProperty(property);
  };

  const handleSendMessagesToMultipleCustomers = (property) => {
    console.log("handleSendMessagesToMultipleCustomers started", property);
  
    if (!property) {
      console.error("Property data is missing");
      alert("מידע על הנכס חסר. לא ניתן לשלוח הודעות.");
      return;
    }

    const eligibleCustomers = matchCustomersToProperty(customers, property);
    console.log("Eligible customers:", eligibleCustomers);

    if (eligibleCustomers.length === 0) {
      alert('לא נמצאו לקוחות מתאימים לנכס זה');
      return;
    }

    console.log("Navigating to /send-messages");
    navigate('/send-messages', { 
      state: { 
        selectedProperties: [property],
        eligibleCustomers: eligibleCustomers
      } 
    });
  };

  const handleEditProperty = (property) => {
    console.log("Editing property:", property);
    navigate(`/edit-property/${property.id}`, {
      state: { property }
    });
  };

  const matchCustomersToProperty = (customers, property) => {
    console.log("Matching customers to property:", property);
    console.log("Available customers:", customers);

    if (!customers || customers.length === 0) {
      console.error("No customers data available");
      return [];
    }

    const propertyPrice = parseCurrency(property.price);
  
    const matchedCustomers = customers.filter(customer => {
      const customerBudget = parseCurrency(customer.Budget);
    
      const minAcceptablePrice = propertyPrice * 0.85;
      const maxAcceptablePrice = propertyPrice + 1000000;
      const priceMatch = (customerBudget >= minAcceptablePrice && customerBudget <= maxAcceptablePrice);

      console.log(`Customer ${customer.id} budget: ${customerBudget}, Price match: ${priceMatch}`);
    
      return priceMatch;
    });

    console.log("Matched customers:", matchedCustomers);
    return matchedCustomers;
  };
    
  const formatPriceLabel = (value) => {
    return `${value.toLocaleString()} ₪`;
  };

  const formatSquareMetersLabel = (value) => {
    return `${value} מ"ר`;
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'table' ? 'card' : 'table');
  };

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={customTheme}>
        <Box dir="rtl">
          <StyledAppBar position="static">
            <Container>
              <Grid container alignItems="center">
                <Grid item xs>
                  <Typography variant="h6" component="div">
                    רשימת נכסים
                  </Typography>
                </Grid>
                <Grid item>
                  <IconButton color="inherit" onClick={fetchProperties}>
                    <RefreshIcon />
                  </IconButton>
                  <Switch checked={isDarkMode} onChange={toggleDarkMode} color="default" />
                  <IconButton color="inherit" onClick={toggleViewMode}>
                    {viewMode === 'table' ? <ViewModuleIcon /> : <ViewListIcon />}
                  </IconButton>
                </Grid>
              </Grid>
            </Container>
          </StyledAppBar>

          <Container>
            <Grid container justifyContent="space-between" alignItems="center" style={{ marginBottom: theme.spacing(2), marginTop: theme.spacing(2) }}>
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<FilterListIcon />}
                  onClick={() => setOpenFilterDialog(true)}
                >
                  {isMobile ? '' : 'סינון'}
                </Button>
              </Grid>
            </Grid>
            
            {loading ? (
              <CircularProgress />
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : viewMode === 'table' ? (
              <PLTableView 
                properties={sortedProperties}
                handlePropertySelect={handlePropertySelect}
                selectedProperty={selectedProperty}
                handleSendMessages={handleSendMessagesToMultipleCustomers}
                handleEditProperty={handleEditProperty}
                sortConfig={sortConfig}
                handleSort={handleSort}
              />
            ) : (
              <PLCardView 
                properties={sortedProperties}
                handleSendMessages={handleSendMessagesToMultipleCustomers}
                handleEditProperty={handleEditProperty}
              />
            )}

            <PLFilterDialog 
              open={openFilterDialog}
              onClose={() => setOpenFilterDialog(false)}
              filters={filters}
              handleFilterChange={handleFilterChange}
              priceRange={priceRange}
              handlePriceChange={handlePriceChange}
              squareMetersRange={squareMetersRange}
              handleSquareMetersChange={handleSquareMetersChange}
              clearFilters={clearFilters}
              applyFilters={applyFilters}
              formatPriceLabel={formatPriceLabel}
              formatSquareMetersLabel={formatSquareMetersLabel}
            />
          </Container>
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default PropertyList;
