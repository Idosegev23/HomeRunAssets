import React from 'react';
import { Grid, CardContent, CardActions, Typography, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send/index.js';
import { PropertyCard } from './PropertyListStyles.js';
const PLCardView = ({ properties, handleSendMessages }) => {
  const parseCurrency = (value) => {
    if (typeof value === 'number') return value;
    return parseFloat(value?.replace(/[^\d.-]/g, '') || '0');
  };

  return (
    <Grid container spacing={2}>
      {properties.map((property) => (
        <Grid item xs={12} sm={6} md={4} key={property.id}>
          <PropertyCard>
            <CardContent>
              <Typography variant="h6">{property.city}, {property.street}</Typography>
              <Typography>מחיר: {property.price ? `${parseCurrency(property.price).toLocaleString()} ₪` : 'N/A'}</Typography>
              <Typography>חדרים: {property.rooms || 'N/A'}</Typography>
              <Typography>שטח: {property.square_meters || 'N/A'} מ"ר</Typography>
              <Typography>קומה: {property.floor || 'N/A'}</Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                color="primary"
                onClick={() => handleSendMessages(property)}
                startIcon={<SendIcon />}
              >
                שלח הודעות
              </Button>
            </CardActions>
          </PropertyCard>
        </Grid>
      ))}
    </Grid>
  );
};

export default PLCardView;