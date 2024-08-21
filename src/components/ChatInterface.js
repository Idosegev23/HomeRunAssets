import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar,
  Button,
  Divider,
  CircularProgress,
  Link
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SearchIcon from '@mui/icons-material/Search';
import ImageIcon from '@mui/icons-material/Image';
import VideoIcon from '@mui/icons-material/Videocam';
import api from '../utils/api.js';import { debounce } from 'lodash';
import ErrorBoundary from './ErrorBoundary.js';
const ChatInterface = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [customerDetails, setCustomerDetails] = useState(null);
  const [matchingProperties, setMatchingProperties] = useState([]);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const eventSourceRef = useRef(null);
  const observerRef = useRef(null);

  const setupEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    console.log('Setting up new EventSource');
    const newEventSource = new EventSource(`${api.defaults.baseURL}/messages/stream`);
    
    newEventSource.onopen = () => {
      console.log('EventSource connection opened');
    };
    
    newEventSource.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      console.log('Received new message:', newMessage);
      
      setChats(prevChats => {
        const updatedChats = prevChats.map(chat => 
          chat.phoneNumber === newMessage.phoneNumber 
            ? {...chat, lastMessage: newMessage.text, hasNewMessage: true}
            : chat
        );
        return updatedChats.sort((a, b) => (b.hasNewMessage ? 1 : 0) - (a.hasNewMessage ? 1 : 0));
      });

      setMessages(prevMessages => {
        if (selectedChat && newMessage.phoneNumber === selectedChat.phoneNumber) {
          return [...prevMessages, newMessage];
        }
        return prevMessages;
      });
    };

    newEventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      setTimeout(setupEventSource, 5000);
    };

    eventSourceRef.current = newEventSource;
  }, [selectedChat]);

  useEffect(() => {
    setupEventSource();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [setupEventSource]);

  useEffect(() => {
    fetchChats();
    const intervalId = setInterval(fetchChats, 60000); // כל דקה
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.phoneNumber);
      fetchCustomerDetails(selectedChat.customerId);
      fetchMatchingProperties(selectedChat.customerId);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreMessages();
        }
      },
      { threshold: 1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, selectedChat]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching chats...');
      const response = await api.get('/chats', { params: { search: searchQuery } });
      console.log('Chats response:', response.data);
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('Failed to fetch chats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (phoneNumber, page = 1, limit = 20) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching messages for ${phoneNumber}...`);
      const response = await api.get(`/messages/${phoneNumber}`, {
        params: { page, limit }
      });
      console.log('Messages response:', response.data);
      setMessages(prevMessages => [...prevMessages, ...response.data.messages]);
      setHasMore(response.data.hasMore);
      setPage(page);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to fetch messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = () => {
    if (selectedChat && hasMore) {
      fetchMessages(selectedChat.phoneNumber, page + 1);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    if (!customerId) return;
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching customer details for ${customerId}...`);
      const response = await api.get(`/customers/${customerId}`);
      console.log('Customer details response:', response.data);
      setCustomerDetails(response.data);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      setError('Failed to fetch customer details. Please try again.');
      setCustomerDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchingProperties = async (customerId) => {
    if (!customerId) return;
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching matching properties for ${customerId}...`);
      const response = await api.get(`/matchingProperties/${customerId}`);
      console.log('Matching properties response:', response.data);
      setMatchingProperties(response.data);
    } catch (error) {
      console.error('Error fetching matching properties:', error);
      setError('Failed to fetch matching properties. Please try again.');
      setMatchingProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (messageText.trim() && selectedChat) {
      try {
        setLoading(true);
        setError(null);
        const response = await api.post('/sendMessage', {
          phoneNumber: selectedChat.phoneNumber,
          text: messageText,
          topic: currentTopic
        });
        console.log('Send message response:', response.data);
        setMessages(prev => [...prev, response.data]);
        setMessageText('');
      } catch (error) {
        console.error('Error sending message:', error);
        setError('Failed to send message. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSendProperty = (property) => {
    setCurrentTopic(property.id);
    setMessageText(`הנה פרטים על נכס שעשוי להתאים לך:
כתובת: ${property.address}
מחיר: ${property.price}
חדרים: ${property.rooms}
מ"ר: ${property.square_meters}
קומה: ${property.floor}`);
    handleSendMessage();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', selectedChat.phoneNumber);
    formData.append('fileName', file.name);

    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/uploadFile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('File upload response:', response.data);
      setMessages(prev => [...prev, { 
        sender: 'Me', 
        text: file.name, 
        timestamp: Date.now() / 1000,
        fileType: file.type.startsWith('image/') ? 'image' : 'video'
      }]);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('he-IL', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const renderCustomerDetails = () => {
    if (!customerDetails) return null;
    const hebrewLabels = {
      First_name: 'שם פרטי',
      Last_name: 'שם משפחה',
      Cell: 'טלפון',
      Budget: 'תקציב',
      Rooms: 'חדרים',
      Square_meters: 'מ"ר',
      Preferred_floor: 'קומה מועדפת',
      City: 'עיר',
      Area: 'אזור'
    };
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>פרטי לקוח</Typography>
        {Object.entries(customerDetails).map(([key, value]) => (
          <Typography key={key} variant="body2">
            <strong>{hebrewLabels[key] || key}:</strong> {value}
          </Typography>
        ))}
      </Box>
    );
  };

  const renderMessage = (msg, index) => (
    <Box 
      key={index}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: msg.sender === 'Me' ? 'flex-end' : 'flex-start',
        mb: 1,
      }}
    >
      <Paper 
        elevation={1}
        sx={{
          p: 1,
          bgcolor: msg.sender === 'Me' ? '#dcf8c6' : '#fff',
          maxWidth: '70%',
        }}
      >
        {msg.fileType === 'image' && (
          <img src={msg.text} alt="Uploaded image" style={{ maxWidth: '100%', marginBottom: 8 }} />
        )}
        {msg.fileType === 'video' && (
          <video src={msg.text} controls style={{ maxWidth: '100%', marginBottom: 8 }} />
        )}
        <Typography variant="body1">{msg.text}</Typography>
        <Typography variant="caption" display="block" textAlign="right">
          {formatTimestamp(msg.timestamp)}
        </Typography>
      </Paper>
    </Box>
  );

  const debouncedSearch = debounce((value) => {
    setSearchQuery(value);
    fetchChats();
  }, 300);

  const handleSearchChange = (event) => {
    debouncedSearch(event.target.value);
  };

  return (
    <ErrorBoundary>
      <Box sx={{ display: 'flex', height: '100vh', width: '100vw' }}>
        {/* Right Sidebar - Chat List */}
        <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="חיפוש צ'אט"
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon color="action" />,
              }}
            />
          </Box>
          <List>
            {chats.map((chat) => (
              <ListItem 
                button 
                key={chat.phoneNumber}
                selected={selectedChat?.phoneNumber === chat.phoneNumber}
                onClick={() => {
                  setSelectedChat(chat);
                  setChats(prevChats => 
                    prevChats.map(c => 
                      c.phoneNumber === chat.phoneNumber 
                        ? {...c, hasNewMessage: false}
                        : c
                    )
                  );
                }}
              >
                <ListItemAvatar>
                  <Avatar>{chat.customerName[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={chat.customerName}
                  secondary={chat.lastMessage}
                  primaryTypographyProps={{ 
                    fontWeight: chat.hasNewMessage ? 'bold' : 'normal',
                    color: chat.hasNewMessage ? 'primary' : 'inherit'
                  }}
                  secondaryTypographyProps={{ noWrap: true }}
                />
                {chat.hasNewMessage && (
                  <Box 
                    sx={{ 
                      width: 10, 
                      height: 10, 
                      borderRadius: '50%', 
                      backgroundColor: 'primary.main', 
                      marginLeft: 1 
                    }} 
                  />
                )}
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Main Chat Area */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedChat ? (
            <>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: '#f0f0f0' }}>
                <Typography variant="h6">{selectedChat.customerName}</Typography>
                <Typography variant="subtitle2">{selectedChat.phoneNumber}</Typography>
              </Box>
              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: '#e5ddd5', display: 'flex', flexDirection: 'column-reverse' }}>
                {messages.map((msg, index) => renderMessage(msg, index))}
                <div ref={observerRef} style={{ height: '20px', margin: '10px 0' }}>
                  {loading && <CircularProgress size={20} />}
                </div>
              </Box>
              <Box sx={{ p: 2, bgcolor: '#f0f0f0', display: 'flex' }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="הקלד הודעה..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,video/*"
                />
                <IconButton color="primary" onClick={() => fileInputRef.current.click()}>
                  <AttachFileIcon />
                </IconButton>
                <IconButton color="primary" onClick={handleSendMessage}>
                  <SendIcon />
                </IconButton>
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="h5">בחר צ'אט כדי להתחיל שיחה</Typography>
            </Box>
          )}
        </Box>

        {/* Left Sidebar - Customer Details and Matching Properties */}
        <Box sx={{ width: 300, borderLeft: 1, borderColor: 'divider', overflow: 'auto' }}>
          {renderCustomerDetails()}
          <Divider />
          {matchingProperties.length > 0 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>נכסים מתאימים</Typography>
              {matchingProperties.map((property, index) => (
                <Paper key={index} elevation={1} sx={{ p: 1, mb: 1 }}>
                  <Typography variant="body2"><strong>כתובת:</strong> {property.address}</Typography>
                  <Typography variant="body2"><strong>מחיר:</strong> {property.price}</Typography>
                  <Typography variant="body2"><strong>חדרים:</strong> {property.rooms}</Typography>
                  <Typography variant="body2"><strong>מ"ר:</strong> {property.square_meters}</Typography>
                  <Typography variant="body2"><strong>קומה:</strong> {property.floor}</Typography>
                  <Typography variant="body2"><strong>התאמה:</strong> {property.totalMatchPercentage}%</Typography>
                  <Button variant="outlined" size="small" onClick={() => handleSendProperty(property)} sx={{ mt: 1 }}>
                    שלח ללקוח
                  </Button>
                </Paper>
              ))}
            </Box>
          )}
        </Box>

        {loading && (
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0, 0, 0, 0.5)' }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box sx={{ position: 'absolute', bottom: 20, left: 20, right: 20, p: 2, bgcolor: 'error.main', color: 'error.contrastText', borderRadius: 1 }}>
            <Typography>{error}</Typography>
          </Box>
        )}
      </Box>
    </ErrorBoundary>
  );
};

export default ChatInterface;