 import { styled } from '@mui/material/styles';
import { AppBar, TableContainer, Table, TableCell, TableRow, Card } from '@mui/material';

export const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
  marginBottom: theme.spacing(4),
  boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
}));

export const Root = styled('div')(({ theme }) => ({
  width: '100%',
}));

export const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
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

export const StyledTable = styled(Table)(({ theme }) => ({
  minWidth: 750,
}));

export const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
}));

export const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
  transition: 'background-color 0.3s ease',
}));

export const PropertyCard = styled(Card)(({ theme }) => ({
  margin: theme.spacing(1),
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.03)',
  },
}));

export const SliderContainer = styled('div')(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(0, 2),
}));