import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import MuiAlert from '@mui/material/Alert';

const useStyles = styled((theme) => ({
  chatContainer: {
    height: '400px',
    overflowY: 'auto',
    padding: theme.spacing(2),
  },
  messageBubble: {
    padding: theme.spacing(1),
    borderRadius: '20px',
    maxWidth: '70%',
    marginBottom: theme.spacing(1),
  },
  customerMessage: {
    backgroundColor: theme.palette.primary.light,
    alignSelf: 'flex-start',
  },
  agentMessage: {
    backgroundColor: theme.palette.secondary.light,
    alignSelf: 'flex-end',
  },
  messageInput: {
    marginTop: theme.spacing(2),
  },
}));

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const ChatDialog = ({ open, onClose, customer }) => {
  const classes = useStyles();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    if (customer) {
      fetchChatHistory();
    }
  }, [customer]);

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/chat-history/${customer.id}`);
      setMessages(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setError('שגיאה בטעינת היסטוריית השיחה. אנא נסה שוב מאוחר יותר.');
      setLoading(false);
      setOpenSnackbar(true);
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    try {
      const response = await axios.post('/api/send-message', {
        customerId: customer.id,
        message: newMessage,
        sender: 'agent',
      });

      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('שגיאה בשליחת ההודעה. אנא נסה שוב.');
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>שיחה עם {customer?.שם_פרטי} {customer?.שם_משפחה}</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : (
          <Paper className={classes.chatContainer}>
            <List>
              {messages.map((message, index) => (
                <ListItem
                  key={index}
                  className={`${classes.messageBubble} ${
                    message.sender === 'customer' ? classes.customerMessage : classes.agentMessage
                  }`}
                >
                  <ListItemText
                    primary={message.content}
                    secondary={new Date(message.timestamp).toLocaleString()}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
        <TextField
          className={classes.messageInput}
          fullWidth
          variant="outlined"
          placeholder="הקלד הודעה..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          סגור
        </Button>
        <Button onClick={handleSendMessage} color="primary" variant="contained">
          שלח
        </Button>
      </DialogActions>
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default ChatDialog;
