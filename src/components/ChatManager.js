import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Grid, Typography, Paper, List, ListItem, ListItemText, TextField, IconButton,
  Snackbar, Avatar, ThemeProvider, createTheme, CssBaseline, CircularProgress,
  Badge, Tooltip, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  Button
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MuiAlert from '@mui/material/Alert';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MicIcon from '@mui/icons-material/Mic';
import ImageIcon from '@mui/icons-material/Image';
import ReplyIcon from '@mui/icons-material/Reply';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';

const API_BASE_URL = 'http://localhost:5001/api';

// Create rtl cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// Create rtl theme
const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: 'Arial, sans-serif',
  },
});

const StyledRoot = styled('div')(({ theme }) => ({
  flexGrow: 1,
  height: '100vh',
  overflow: 'hidden',
}));

const StyledChatList = styled(Grid)(({ theme }) => ({
  height: '100%',
  overflowY: 'auto',
  borderLeft: `1px solid ${theme.palette.divider}`,
}));

const StyledChatArea = styled(Grid)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
}));

const StyledMessageList = styled(List)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
}));

const StyledMessageItem = styled(ListItem)(({ theme, type }) => ({
  marginBottom: theme.spacing(1),
  maxWidth: '70%',
  alignSelf: type === 'outgoing' ? 'flex-start' : 'flex-end',
  backgroundColor: type === 'outgoing' ? '#dcf8c6' : '#fff',
  borderRadius: type === 'outgoing' ? '20px 20px 20px 0' : '20px 20px 0 20px',
}));

const StyledInputArea = styled('div')(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(2),
  backgroundColor: '#f0f0f0',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  flexGrow: 1,
  marginLeft: theme.spacing(1),
}));

const StyledChatHeader = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: '#075e54',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
}));

const StyledSearchBar = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#f0f0f0',
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5, 1),
  marginBottom: theme.spacing(1),
}));

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const ChatManager = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const messageEndRef = useRef(null);

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching chats from server...');
      const response = await axios.get(`${API_BASE_URL}/lastIncomingMessages`);
      console.log('Successfully fetched chats');
      setChats(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching chats:', err);
      let errorMessage = 'שגיאה בטעינת השיחות. אנא נסה שוב מאוחר יותר.';
      if (err.response) {
        // השרת הגיב עם קוד סטטוס שאינו בטווח 2xx
        console.error('Server responded with error:', err.response.data);
        errorMessage = `שגיאת שרת: ${err.response.data.error}`;
        if (err.response.data.details) {
          console.error('Error details:', err.response.data.details);
        }
      } else if (err.request) {
        // הבקשה נשלחה אך לא התקבלה תשובה
        console.error('No response received:', err.request);
        errorMessage = 'לא התקבלה תשובה מהשרת. אנא בדוק את החיבור שלך.';
      } else {
        // משהו השתבש בהגדרת הבקשה
        console.error('Error setting up the request:', err.message);
        errorMessage = `שגיאה בהגדרת הבקשה: ${err.message}`;
      }
      setError(errorMessage);
      setLoading(false);
      setOpenSnackbar(true);
    }
  }, []);
  
    const fetchChatMessages = async (chatId) => {
    try {
      setLoading(true);
      console.log('Fetching chat messages...');
      const response = await axios.post(`${API_BASE_URL}/getChatHistory`, {
        chatId: chatId,
        count: 100
      });
      console.log('Successfully fetched chat messages');
      setChatMessages(response.data.reverse());
      setLoading(false);
    } catch (err) {
      console.error('Error fetching chat messages:', err);
      setError('שגיאה בטעינת היסטוריית השיחה. אנא נסה שוב מאוחר יותר.');
      setLoading(false);
      setOpenSnackbar(true);
    }
  };

  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;

    try {
      setLoading(true);
      console.log('Sending message...');
      const messageToSend = replyingTo ? `הודעה בתגובה ל: "${replyingTo.textMessage}"\n\n${newMessage}` : newMessage;
      const response = await axios.post(`${API_BASE_URL}/sendMessage`, {
        chatId: selectedChat.chatId,
        message: messageToSend
      });
      console.log('Successfully sent message');
      
      setChatMessages(prevMessages => [
        ...prevMessages,
        {
          type: 'outgoing',
          idMessage: response.data.idMessage,
          timestamp: Date.now() / 1000,
          typeMessage: 'textMessage',
          textMessage: newMessage,
          statusMessage: 'sent',
          sendByApi: true,
          replyTo: replyingTo
        }
      ]);
      
      setNewMessage('');
      setReplyingTo(null);
      setLoading(false);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('שגיאה בשליחת ההודעה. אנא נסה שוב.');
      setLoading(false);
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredChats = chats.filter(chat =>
    chat.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.textMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMenuOpen = (event, message) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMessage(null);
  };

  const handleReply = () => {
    setReplyingTo(selectedMessage);
    handleMenuClose();
  };

  const handleDelete = () => {
    setChatMessages(prevMessages => prevMessages.filter(msg => msg.idMessage !== selectedMessage.idMessage));
    handleMenuClose();
  };

  const handleEdit = () => {
    setEditingMessage(selectedMessage);
    setNewMessage(selectedMessage.textMessage);
    handleMenuClose();
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      // כאן יש להוסיף לוגיקה לעדכון ההודעה בשרת
      console.log('Updating message...');
      
      setChatMessages(prevMessages => prevMessages.map(msg => 
        msg.idMessage === editingMessage.idMessage ? { ...msg, textMessage: newMessage } : msg
      ));
      
      setNewMessage('');
      setEditingMessage(null);
      setLoading(false);
      console.log('Successfully updated message');
    } catch (err) {
      console.error('Error updating message:', err);
      setError('שגיאה בעדכון ההודעה. אנא נסה שוב.');
      setLoading(false);
      setOpenSnackbar(true);
    }
  };

  const handleOpenProfile = () => {
    setOpenProfileDialog(true);
  };

  const handleCloseProfile = () => {
    setOpenProfileDialog(false);
  };

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <StyledRoot dir="rtl" lang="he">
          <Grid container style={{ height: '100%' }}>
            <StyledChatList item xs={3}>
              <StyledSearchBar>
                <SearchIcon />
                <TextField
                  fullWidth
                  variant="standard"
                  placeholder="חיפוש..."
                  value={searchTerm}
                  onChange={handleSearch}
                  InputProps={{ disableUnderline: true }}
                />
              </StyledSearchBar>
              <List>
                {filteredChats.map((chat) => (
                  <ListItem 
                    button 
                    key={chat.id} 
                    onClick={() => setSelectedChat(chat)}
                    selected={selectedChat && selectedChat.id === chat.id}
                  >
                    <Badge color="secondary" variant="dot" invisible={!chat.unreadCount}>
                      <Avatar sx={{ marginLeft: 2 }}>{chat.senderName[0]}</Avatar>
                    </Badge>
                    <ListItemText 
                      primary={chat.senderName}
                      secondary={chat.textMessage}
                    />
                  </ListItem>
                ))}
              </List>
            </StyledChatList>
            <StyledChatArea item xs={9}>
              {selectedChat ? (
                <>
                  <StyledChatHeader>
                    <Avatar sx={{ marginLeft: 2 }} onClick={handleOpenProfile}>{selectedChat.senderName[0]}</Avatar>
                    <Typography variant="h6">{selectedChat.senderName}</Typography>
                  </StyledChatHeader>
                  <StyledMessageList>
                    {chatMessages.map((message, index) => (
                      <StyledMessageItem 
                        key={index}
                        type={message.type}
                      >
                        <Paper elevation={0} style={{ padding: '10px' }}>
                          {message.replyTo && (
                            <Typography variant="body2" style={{ fontStyle: 'italic', color: '#888' }}>
                              בתגובה ל: {message.replyTo.textMessage}
                            </Typography>
                          )}
                          <Typography variant="body1">{message.textMessage}</Typography>
                          <Typography variant="caption" style={{ textAlign: 'left', display: 'block' }}>
                            {new Date(message.timestamp * 1000).toLocaleTimeString('he-IL')}
                          </Typography>
                          <IconButton size="small" onClick={(event) => handleMenuOpen(event, message)}>
                            <MoreVertIcon />
                          </IconButton>
                        </Paper>
                      </StyledMessageItem>
                    ))}
                    <div ref={messageEndRef} />
                  </StyledMessageList>
                  {replyingTo && (
                    <Paper style={{ margin: '10px', padding: '10px', backgroundColor: '#f0f0f0' }}>
                      <Typography variant="body2">משיב ל: {replyingTo.textMessage}</Typography>
                      <IconButton size="small" onClick={() => setReplyingTo(null)}>
                        <DeleteIcon />
                      </IconButton>
                    </Paper>
                  )}
                  <StyledInputArea>
                    {editingMessage ? (
                      <>
                        <StyledTextField
                          variant="outlined"
                          placeholder="ערוך הודעה..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleUpdate();
                            }
                          }}
                        />
                        <Button onClick={handleUpdate} disabled={!newMessage.trim() || loading}>
                          עדכן
                        </Button>
                        <Button onClick={() => {
                          setEditingMessage(null);
                          setNewMessage('');
                        }}>
                          בטל
                        </Button>
                      </>
                    ) : (
                      <>
                        <IconButton color="primary" onClick={() => alert('פונקציונליות הקלטת קול תתווסף בעתיד')}>
                          <MicIcon />
                        </IconButton>
                        <IconButton color="primary" onClick={() => alert('פונקציונליות העלאת תמונה תתווסף בעתיד')}>
                          <ImageIcon />
                        </IconButton>
                        <StyledTextField
                          variant="outlined"
                          placeholder="הקלד הודעה..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                        />
                        <IconButton color="primary" onClick={sendMessage} disabled={!newMessage.trim() || loading}>
                          <SendIcon />
                        </IconButton>
                      </>
                    )}
                  </StyledInputArea>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="h6">בחר שיחה להצגה</Typography>
                </div>
              )}
            </StyledChatArea>
          </Grid>
          {loading && (
            <CircularProgress 
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: -20,
                marginLeft: -20,
              }}
            />
          )}
          <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
            <Alert onClose={handleCloseSnackbar} severity="error">
              {error}
            </Alert>
          </Snackbar>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleReply}>
              <ReplyIcon style={{ marginLeft: 8 }} />
              השב
            </MenuItem>
            <MenuItem onClick={handleEdit}>
              <EditIcon style={{ marginLeft: 8 }} />
              ערוך
            </MenuItem>
            <MenuItem onClick={handleDelete}>
              <DeleteIcon style={{ marginLeft: 8 }} />
              מחק
            </MenuItem>
          </Menu>
          <Dialog open={openProfileDialog} onClose={handleCloseProfile}>
            <DialogTitle>פרופיל משתמש</DialogTitle>
            <DialogContent>
              {selectedChat && (
                <>
                  <Avatar sx={{ width: 100, height: 100, margin: '0 auto' }}>
                    {selectedChat.senderName[0]}
                  </Avatar>
                  <Typography variant="h6" align="center" style={{ marginTop: 16 }}>
                    {selectedChat.senderName}
                  </Typography>
                  <Typography variant="body1" align="center">
                    מספר טלפון: {selectedChat.chatId.split('@')[0]}
                  </Typography>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseProfile}>סגור</Button>
            </DialogActions>
          </Dialog>
        </StyledRoot>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default ChatManager;