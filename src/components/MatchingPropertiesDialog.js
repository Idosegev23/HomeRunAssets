import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Card, CardContent, Typography, Checkbox, FormControlLabel } from '@mui/material';

const MatchingPropertiesDialog = ({ open, onClose, matchingProperties, selectedCustomer, onSendMessage }) => {
  const [selectedProperties, setSelectedProperties] = useState([]);

  const handlePropertyToggle = (property) => {
    setSelectedProperties(prevSelected => {
      if (prevSelected.includes(property)) {
        return prevSelected.filter(p => p !== property);
      } else {
        return [...prevSelected, property];
      }
    });
  };

  const handleSendMessages = () => {
    onSendMessage(selectedCustomer, selectedProperties);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>נכסים מתאימים</DialogTitle>
      <DialogContent>
        {matchingProperties.length > 0 ? (
          <Grid container spacing={2}>
            {matchingProperties.map(({ id, address, price, rooms, floor, square_meters, totalMatchPercentage, matchDetails }) => (
              <Grid item xs={12} sm={6} md={4} key={id}>
                <Card>
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedProperties.includes(id)}
                          onChange={() => handlePropertyToggle(id)}
                        />
                      }
                      label={address}
                    />
                    <Typography>מחיר: {Number(price).toLocaleString()} ₪</Typography>
                    <Typography>חדרים: {rooms}</Typography>
                    <Typography>קומה: {floor}</Typography>
                    <Typography>שטח: {square_meters} מ"ר</Typography>
                    <Typography color="primary">התאמה כוללת: {totalMatchPercentage}%</Typography>
                    <Typography color="secondary">פרטי חוסר התאמה: {matchDetails}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography>לא נמצאו נכסים מתאימים.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSendMessages} disabled={selectedProperties.length === 0}>
          שלח הודעה
        </Button>
        <Button onClick={onClose}>סגור</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MatchingPropertiesDialog;
