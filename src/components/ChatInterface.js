import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Image, Video, File } from 'lucide-react';
import axios from 'axios';

// הגדר את כתובת הבסיס של ה-API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const WhatsAppStyleChat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/chats`);
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError(error.response?.data?.error || 'Failed to fetch chats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (phoneNumber) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/messages`, {
        params: { phoneNumber }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error.response?.data?.error || 'Failed to fetch messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() && selectedChat) {
      try {
        setLoading(true);
        const response = await axios.post(`${API_BASE_URL}/sendMessage`, {
          phoneNumber: selectedChat.phoneNumber,
          message: inputMessage
        });
        setMessages([...messages, response.data]);
        setInputMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
        setError(error.response?.data?.error || 'Failed to send message. Please try again.');
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
        const response = await axios.post(`${API_BASE_URL}/uploadFile`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessages([...messages, response.data]);
      } catch (error) {
        console.error('Error uploading file:', error);
        setError(error.response?.data?.error || 'Failed to upload file. Please try again.');
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