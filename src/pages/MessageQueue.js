import React, { useState } from 'react';
import { useMessageContext } from '../context/MessageContext.js';import { Container, Typography, Paper, List, ListItem, ListItemText, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Box, Divider, Tabs, Tab } from '@mui/material';
import MuiAlert from '@mui/material/Alert';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const MessageQueue = () => {
  const { state, dispatch } = useMessageContext();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [editedMessage, setEditedMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const handleEdit = (message, index, isFailedMessage = false) => {
    setSelectedMessage({ ...message, index, isFailedMessage });
    setEditedMessage(message.message);
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (selectedMessage.isFailedMessage) {
      dispatch({ 
        type: 'UPDATE_FAILED_MESSAGE', 
        payload: { index: selectedMessage.index, message: { ...selectedMessage, message: editedMessage } }
      });
    } else {
      dispatch({ 
        type: 'UPDATE_MESSAGE', 
        payload: { index: selectedMessage.index, message: { ...selectedMessage, message: editedMessage } }
      });
    }
    setOpenDialog(false);
    setSnackbarMessage('ההודעה עודכנה בהצלחה');
    setOpenSnackbar(true);
  };

  const handleRemove = (index, isFailedMessage = false) => {
    if (isFailedMessage) {
      dispatch({ type: 'REMOVE_FAILED_MESSAGE', payload: index });
    } else {
      dispatch({ type: 'REMOVE_FROM_QUEUE', payload: index });
    }
    setSnackbarMessage('ההודעה הוסרה');
    setOpenSnackbar(true);
  };

  const handleStartSending = () => {
    dispatch({ type: 'START_SENDING' });
    setSnackbarMessage('התחלת שליחת הודעות');
    setOpenSnackbar(true);
  };

  const handleStopSending = () => {
    dispatch({ type: 'STOP_SENDING' });
    setSnackbarMessage('שליחת ההודעות הופסקה');
    setOpenSnackbar(true);
  };

  const handleRetryFailedMessage = (message, index) => {
    dispatch({ type: 'ADD_TO_QUEUE', payload: [message] });
    dispatch({ type: 'REMOVE_FAILED_MESSAGE', payload: index });
    setSnackbarMessage('ההודעה הועברה חזרה לתור השליחה');
    setOpenSnackbar(true);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom align="center">
        ניהול תור הודעות
      </Typography>
      <Paper elevation={3} style={{ padding: '20px', marginBottom: '20px' }}>
        <Typography variant="h6" gutterBottom>
          סטטוס: {state.sending ? 'שולח הודעות' : 'ממתין'}
        </Typography>
        <Typography variant="body1" gutterBottom>
          הודעות בתור: {state.queue.length}
        </Typography>
        <Typography variant="body1" gutterBottom>
          הודעות שנכשלו: {state.failedMessages.length}
        </Typography>
        <Typography variant="body1" gutterBottom>
          הודעות שנשלחו היום: {state.dailyMessageCount}
        </Typography>
        <Box mt={2}>
          <Button 
            variant="contained" 
            color={state.sending ? "secondary" : "primary"}
            onClick={state.sending ? handleStopSending : handleStartSending}
            fullWidth
          >
            {state.sending ? 'עצור שליחה' : 'התחל שליחה'}
          </Button>
        </Box>
      </Paper>
      
      <Tabs value={tabValue} onChange={handleTabChange} centered>
        <Tab label="תור הודעות" />
        <Tab label="הודעות שנכשלו" />
      </Tabs>

      {tabValue === 0 && (
        <List>
          {state.queue.map((message, index) => (
            <Paper key={index} elevation={2} style={{ margin: '10px 0', padding: '10px' }}>
              <ListItem>
                <ListItemText 
                  primary={`${message.customer.First_name} ${message.customer.Last_name} - ${message.customer.Cell}`}
                  secondary={message.message}
                />
                <Button onClick={() => handleEdit(message, index)}>ערוך</Button>
                <Button onClick={() => handleRemove(index)}>הסר</Button>
              </ListItem>
            </Paper>
          ))}
          {state.queue.length === 0 && (
            <Typography variant="body1" align="center">
              אין הודעות בתור כרגע
            </Typography>
          )}
        </List>
      )}

      {tabValue === 1 && (
        <List>
          {state.failedMessages.map((message, index) => (
            <Paper key={index} elevation={2} style={{ margin: '10px 0', padding: '10px' }}>
              <ListItem>
                <ListItemText 
                  primary={`${message.customer.First_name} ${message.customer.Last_name} - ${message.customer.Cell}`}
                  secondary={`${message.message}\nשגיאה: ${message.error}`}
                />
                <Button onClick={() => handleEdit(message, index, true)}>ערוך</Button>
                <Button onClick={() => handleRetryFailedMessage(message, index)}>נסה שוב</Button>
                <Button onClick={() => handleRemove(index, true)}>הסר</Button>
              </ListItem>
            </Paper>
          ))}
          {state.failedMessages.length === 0 && (
            <Typography variant="body1" align="center">
              אין הודעות שנכשלו
            </Typography>
          )}
        </List>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>ערוך הודעה</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editedMessage}
            onChange={(e) => setEditedMessage(e.target.value)}
            style={{ marginTop: '10px' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>ביטול</Button>
          <Button onClick={handleSave} color="primary">שמור</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setOpenSnackbar(false)}>
        <Alert onClose={() => setOpenSnackbar(false)} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MessageQueue;