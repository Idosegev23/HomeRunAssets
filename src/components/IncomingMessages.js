import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Snackbar,
  Card,
  CardContent,
  Grid,
  Alert,
  IconButton,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Reply as ReplyIcon,
  Label as LabelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
 import { styled } from '@mui/material/styles';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import axios from 'axios';
// Create rtl cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// Create RTL theme
const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: 'Rubik, Arial, sans-serif',
  },
});

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[4],
  },
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

const IncomingMessages = () => {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [tags, setTags] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchMessages();
    const savedTags = JSON.parse(localStorage.getItem('tags')) || [];
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    setTags(savedTags);
    setTasks(savedTasks);
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('https://home-run-assets.vercel.app/api/lastIncomingMessages');
      console.log('Fetched messages:', response.data);
      const sortedMessages = response.data.sort((a, b) => b.timestamp - a.timestamp);
      setMessages(sortedMessages);
      setFilteredMessages(sortedMessages);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.response?.data?.error || 'שגיאה בטעינת ההודעות. אנא נסה שנית.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    const filtered = messages.filter(
      (message) =>
        message.senderName?.toLowerCase().includes(term.toLowerCase()) ||
        message.textMessage?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredMessages(filtered);
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyText) {
      console.log('Missing selectedMessage or replyText');
      return;
    }
    try {
      console.log('Selected message:', selectedMessage);
      if (!selectedMessage.senderData || !selectedMessage.senderData.sender) {
        console.error('Invalid selectedMessage structure:', selectedMessage);
        setError('שגיאה: מבנה ההודעה הנבחרת אינו תקין');
        return;
      }
      const phoneNumber = selectedMessage.senderData.sender.replace('@c.us', '');
      console.log('Phone number to send:', phoneNumber);
      const response = await axios.post('https://home-run-assets.vercel.app/api/sendMessage', {
        phoneNumber: phoneNumber,
        text: replyText,
      });
      console.log('Server response:', response.data);
      setReplyText('');
      setSelectedMessage(null);
      fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.error || 'שגיאה בשליחת התשובה. אנא נסה שנית.');
    }
  };

  const handleAddTag = (messageId, tagText) => {
    const newTags = [...tags, { messageId, text: tagText }];
    setTags(newTags);
    localStorage.setItem('tags', JSON.stringify(newTags));
  };

  const handleAddTask = (messageId, taskText) => {
    const newTasks = [...tasks, { messageId, text: taskText, completed: false }];
    setTasks(newTasks);
    localStorage.setItem('tasks', JSON.stringify(newTasks));
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
  };

  const getTimeSinceLastMessage = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp * 1000);
    const diffInSeconds = Math.floor((now - messageTime) / 1000);
    
    if (diffInSeconds < 60) return `לפני ${diffInSeconds} שניות`;
    if (diffInSeconds < 3600) return `לפני ${Math.floor(diffInSeconds / 60)} דקות`;
    if (diffInSeconds < 86400) return `לפני ${Math.floor(diffInSeconds / 3600)} שעות`;
    return `לפני ${Math.floor(diffInSeconds / 86400)} ימים`;
  };

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            הודעות נכנסות
            <IconButton onClick={fetchMessages} color="primary" sx={{ mr: 2 }}>
              <RefreshIcon />
            </IconButton>
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="חיפוש הודעות..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: <SearchIcon />,
            }}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              ) : filteredMessages.length > 0 ? (
                <List>
                  {filteredMessages.map((message) => (
                    <StyledCard key={message.idMessage} onClick={() => setSelectedMessage(message)}>
                      <CardContent>
                        <Typography variant="h6">{message.senderName}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {formatTimestamp(message.timestamp)}
                        </Typography>
                        <Typography variant="body1">{message.textMessage}</Typography>
                        <Box sx={{ mt: 1 }}>
                          <StyledChip
                            icon={<CheckCircleIcon />}
                            label="סמן כמשימה"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddTask(message.idMessage, "משימה חדשה: " + message.textMessage.substring(0, 30));
                            }}
                          />
                          <StyledChip
                            icon={<LabelIcon />}
                            label="תייג"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddTag(message.idMessage, "תיוג חדש");
                            }}
                          />
                        </Box>
                      </CardContent>
                    </StyledCard>
                  ))}
                </List>
              ) : (
                <Typography>אין הודעות להצגה</Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {selectedMessage && (
                <Card>
                  <CardContent>
                    <Typography variant="h6">תשובה להודעה</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {getTimeSinceLastMessage(selectedMessage.timestamp)}
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      variant="outlined"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="הקלד את תשובתך כאן..."
                      sx={{ my: 2 }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleReply}
                      startIcon={<ReplyIcon />}
                      disabled={!replyText.trim()}
                    >
                      שלח תשובה
                    </Button>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={() => setError(null)}
          >
            <Alert onClose={() => setError(null)} severity="error">
              {error}
            </Alert>
          </Snackbar>
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default IncomingMessages;