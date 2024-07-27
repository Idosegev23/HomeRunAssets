// CustomerFilterDialog.js
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Slider, Typography, Grid } from '@mui/material';

const CustomerFilterDialog = ({ open, filters, onClose, onFilterChange, onApplyFilters, onClearFilters }) => {
  // מטפל בשינויים בשדות טקסט
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  // מטפל בשינויים במחוונים (sliders)
  const handleSliderChange = (name) => (_, newValue) => {
    onFilterChange({ ...filters, [name]: newValue });
  };

  return (
    <Dialog open={open} onClose={onClose} className="dialog">
      <DialogTitle className="dialog-title">סינון לקוחות</DialogTitle>
      <DialogContent className="dialog-content">
        <Grid container spacing={2}>
          {/* שדות טקסט לסינון */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="שם פרטי"
              name="First_name"
              value={filters.First_name}
              onChange={handleChange}
              className="filter-input"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="שם משפחה"
              name="Last_name"
              value={filters.Last_name}
              onChange={handleChange}
              className="filter-input"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="נייד"
              name="Cell"
              value={filters.Cell}
              onChange={handleChange}
              className="filter-input"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="עיר"
              name="City"
              value={filters.City}
              onChange={handleChange}
              className="filter-input"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="אזור"
              name="Area"
              value={filters.Area}
              onChange={handleChange}
              className="filter-input"
            />
          </Grid>

          {/* מחוון לסינון לפי תקציב */}
          <Grid item xs={12}>
            <Typography gutterBottom>תקציב</Typography>
            <Slider
              value={[filters.BudgetMin, filters.BudgetMax]}
              onChange={handleSliderChange('Budget')}
              valueLabelDisplay="auto"
              min={0}
              max={10000000}
              step={100000}
            />
          </Grid>

          {/* מחוון לסינון לפי מספר חדרים */}
          <Grid item xs={12}>
            <Typography gutterBottom>חדרים רצויים</Typography>
            <Slider
              value={filters.Rooms}
              onChange={handleSliderChange('Rooms')}
              valueLabelDisplay="auto"
              min={0}
              max={10}
              step={1}
            />
          </Grid>

          {/* מחוון לסינון לפי שטח */}
          <Grid item xs={12}>
            <Typography gutterBottom>שטח רצוי (מר)</Typography>
            <Slider
              value={filters.Square_meters}
              onChange={handleSliderChange('Square_meters')}
              valueLabelDisplay="auto"
              min={0}
              max={500}
              step={10}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className="dialog-actions">
        <Button onClick={onClearFilters} color="secondary">
          נקה
        </Button>
        <Button onClick={onApplyFilters} color="primary">
          החל סינון
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerFilterDialog;