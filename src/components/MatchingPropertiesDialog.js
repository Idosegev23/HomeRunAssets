import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Checkbox, 
  FormControlLabel, 
  CircularProgress, 
  Box
} from '@mui/material';
import api from '../utils/api';

const MatchingPropertiesDialog = ({ open, onClose, selectedCustomer, onSendMessage }) => {
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [matchingProperties, setMatchingProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && selectedCustomer) {
      fetchMatchingProperties();
    }
  }, [open, selectedCustomer]);

  const fetchMatchingProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/dataHandler?resource=matchingProperties&id=${selectedCustomer.id}`);
      if (response.data && Array.isArray(response.data)) {
        setMatchingProperties(response.data);
      } else {
        throw new Error('Invalid data received from server');
      }
    } catch (error) {
      console.error('Error fetching matching properties:', error);
      setError(`Failed to fetch matching properties: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyToggle = (propertyId) => {
    setSelectedProperties(prevSelected => {
      if (prevSelected.includes(propertyId)) {
        return prevSelected.filter(id => id !== propertyId);
      } else {
        return [...prevSelected, propertyId];
      }
    });
  };

  const handleSendMessages = async () => {
    try {
      const cleanCustomer = { ...selectedCustomer };
      const cleanProperties = selectedProperties.map(id => 
        matchingProperties.find(property => property.id === id)
      );

      await onSendMessage(cleanCustomer, cleanProperties);
      onClose();
    } catch (error) {
      console.error('Error sending messages:', error);
      setError(`Failed to send messages: ${error.message}`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>נכסים מתאימים</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : matchingProperties.length > 0 ? (
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
        <Button onClick={onClose}>סגור</Button>
        <Button 
          onClick={handleSendMessages} 
          disabled={selectedProperties.length === 0}
          color="primary"
          variant="contained"
        >
          שלח הודעה
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MatchingPropertiesDialog;