import React, { useState } from 'react';
import { Paper, Typography, Button, TextField, List, Checkbox, Card, CardContent, Grid, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search/index.js';
import PreviewIcon from '@mui/icons-material/Visibility/index.js';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney/index.js';
import HomeIcon from '@mui/icons-material/Home/index.js';
import LocationOnIcon from '@mui/icons-material/LocationOn/index.js';

const parseCurrency = (value) => {
  if (typeof value === 'number') return value;
  return parseFloat(value?.replace(/[^\d.-]/g, '') || '0');
};

const SMCustomerList = ({ eligibleCustomers, selectedCustomers, setSelectedCustomers }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleCustomerToggle = (customerId) => {
    setSelectedCustomers(prevSelected =>
      prevSelected.includes(customerId)
        ? prevSelected.filter(id => id !== customerId)
        : [...prevSelected, customerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === eligibleCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(eligibleCustomers.map(customer => customer.id));
    }
  };

  return (
    <Paper className="customer-list-paper">
      <Typography variant="h6" gutterBottom>לקוחות מתאימים</Typography>
      <Button
        variant="outlined"
        onClick={handleSelectAll}
        className="select-all-button"
      >
        {selectedCustomers.length === eligibleCustomers.length ? 'בטל בחירת הכל' : 'בחר הכל'}
      </Button>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="חיפוש לקוחות..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon />,
        }}
        className="search-input"
      />
      <List>
        {eligibleCustomers.filter(customer =>
          `${customer.First_name} ${customer.Last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
        ).map((customer) => (
          <Card key={customer.id} className="customer-card">
            <CardContent>
              <Grid container alignItems="center" spacing={1}>
                <Grid item>
                  <Checkbox
                    checked={selectedCustomers.includes(customer.id)}
                    onChange={() => handleCustomerToggle(customer.id)}
                  />
                </Grid>
                <Grid item xs>
                  <Typography variant="h6">
                    {customer.First_name} {customer.Last_name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <AttachMoneyIcon fontSize="small" /> תקציב: {parseCurrency(customer.Budget).toLocaleString()} ₪
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <HomeIcon fontSize="small" /> חדרים רצויים: {customer.Rooms}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <LocationOnIcon fontSize="small" /> אזור מועדף: {customer.Area}
                  </Typography>
                </Grid>
                <Grid item>
                  <IconButton>
                    <PreviewIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </List>
    </Paper>
  );
};

export default SMCustomerList;