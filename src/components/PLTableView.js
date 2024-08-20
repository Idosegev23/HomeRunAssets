import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Tooltip,
  IconButton
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { styled } from '@mui/material/styles.js';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  maxHeight: '60vh',
  '&::-webkit-scrollbar': {
    width: '0.4em'
  },
  '&::-webkit-scrollbar-track': {
    boxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
    webkitBoxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(0,0,0,.1)',
    outline: '1px solid slategrey'
  }
}));

const StyledTable = styled(Table)(({ theme }) => ({
  minWidth: 750,
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
  transition: 'background-color 0.3s ease',
}));

const parseCurrency = (value) => {
  if (typeof value === 'number') return value;
  return parseFloat(value?.replace(/[^\d.-]/g, '') || '0');
};

const PLTableView = ({ properties, handlePropertySelect, selectedProperty, handleSendMessages, sortConfig, handleSort }) => {
  const headers = [
    { label: 'רחוב', key: 'street' },
    { label: 'עיר', key: 'city' },
    { label: 'מקס קומות בבניין', key: 'max_floor' },
    { label: 'קומה', key: 'floor' },
    { label: 'מ"ר', key: 'square_meters' },
    { label: 'מס חדרים', key: 'rooms' },
    { label: 'מחיר', key: 'price' },
    { label: 'פעולות', key: null }
  ];

  return (
    <StyledTableContainer component={Paper}>
      <StyledTable stickyHeader>
        <TableHead>
          <TableRow>
            {headers.map((header) => (
              <StyledTableCell key={header.key || header.label} align="right">
                {header.key ? (
                  <TableSortLabel
                    active={sortConfig.key === header.key}
                    direction={sortConfig.key === header.key ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort(header.key)}
                  >
                    {header.label}
                  </TableSortLabel>
                ) : (
                  header.label
                )}
              </StyledTableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {properties.map((property) => (
            <StyledTableRow 
              key={property.id}
              onClick={() => handlePropertySelect(property)}
              selected={selectedProperty && selectedProperty.id === property.id}
              hover
            >
              <TableCell align="right">{property.street || 'N/A'}</TableCell>
              <TableCell align="right">{property.city || 'N/A'}</TableCell>
              <TableCell align="right">{property.max_floor || 'N/A'}</TableCell>
              <TableCell align="right">{property.floor || 'N/A'}</TableCell>
              <TableCell align="right">{property.square_meters || 'N/A'}</TableCell>
              <TableCell align="right">{property.rooms || 'N/A'}</TableCell>
              <TableCell align="right">{property.price ? `${parseCurrency(property.price).toLocaleString()} ₪` : 'N/A'}</TableCell>
              <TableCell align="right">
                <Tooltip title="שלח הודעות">
                  <IconButton
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendMessages(property);
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </StyledTable>
    </StyledTableContainer>
  );
};

export default PLTableView;