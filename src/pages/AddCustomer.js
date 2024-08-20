import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box, Snackbar, Paper, Grid, InputAdornment } from '@mui/material';
import { styled } from '@mui/material/styles.js';
import MuiAlert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import api from '../utils/api.js';
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// Create rtl cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  color: theme.palette.text.secondary,
  backgroundImage: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)',
  borderRadius: '15px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const AddCustomer = () => {
  const [customer, setCustomer] = useState({
    First_name: '',
    Last_name: '',
    Cell: '',
    Budget: '',
    Rooms: '',
    Square_meters: '',
    Preferred_floor: '',
    City: '',
    Area: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer(prevCustomer => ({ ...prevCustomer, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prevErrors => ({ ...prevErrors, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!/^\d{10}$/.test(customer.Cell)) {
      newErrors.Cell = 'יש להזין מספר טלפון תקין (10 ספרות)';
    }
    if (customer.Budget === '' || isNaN(customer.Budget) || Number(customer.Budget) <= 0) {
      newErrors.Budget = 'יש להזין תקציב תקין (מספר חיובי)';
    }
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    try {
      const formattedCustomer = {
        ...customer,
        Cell: Number(customer.Cell),
        Budget: Number(customer.Budget),
        Rooms: Number(customer.Rooms),
        Square_meters: Number(customer.Square_meters),
        Preferred_floor: Number(customer.Preferred_floor)
      };
      await api.post('/dataHandler', { resource: 'customers', data: formattedCustomer });
      setLoading(false);
      setOpenSnackbar(true);
      setCustomer({
        First_name: '',
        Last_name: '',
        Cell: '',
        Budget: '',
        Rooms: '',
        Square_meters: '',
        Preferred_floor: '',
        City: '',
        Area: ''
      });
    } catch (error) {
      setError('שגיאה בהוספת הלקוח. אנא נסה שוב.');
      setLoading(false);
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
    setError(null);
  };

  return (
    <CacheProvider value={cacheRtl}>
      <Container maxWidth="md" dir="rtl">
        <Box sx={{ mt: 4, mb: 4 }}>
          <StyledPaper elevation={3}>
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography component="h1" variant="h4" color="primary" gutterBottom>
                הוספת לקוח חדש
              </Typography>
              <PersonAddIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      required
                      fullWidth
                      id="First_name"
                      label="שם פרטי"
                      name="First_name"
                      autoComplete="given-name"
                      value={customer.First_name}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      required
                      fullWidth
                      id="Last_name"
                      label="שם משפחה"
                      name="Last_name"
                      autoComplete="family-name"
                      value={customer.Last_name}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      required
                      fullWidth
                      id="Cell"
                      label="נייד"
                      name="Cell"
                      type="tel"
                      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                      autoComplete="tel"
                      value={customer.Cell}
                      onChange={handleChange}
                      error={!!fieldErrors.Cell}
                      helperText={fieldErrors.Cell}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      required
                      fullWidth
                      id="Budget"
                      label="תקציב"
                      name="Budget"
                      type="number"
                      value={customer.Budget}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                      }}
                      error={!!fieldErrors.Budget}
                      helperText={fieldErrors.Budget}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      required
                      fullWidth
                      id="Rooms"
                      label="מספר חדרים"
                      name="Rooms"
                      type="number"
                      value={customer.Rooms}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      required
                      fullWidth
                      id="Square_meters"
                      label="מטרים מרובעים"
                      name="Square_meters"
                      type="number"
                      value={customer.Square_meters}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      required
                      fullWidth
                      id="Preferred_floor"
                      label="קומה מועדפת"
                      name="Preferred_floor"
                      type="number"
                      value={customer.Preferred_floor}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      required
                      fullWidth
                      id="City"
                      label="עיר"
                      name="City"
                      value={customer.City}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <StyledTextField
                      fullWidth
                      id="Area"
                      label="אזור"
                      name="Area"
                      value={customer.Area}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1.1rem' }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'הוסף לקוח'}
                </Button>
              </Box>
            </Box>
          </StyledPaper>
        </Box>
        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={error ? "error" : "success"}>
            {error || 'הלקוח נוסף בהצלחה!'}
          </Alert>
        </Snackbar>
      </Container>
    </CacheProvider>
  );
};

export default AddCustomer;
