import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Card, CardContent, Typography } from '@mui/material';

const MatchingPropertiesDialog = ({ open, onClose, matchingProperties, selectedCustomer, onSendMessage }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>נכסים מתאימים</DialogTitle>
      <DialogContent>
        {matchingProperties.length > 0 ? (
          <Grid container spacing={2}>
            {matchingProperties.map(({ property, priceMatch, roomsMatch, cityMatch, floorMatch, sizeMatch, totalMatchPercentage }) => (
              <Grid item xs={12} sm={6} md={4} key={property.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{`${property.city}, ${property.street}`}</Typography>
                    <Typography>מחיר: {Number(property.price).toLocaleString()} ₪</Typography>
                    <Typography>חדרים: {property.rooms}</Typography>
                    <Typography>קומה: {property.floor}</Typography>
                    <Typography>שטח: {property.square_meters} מ"ר</Typography>
                    <Typography color="primary">התאמה כוללת: {totalMatchPercentage.toFixed(1)}%</Typography>
                    <Typography>התאמת מחיר: {priceMatch ? 'מתאים' : 'לא מתאים'}</Typography>
                    <Typography>התאמת חדרים: {roomsMatch}</Typography>
                    <Typography>התאמת עיר: {cityMatch}</Typography>
                    <Typography>התאמת קומה: {floorMatch}</Typography>
                    <Typography>התאמת גודל: {sizeMatch}</Typography>
                    <Button onClick={() => onSendMessage(selectedCustomer, property)}>
                      שלח הודעה
                    </Button>
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
        <Button onClick={onClose}>סגור</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MatchingPropertiesDialog;