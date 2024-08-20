import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, 
  CircularProgress, Snackbar, Paper, TableContainer, TablePagination, TableSortLabel
} from '@mui/material';
 import { styled } from '@mui/material/styles';
import MuiAlert from '@mui/material/Alert';
import api from '../utils/api.js';
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [orderBy, setOrderBy] = useState('מחיר');
  const [order, setOrder] = useState('asc');

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await api.get('/dataHandler', { params: { resource: 'properties' } });
        setProperties(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setError('שגיאה בטעינת הנכסים. אנא נסה שוב מאוחר יותר.');
        setLoading(false);
        setOpenSnackbar(true);
      }
    };

    fetchProperties();
  }, []);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const sortedProperties = properties.sort((a, b) => {
    if (b.fields[orderBy] < a.fields[orderBy]) {
      return order === 'asc' ? 1 : -1;
    }
    if (b.fields[orderBy] > a.fields[orderBy]) {
      return order === 'asc' ? -1 : 1;
    }
    return 0;
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        נכסים
      </Typography>
      <Paper sx={{ width: '100%', mb: 2 }}>
        {loading ? (
          <CircularProgress sx={{ display: 'block', margin: 'auto', my: 2 }} />
        ) : (
          <>
            <TableContainer>
              <Table aria-label="טבלת נכסים">
                <TableHead>
                  <TableRow>
                    {['מחיר', 'מס חדרים', 'מר', 'קומה', 'עיר', 'רחוב'].map((column) => (
                      <StyledTableCell key={column} sortDirection={orderBy === column ? order : false}>
                        <TableSortLabel
                          active={orderBy === column}
                          direction={orderBy === column ? order : 'asc'}
                          onClick={() => handleRequestSort(column)}
                        >
                          {column}
                        </TableSortLabel>
                      </StyledTableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedProperties
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((property) => (
                    <StyledTableRow key={property.id} tabIndex={-1}>
                      <TableCell align="right">{property.fields.מחיר}</TableCell>
                      <TableCell align="right">{property.fields['מס חדרים']}</TableCell>
                      <TableCell align="right">{property.fields.מר}</TableCell>
                      <TableCell align="right">{property.fields.קומה}</TableCell>
                      <TableCell align="right">{property.fields.עיר}</TableCell>
                      <TableCell align="right">{property.fields.רחוב}</TableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={properties.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="שורות בעמוד:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
            />
          </>
        )}
      </Paper>
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default PropertyList;
