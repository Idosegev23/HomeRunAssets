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
import { useMatchingProperties } from '../hooks/useMatchingProperties';
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
  const [loading, setLoading] = useState(true);
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
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const { matchingProperties, loading: loadingProperties, error: propertiesError, findMatchingProperties } = useMatchingProperties();

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/customers');
      setCustomers(response.data);
      setSnackbar({ open: true, message: 'רשימת הלקוחות נטענה בהצלחה', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: `שגיאה בטעינת הלקוחות: ${err.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

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

  const handleFindProperties = useCallback(async (customer) => {
    setSelectedCustomer(customer);
    await findMatchingProperties(customer);
    setOpenMatchingPropertiesDialog(true);
  }, [findMatchingProperties]);

  // פונקציה עזר לניקוי אובייקט מפונקציות ומחזוריות
  const cleanObject = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  };

  const handleSendMessage = useCallback(async (customer, selectedProperties = []) => {
    if (!customer) {
      setSnackbar({ open: true, message: 'לא נבחר לקוח', severity: 'error' });
      return;
    }
  
    if (selectedProperties.length === 0) {
      setSnackbar({ open: true, message: 'לא נבחרו נכסים', severity: 'error' });
      return;
    }

    try {
      // נקה את האובייקטים מפונקציות ומחזוריות
      const cleanCustomer = cleanObject(customer);
      const cleanProperties = await Promise.all(
        selectedProperties.map(async (id) => {
          const response = await api.get(`/properties/${id}`);
          return cleanObject(response.data);
        })
      );
      const cleanMatchingProperties = cleanObject(matchingProperties);

      navigate('/send-messages', { 
        state: { 
          selectedCustomer: cleanCustomer,
          selectedProperties: cleanProperties,
          eligibleCustomers: [cleanCustomer],
          matchingProperties: cleanMatchingProperties
        } 
      });
    } catch (error) {
      console.error('Error preparing data for navigation:', error);
      setSnackbar({ open: true, message: 'שגיאה בהכנת הנתונים לשליחת הודעות', severity: 'error' });
    }
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
                  onFindProperties={handleFindProperties}
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
            loading={loadingProperties}
            error={propertiesError}
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