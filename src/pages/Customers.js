import React, { useEffect, useState } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, Snackbar } from '@mui/material';
import { styled } from '@mui/material/styles';
import MuiAlert from '@mui/material/Alert';
import api from '../utils/api';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  textAlign: 'right',
}));

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    console.log('Fetching customers');
    api.get('/dataHandler', { params: { resource: 'customers' } })
      .then(response => {
        console.log('Fetched customers:', response.data);
        setCustomers(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching customers:', error);
        setError('שגיאה בטעינת הלקוחות. אנא נסה שוב מאוחר יותר.');
        setLoading(false);
        setOpenSnackbar(true);
      });
  }, []);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Container>
      <Typography variant="h4" align="center" gutterBottom>
        לקוחות
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>שם פרטי</StyledTableCell>
              <StyledTableCell>שם משפחה</StyledTableCell>
              <StyledTableCell>טלפון</StyledTableCell>
              <StyledTableCell>תקציב</StyledTableCell>
              <StyledTableCell>מספר חדרים רצוי</StyledTableCell>
              <StyledTableCell>גודל רצוי (מ"ר)</StyledTableCell>
              <StyledTableCell>קומה מועדפת</StyledTableCell>
              <StyledTableCell>אזור</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map(customer => (
              <TableRow key={customer.id}>
                <StyledTableCell>{customer.fields['שם פרטי']}</StyledTableCell>
                <StyledTableCell>{customer.fields['שם משפחה']}</StyledTableCell>
                <StyledTableCell>{customer.fields['טלפון']}</StyledTableCell>
                <StyledTableCell>{customer.fields['תקציב']}</StyledTableCell>
                <StyledTableCell>{customer.fields['מספר חדרים רצוי']}</StyledTableCell>
                <StyledTableCell>{customer.fields['גודל רצוי']}</StyledTableCell>
                <StyledTableCell>{customer.fields['קומה מועדפת']}</StyledTableCell>
                <StyledTableCell>{customer.fields['אזור']}</StyledTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Customers;
