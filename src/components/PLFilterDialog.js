import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, Typography, Slider, Button, Fade } from '@mui/material';
import { SliderContainer } from './PropertyListStyles.js';
const PLFilterDialog = ({
  open,
  onClose,
  filters,
  handleFilterChange,
  priceRange,
  handlePriceChange,
  squareMetersRange,
  handleSquareMetersChange,
  clearFilters,
  applyFilters
}) => {
  const formatPriceLabel = (value) => `${value.toLocaleString()} ₪`;
  const formatSquareMetersLabel = (value) => `${value} מ"ר`;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 500 }}
    >
      <DialogTitle>סינון נכסים</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {/* ... (TextField components for city, street, rooms, etc.) */}
          <Grid item xs={12}>
            <Typography gutterBottom>טווח מחירים</Typography>
            <SliderContainer>
              <Slider
                value={priceRange}
                onChange={handlePriceChange}
                valueLabelDisplay="auto"
                aria-labelledby="price-range-slider"
                min={0}
                max={10000000}
                step={100000}
                valueLabelFormat={formatPriceLabel}
              />
            </SliderContainer>
          </Grid>
          <Grid item xs={12}>
            <Typography gutterBottom>טווח שטח (מ"ר)</Typography>
            <SliderContainer>
              <Slider
                value={squareMetersRange}
                onChange={handleSquareMetersChange}
                valueLabelDisplay="auto"
                aria-labelledby="square-meters-range-slider"
                min={0}
                max={500}
                step={10}
                valueLabelFormat={formatSquareMetersLabel}
              />
            </SliderContainer>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={clearFilters} color="secondary">
          נקה הכל
        </Button>
        <Button onClick={applyFilters} color="primary">
          החל סינון
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PLFilterDialog;