import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Image, Video, File, Mic, MapPin, Trash2 } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://your-server-url.com/api';

const WhatsAppStyleChat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.phoneNumber);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleApiError = (error) => {
    console.error('API Error:', error);
    if (error.response) {
      setError(`Error ${error.response.status}: ${error.response.data.error || 'Unknown error'}`);
    } else if (error.request) {
      setError('No response received from the server. Please check your network connection.');
    } else {
      setError(`Error: ${error.message}`);
    }
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/chats`);
      setChats(response.data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (phoneNumber) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/messages`, {
        params: { phoneNumber }
      });
      setMessages(response.data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() && selectedChat) {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.post(`${API_BASE_URL}/sendMessage`, {
          phoneNumber: selectedChat.phoneNumber,
          message: inputMessage
        });
        setMessages(prevMessages => [...prevMessages, response.data]);
        setInputMessage('');
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && selectedChat) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('phoneNumber', selectedChat.phoneNumber);

      try {
        setLoading(true);
        setError(null);
        const response = await axios.post(`${API_BASE_URL}/uploadFile`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessages(prevMessages => [...prevMessages, response.data]);
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSearchMessages = async () => {
    if (selectedChat && searchQuery.trim()) {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_BASE_URL}/searchChatHistory`, {
          params: {
            phoneNumber: selectedChat.phoneNumber,
            query: searchQuery
          }
        });
        setMessages(response.data);
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVoiceRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioRef.current = new MediaRecorder(stream);
        const audioChunks = [];

        audioRef.current.addEventListener("dataavailable", event => {
          audioChunks.push(event.data);
        });

        audioRef.current.addEventListener("stop", async () => {
          const audioBlob = new Blob(audioChunks);
          const formData = new FormData();
          formData.append('audio', audioBlob, 'voice_message.wav');
          formData.append('phoneNumber', selectedChat.phoneNumber);

          try {
            const response = await axios.post(`${API_BASE_URL}/sendVoiceMessage`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessages(prevMessages => [...prevMessages, response.data]);
          } catch (error) {
            handleApiError(error);
          }
        });

        audioRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting recording:', error);
        setError('Failed to start voice recording');
      }
    } else {
      audioRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendLocation = async () => {
    if (selectedChat) {
      try {
        setLoading(true);
        setError(null);
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          const response = await axios.post(`${API_BASE_URL}/sendLocation`, {
            phoneNumber: selectedChat.phoneNumber,
            latitude,
            longitude,
            name: 'My Location',
            address: 'Current Location'
          });
          setMessages(prevMessages => [...prevMessages, response.data]);
        }, (error) => {
          setError('Failed to get current location');
          console.error('Geolocation error:', error);
        });
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (selectedChat && messageId) {
      try {
        setLoading(true);
        setError(null);
        await axios.post(`${API_BASE_URL}/deleteMessage`, {
          chatId: selectedChat.phoneNumber,
          messageId: messageId
        });
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    }
  };

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
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-2 top-2 text-gray-400" size={20} />
          </div>
        </div>
        <ul className="overflow-y-auto h-[calc(100vh-80px)]">
          {chats.map((chat) => (
            <li
              key={chat.phoneNumber}
              className={`p-4 hover:bg-gray-100 cursor-pointer ${
                selectedChat?.phoneNumber === chat.phoneNumber ? 'bg-gray-200' : ''
              }`}
              onClick={() => setSelectedChat(chat)}
            >
              <div className="font-semibold">{chat.customerName}</div>
              <div className="text-sm text-gray-600">{chat.phoneNumber}</div>
              <div className="text-xs text-gray-500">{chat.lastMessage}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="bg-gray-200 p-4">
              <h2 className="font-semibold">{selectedChat.customerName}</h2>
              <p className="text-sm text-gray-600">{selectedChat.phoneNumber}</p>
            </div>
            <div className="p-2">
              <input
                type="text"
                placeholder="חיפוש בהיסטוריית הצ'אט"
                className="w-full p-2 rounded border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchMessages()}
              />
            </div>
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 ${
                    message.sender === 'Me' ? 'text-left' : 'text-right'
                  }`}
                >
                  <div
                    className={`inline-block p-2 rounded-lg ${
                      message.sender === 'Me'
                        ? 'bg-green-500 text-white'
                        : 'bg-white'
                    }`}
                  >
                    {message.text}
                    {message.sender === 'Me' && (
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="ml-2 text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(message.timestamp * 1000).toLocaleString('he-IL')}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-200 p-4">
              <div className="flex items-center">
                <button
                  onClick={handleSendMessage}
                  className="ml-2 bg-green-500 text-white p-2 rounded"
                >
                  <Send size={24} />
                </button>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
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
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="mr-2"
                >
                  <File size={24} />
                </button>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="mr-2"
                >
                  <Video size={24} />
                </button>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="mr-2"
                >
                  <Image size={24} />
                </button>
                <button
                  onClick={handleVoiceRecording}
                  className={`mr-2 ${isRecording ? 'text-red-500' : ''}`}
                >
                  <Mic size={24} />
                </button>
                <button
                  onClick={handleSendLocation}
                  className="mr-2"
                >
                  <MapPin size={24} />
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

export default WhatsAppStyleChat;