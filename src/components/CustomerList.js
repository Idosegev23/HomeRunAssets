// CustomerList.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ThemeProvider, createTheme, styled } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import rtlPlugin from 'stylis-plugin-rtl';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import { 
  Container, 
  Paper, 
  CircularProgress, 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FilterListIcon from '@mui/icons-material/FilterList';
import CustomerTable from './CustomerTable';
import CustomerFilterDialog from './CustomerFilterDialog';
import MatchingPropertiesDialog from './MatchingPropertiesDialog';
import CustomerEditDialog from './CustomerEditDialog';
import './CustomerList.css';

// יצירת קאש RTL
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// יצירת ערכת נושא מותאמת אישית
const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: 'Heebo, Arial, sans-serif',
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          textAlign: 'right',
        },
      },
    },
  },
});

const Root = styled('div')(({ theme }) => ({
  width: '100%',
  direction: 'rtl',
}));

const CustomerList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    First_name: '',
    Last_name: '',
    Cell: '',
    BudgetMin: 0,
    BudgetMax: 10000000,
    Rooms: [0, 10],
    Square_meters: [0, 500],
    City: '',
    Area: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: 'First_name', direction: 'asc' });
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [openMatchingPropertiesDialog, setOpenMatchingPropertiesDialog] = useState(false);
  const [matchingProperties, setMatchingProperties] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/customers');
      setCustomers(response.data);
      setError(null);
    } catch (err) {
      setError(`שגיאה בטעינת הלקוחות: ${err.message}`);
      setSnackbar({ open: true, message: `שגיאה בטעינת הלקוחות: ${err.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    try {
      const response = await api.get('/properties');
      setProperties(response.data);
    } catch (err) {
      setError(`שגיאה בטעינת הנכסים: ${err.message}`);
      setSnackbar({ open: true, message: `שגיאה בטעינת הנכסים: ${err.message}`, severity: 'error' });
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchProperties();
  }, [fetchCustomers, fetchProperties]);

  const handleSort = useCallback((key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const applyFilters = useCallback(() => {
    setOpenFilterDialog(false);
    // כאן ניתן להוסיף לוגיקה נוספת לסינון הלקוחות
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      First_name: '',
      Last_name: '',
      Cell: '',
      BudgetMin: 0,
      BudgetMax: 10000000,
      Rooms: [0, 10],
      Square_meters: [0, 500],
      City: '',
      Area: ''
    });
  }, []);

  const findMatchingProperties = useCallback((customer) => {
    if (!properties || properties.length === 0) {
      setSnackbar({ open: true, message: 'אין נתוני נכסים זמינים', severity: 'warning' });
      return;
    }
  
    console.log('Customer:', customer);
    console.log('All properties:', properties);
  
    const matches = properties.map(property => {
      const propertyPrice = Number(property.price);
      const customerBudget = Number(customer.Budget);
      
      // בדיקת התאמת מחיר
      const priceMatch = propertyPrice <= customerBudget * 1.1 && propertyPrice >= customerBudget * 0.9;
      
      // חישוב רמות התאמה לפרמטרים אחרים
      const roomsMatch = calculateMatchLevel(Number(property.rooms), Number(customer.Rooms));
      const cityMatch = calculateCityMatchLevel(property.city, customer.City, customer.Area);
      const floorMatch = calculateMatchLevel(Number(property.floor), Number(customer.Preferred_floor));
      const sizeMatch = calculateMatchLevel(Number(property.square_meters), Number(customer.Square_meters));
  
      // חישוב אחוז התאמה כולל
      const totalMatchPercentage = calculateTotalMatchPercentage(priceMatch, roomsMatch, cityMatch, floorMatch, sizeMatch);
  
      return {
        property,
        priceMatch,
        roomsMatch,
        cityMatch,
        floorMatch,
        sizeMatch,
        totalMatchPercentage
      };
    }).filter(match => match.priceMatch) // סינון רק נכסים שמתאימים למחיר
      .sort((a, b) => b.totalMatchPercentage - a.totalMatchPercentage); // מיון לפי אחוז התאמה יורד
  
    console.log('Matching properties:', matches);
  
    setMatchingProperties(matches);
    setSelectedCustomer(customer);
    setOpenMatchingPropertiesDialog(true);
  }, [properties]);
  
  // פונקציות עזר
  
  const calculateMatchLevel = (propertyValue, customerValue) => {
    const diff = Math.abs(propertyValue - customerValue);
    if (diff === 0) return 'מלאה';
    if (diff <= 1) return 'חלקית';
    return 'ללא';
  };
  
  const calculateCityMatchLevel = (propertyCity, customerCity, customerArea) => {
    if (propertyCity.toLowerCase() === customerCity.toLowerCase()) return 'מלאה';
    if (propertyCity.toLowerCase().includes(customerArea.toLowerCase()) ||
        customerArea.toLowerCase().includes(propertyCity.toLowerCase())) return 'חלקית';
    return 'ללא';
  };
  
  const calculateTotalMatchPercentage = (priceMatch, roomsMatch, cityMatch, floorMatch, sizeMatch) => {
    let total = priceMatch ? 50 : 0; // מחיר מהווה 50% מהציון הכולל
    total += getMatchScore(roomsMatch);
    total += getMatchScore(cityMatch);
    total += getMatchScore(floorMatch);
    total += getMatchScore(sizeMatch);
    return total;
  };
  
  const getMatchScore = (matchLevel) => {
    switch (matchLevel) {
      case 'מלאה': return 12.5; // כל פרמטר אחר מהווה עד 12.5% מהציון הכולל
      case 'חלקית': return 6.25;
      default: return 0;
    }
  };

  const handleSendMessage = useCallback((customer, property = null) => {
    console.log('Sending message to customer:', customer);
    console.log('Selected property:', property);
    console.log('Matching properties:', matchingProperties);

    if (!customer) {
      setSnackbar({ open: true, message: 'לא נבחר לקוח', severity: 'error' });
      return;
    }

    navigate('/send-messages', { 
      state: { 
        selectedCustomer: customer,
        selectedProperty: property || matchingProperties[0]?.property,
        eligibleCustomers: [customer], // שינוי זה: העבר רק את הלקוח הנבחר כמערך
        matchingProperties: matchingProperties
      } 
    });
  }, [navigate, matchingProperties]);

  const saveCustomer = useCallback(async (customer) => {
    try {
      if (customer.id) {
        await api.put(`/customers/${customer.id}`, customer);
        setSnackbar({ open: true, message: 'הלקוח עודכן בהצלחה', severity: 'success' });
      } else {
        await api.post('/customers', customer);
        setSnackbar({ open: true, message: 'הלקוח נוסף בהצלחה', severity: 'success' });
      }
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) {
      setError(`שגיאה בשמירת הלקוח: ${err.message}`);
      setSnackbar({ open: true, message: `שגיאה בשמירת הלקוח: ${err.message}`, severity: 'error' });
    }
  }, [fetchCustomers]);

  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [customers, sortConfig]);

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <Root className="customer-list-container" dir="rtl">
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                רשימת לקוחות
              </Typography>
              <Tooltip title="סינון">
                <IconButton color="inherit" onClick={() => setOpenFilterDialog(true)}>
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="רענן נתונים">
                <IconButton color="inherit" onClick={fetchCustomers}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="הוסף לקוח">
                <IconButton color="inherit" onClick={() => setEditingCustomer({})}>
                  <PersonAddIcon />
                </IconButton>
              </Tooltip>
            </Toolbar>
          </AppBar>
          <Container>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Paper>
                <CustomerTable 
                  customers={sortedCustomers}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onEdit={setEditingCustomer}
                  onFindProperties={findMatchingProperties}
                  onSendMessage={handleSendMessage}
                />
              </Paper>
            )}
          </Container>

          <CustomerFilterDialog
            open={openFilterDialog}
            filters={filters}
            onClose={() => setOpenFilterDialog(false)}
            onFilterChange={handleFilterChange}
            onApplyFilters={applyFilters}
            onClearFilters={clearFilters}
          />

          <MatchingPropertiesDialog
            open={openMatchingPropertiesDialog}
            onClose={() => setOpenMatchingPropertiesDialog(false)}
            matchingProperties={matchingProperties}
            selectedCustomer={selectedCustomer}
            onSendMessage={handleSendMessage}
          />

          <CustomerEditDialog
            open={Boolean(editingCustomer)}
            customer={editingCustomer}
            onClose={() => setEditingCustomer(null)}
            onSave={saveCustomer}
          />

          <Snackbar 
            open={snackbar.open} 
            autoHideDuration={6000} 
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Root>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default CustomerList;