// CustomerEditDialog.js
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid } from '@mui/material';

const CustomerEditDialog = ({ open, customer, onClose, onSave }) => {
  const [editedCustomer, setEditedCustomer] = useState({});

  useEffect(() => {
    setEditedCustomer(customer || {});
  }, [customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(editedCustomer);
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
              value={editedCustomer.Cell || ''}
              onChange={handleChange}
              className="filter-input"
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
              className="filter-input"
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
              className="filter-input"
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
              className="filter-input"
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
        <Button onClick={handleSave} color="primary">
          שמור
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerEditDialog;