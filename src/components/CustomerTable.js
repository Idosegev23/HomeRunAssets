// CustomerTable.js
import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import FilterListIcon from '@mui/icons-material/FilterList';
import ChatIcon from '@mui/icons-material/Chat';

const CustomerTable = ({ customers, sortConfig, onSort, onEdit, onFindProperties, onSendMessage }) => {
  return (
    <TableContainer>
      <Table className="customer-table">
        <TableHead>
          <TableRow>
            <TableCell>
              <button className="sort-button" onClick={() => onSort('First_name')}>
                שם פרטי {sortConfig.key === 'First_name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </button>
            </TableCell>
            <TableCell>
              <button className="sort-button" onClick={() => onSort('Last_name')}>
                שם משפחה {sortConfig.key === 'Last_name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </button>
            </TableCell>
            <TableCell>נייד</TableCell>
            <TableCell>תקציב</TableCell>
            <TableCell>חדרים רצויים</TableCell>
            <TableCell>שטח רצוי (מר)</TableCell>
            <TableCell>עיר</TableCell>
            <TableCell>אזור</TableCell>
            <TableCell>פעולות</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>{customer.First_name}</TableCell>
              <TableCell>{customer.Last_name}</TableCell>
              <TableCell>{customer.Cell}</TableCell>
              <TableCell>{customer.Budget ? `${Number(customer.Budget).toLocaleString()} ₪` : 'N/A'}</TableCell>
              <TableCell>{customer.Rooms}</TableCell>
              <TableCell>{customer.Square_meters}</TableCell>
              <TableCell>{customer.City}</TableCell>
              <TableCell>{customer.Area}</TableCell>
              <TableCell>
                <Tooltip title="ערוך לקוח">
                  <IconButton className="action-button edit-button" onClick={() => onEdit(customer)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="התאם נכסים">
                  <IconButton className="action-button match-button" onClick={() => onFindProperties(customer)}>
                    <FilterListIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="שלח הודעה">
                  <IconButton className="action-button message-button" onClick={() => onSendMessage(customer)}>
                    <ChatIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CustomerTable;