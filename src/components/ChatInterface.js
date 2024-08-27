import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Send, Image, Video, File } from 'lucide-react';
import io from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://home-run-assets.vercel.app/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://home-run-assets.vercel.app';

const ChatInterface = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchChats();
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.senderData.phoneNumber);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const initializeSocket = () => {
    socketRef.current = io(SOCKET_URL);
    socketRef.current.on('newMessage', handleNewMessage);
  };

  const handleNewMessage = (message) => {
    if (selectedChat && message.chatId === selectedChat.senderData.phoneNumber) {
      setMessages(prevMessages => [...prevMessages, message]);
    }
    updateChatList(message);
  };

  const updateChatList = (message) => {
    setChats(prevChats => {
      const chatIndex = prevChats.findIndex(chat => chat.senderData.phoneNumber === message.chatId);
      if (chatIndex > -1) {
        const updatedChats = [...prevChats];
        updatedChats[chatIndex] = {
          ...updatedChats[chatIndex],
          lastMessage: message.text,
          timestamp: message.timestamp
        };
        return updatedChats;
      } else {
        return [{
          senderData: {
            phoneNumber: message.chatId,
            senderName: message.senderName || 'Unknown'
          },
          lastMessage: message.text,
          timestamp: message.timestamp
        }, ...prevChats];
      }
    });
  };

  const handleApiError = (error) => {
    console.error('API Error:', error);
    setError('An error occurred. Please try again.');
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/getLastIncomingMessages`);
      const formattedChats = await Promise.all(response.data.map(async (chat) => {
        if (chat.senderData && chat.senderData.sender) {
          const phoneNumber = chat.senderData.sender.replace(/^\+?972/, '0').replace('@c.us', '');
          const customerInfo = await fetchCustomerInfo(phoneNumber);
          return {
            ...chat,
            senderData: {
              ...chat.senderData,
              phoneNumber,
              senderName: customerInfo ? `${customerInfo.First_name} ${customerInfo.Last_name}` : 'Unknown',
              customerInfo: customerInfo
            },
          };
        }
        return chat;
      }));
      setChats(formattedChats);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerInfo = async (phoneNumber) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/getCustomerInfo`, { params: { phoneNumber } });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch customer info:', error);
      return null;
    }
  };

  const fetchMessages = async (phoneNumber) => {
    if (!phoneNumber) {
      console.error('Cannot fetch messages. Phone number is undefined.');
      setError('Cannot fetch messages. Please select a valid chat.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/getChatHistory`, { params: { phoneNumber } });
      setMessages(response.data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedChat) return;
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/sendMessage`, {
        phoneNumber: selectedChat.senderData.phoneNumber,
        message: inputMessage,
      });
      setMessages([...messages, { id: response.data.messageId, sender: 'Me', text: inputMessage, timestamp: Math.floor(Date.now() / 1000) }]);
      setInputMessage('');
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedChat) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await axios.post(`${API_BASE_URL}/uploadFile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const fileUrl = uploadResponse.data.fileUrl;

      const response = await axios.post(`${API_BASE_URL}/sendFile`, {
        phoneNumber: selectedChat.senderData.phoneNumber,
        fileUrl,
        caption: file.name,
      });

      setMessages([...messages, { id: response.data.messageId, sender: 'Me', text: `File: ${file.name}`, timestamp: Math.floor(Date.now() / 1000) }]);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.senderData.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.senderData.phoneNumber.includes(searchQuery)
  );

  return (
    <div className="flex h-screen bg-gray-100" dir="rtl">
      {/* Chat List */}
      <div className="w-1/4 bg-white border-l">
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="חיפוש צ'אטים"
              className="w-full p-2 pr-8 rounded border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-2 top-2 text-gray-400" size={20} />
          </div>
        </div>
        <ul className="overflow-y-auto h-[calc(100vh-80px)]">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <li
                key={chat.idMessage}
                className={`p-4 hover:bg-gray-100 cursor-pointer ${selectedChat?.senderData?.phoneNumber === chat.senderData?.phoneNumber ? 'bg-gray-200' : ''}`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="font-semibold">{chat.senderData.senderName}</div>
                <div className="text-sm text-gray-600">{chat.textMessage}</div>
                <div className="text-xs text-gray-500">{chat.senderData.phoneNumber}</div>
              </li>
            ))
          ) : (
            <li>No chats available</li>
          )}
        </ul>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-gray-200">
        {selectedChat ? (
          <>
            <div className="bg-gray-300 p-4">
              <h2 className="font-semibold">{selectedChat.senderData.senderName}</h2>
              <p className="text-sm text-gray-600">{selectedChat.senderData.phoneNumber}</p>
              {selectedChat.senderData.customerInfo && (
                <div className="mt-2 text-xs">
                  <p>Email: {selectedChat.senderData.customerInfo.Email}</p>
                  <p>Address: {selectedChat.senderData.customerInfo.Address}</p>
                  {/* Add more customer info fields as needed */}
                </div>
              )}
            </div>
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-white">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div key={message.id} className={`mb-4 flex ${message.sender === 'Me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`inline-block p-2 rounded-lg max-w-xs ${message.sender === 'Me' ? 'bg-green-500 text-white' : 'bg-gray-100 text-black'}`}>
                      {message.text || 'No text'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(message.timestamp * 1000).toLocaleString('he-IL')}
                    </div>
                  </div>
                ))
              ) : (
                <div>No messages found.</div>
              )}
            </div>
            <div className="bg-gray-300 p-4">
              <div className="flex items-center">
                <button onClick={handleSendMessage} className="ml-2 bg-green-500 text-white p-2 rounded">
                  <Send size={24} />
                </button>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="הקלד הודעה"
                  className="flex-1 p-2 rounded"
                />
                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,video/*,application/pdf"
                />
                <button onClick={() => fileInputRef.current.click()} className="mr-2">
                  <File size={24} />
                </button>
                <button onClick={() => fileInputRef.current.click()} className="mr-2">
                  <Video size={24} />
                </button>
                <button onClick={() => fileInputRef.current.click()} className="mr-2">
                  <Image size={24} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            בחר צ'אט כדי להתחיל בשיחה
          </div>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500"></div>
        </div>
      )}

      {error && (
        <div className="absolute bottom-4 right-4 bg-red-500 text-white p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default ChatInterface;