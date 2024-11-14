import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid } from '@mui/material';

const CustomerEditDialog = ({ open, customer, onClose, onSave }) => {
  const [editedCustomer, setEditedCustomer] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setEditedCustomer(customer || {});
    setErrors({});
  }, [customer]);

  const validateNumber = (value, fieldName) => {
    if (value === '' || value === null || value === undefined) return true;
    const num = Number(value);
    switch (fieldName) {
      case 'Square_meters':
      case 'Budget':
      case 'Cell':
        return Number.isInteger(num) && num >= 0;
      case 'Rooms':
        return num >= 0 && Number.isInteger(num * 10); // Allow one decimal point
      default:
        return true;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convert empty string to undefined for optional number fields
    const processedValue = value === '' ? undefined : 
      (e.target.type === 'number' ? Number(value) : value);

    // Validate number fields
    if (e.target.type === 'number') {
      if (!validateNumber(value, name)) {
        setErrors(prev => ({
          ...prev,
          [name]: 'ערך לא תקין'
        }));
        return;
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }

    setEditedCustomer(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSave = async () => {
    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      const response = await fetch('/api/dataHandler?resource=customers', {
        method: customer?.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedCustomer),
      });

      if (!response.ok) {
        throw new Error('Failed to save customer');
      }

      const savedCustomer = await response.json();
      onSave(savedCustomer);
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="dialog">
      <DialogTitle className="dialog-title">
        {customer?.id ? 'עריכת לקוח' : 'הוספת לקוח חדש'}
      </DialogTitle>
      <DialogContent className="dialog-content">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="שם פרטי"
              name="First_name"
              value={editedCustomer.First_name || ''}
              onChange={handleChange}
              className="filter-input"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="שם משפחה"
              name="Last_name"
              value={editedCustomer.Last_name || ''}
              onChange={handleChange}
              className="filter-input"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="נייד"
              name="Cell"
              type="number"
              value={editedCustomer.Cell || ''}
              onChange={handleChange}
              error={!!errors.Cell}
              helperText={errors.Cell}
              className="filter-input"
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="תקציב"
              name="Budget"
              type="number"
              value={editedCustomer.Budget || ''}
              onChange={handleChange}
              error={!!errors.Budget}
              helperText={errors.Budget}
              className="filter-input"
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="חדרים רצויים"
              name="Rooms"
              type="number"
              value={editedCustomer.Rooms || ''}
              onChange={handleChange}
              error={!!errors.Rooms}
              helperText={errors.Rooms}
              className="filter-input"
              inputProps={{ min: 0, step: 0.5 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="שטח רצוי (מר)"
              name="Square_meters"
              type="number"
              value={editedCustomer.Square_meters || ''}
              onChange={handleChange}
              error={!!errors.Square_meters}
              helperText={errors.Square_meters}
              className="filter-input"
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="עיר"
              name="City"
              value={editedCustomer.City || ''}
              onChange={handleChange}
              className="filter-input"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="אזור"
              name="Area"
              value={editedCustomer.Area || ''}
              onChange={handleChange}
              className="filter-input"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className="dialog-actions">
        <Button onClick={onClose} color="secondary">
          ביטול
        </Button>
        <Button 
          onClick={handleSave} 
          color="primary"
          disabled={Object.keys(errors).length > 0}
        >
          שמור
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerEditDialog;
