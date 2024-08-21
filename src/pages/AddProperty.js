import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box, Snackbar, Paper, Grid, InputAdornment } from '@mui/material';
 import { styled } from '@mui/material/styles/index.js';
import MuiAlert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import HomeIcon from '@mui/icons-material/Home/index.js';
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
  direction: 'rtl',
  textAlign: 'right',
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const AddProperty = () => {
  const [property, setProperty] = useState({
    price: '',
    rooms: '',
    square_meters: '',
    floor: '',
    max_floor: '',
    city: '',
    street: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'price') {
      const numericValue = value.replace(/[^\d]/g, '');
      const formattedValue = Number(numericValue).toLocaleString();
      setProperty(prevProperty => ({ ...prevProperty, [name]: formattedValue }));
    } else {
      setProperty(prevProperty => ({ ...prevProperty, [name]: value }));
    }
    if (fieldErrors[name]) {
      setFieldErrors(prevErrors => ({ ...prevErrors, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (property.price === '' || isNaN(Number(property.price.replace(/,/g, '')))) {
      newErrors.price = 'יש להזין מחיר תקין';
    }
    if (property.rooms === '' || isNaN(Number(property.rooms))) {
      newErrors.rooms = 'יש להזין מספר חדרים תקין';
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
      const formattedProperty = {
        ...property,
        price: Number(property.price.replace(/,/g, '')),
        rooms: Number(property.rooms),
        square_meters: Number(property.square_meters),
        floor: Number(property.floor),
        max_floor: Number(property.max_floor)
      };
      await api.post('/dataHandler', { resource: 'properties', data: formattedProperty });
      setLoading(false);
      setOpenSnackbar(true);
      setProperty({
        price: '',
        rooms: '',
        square_meters: '',
        floor: '',
        max_floor: '',
        city: '',
        street: ''
      });
    } catch (error) {
      setError('שגיאה בהוספת הנכס. אנא נסה שוב.');
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
                הוספת נכס חדש
              </Typography>
              <HomeIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      required
                      fullWidth
                      id="price"
                      label="מחיר"
                      name="price"
                      value={property.price}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                      }}
                      error={!!fieldErrors.price}
                      helperText={fieldErrors.price}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      required
                      fullWidth
                      id="rooms"
                      label="מספר חדרים"
                      name="rooms"
                      type="number"
                      inputProps={{ step: "0.5" }}
                      value={property.rooms}
                      onChange={handleChange}
                      error={!!fieldErrors.rooms}
                      helperText={fieldErrors.rooms}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      required
                      fullWidth
                      id="square_meters"
                      label="מטרים רבועים"
                      name="square_meters"
                      type="number"
                      value={property.square_meters}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      required
                      fullWidth
                      id="floor"
                      label="קומה"
                      name="floor"
                      type="number"
                      value={property.floor}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      required
                      fullWidth
                      id="max_floor"
                      label="מספר קומות בבניין"
                      name="max_floor"
                      type="number"
                      value={property.max_floor}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      required
                      fullWidth
                      id="city"
                      label="עיר"
                      name="city"
                      value={property.city}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <StyledTextField
                      required
                      fullWidth
                      id="street"
                      label="רחוב"
                      name="street"
                      value={property.street}
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
                  {loading ? <CircularProgress size={24} /> : 'הוסף נכס'}
                </Button>
              </Box>
            </Box>
          </StyledPaper>
        </Box>
        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={error ? "error" : "success"}>
            {error || 'הנכס נוסף בהצלחה!'}
          </Alert>
        </Snackbar>
      </Container>
    </CacheProvider>
  );
};

export default AddProperty;
