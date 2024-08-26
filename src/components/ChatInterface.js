import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Send, Image, Video, File } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://home-run-assets.vercel.app/api';

const ChatInterface = () => {
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

  const handleApiError = (error) => {
    console.error('API Error:', error);
    setError('An error occurred. Please try again.');
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/getLastIncomingMessages`);
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
        phoneNumber: selectedChat.phoneNumber,
        message: inputMessage
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
      
      const uploadResponse = await axios.post(`${API_BASE_URL}/uploadFile`, formData);
      const fileUrl = uploadResponse.data.fileUrl;

      const response = await axios.post(`${API_BASE_URL}/sendFile`, {
        phoneNumber: selectedChat.phoneNumber,
        fileUrl,
        caption: file.name
      });

      setMessages([...messages, { id: response.data.messageId, sender: 'Me', text: `File: ${file.name}`, timestamp: Math.floor(Date.now() / 1000) }]);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100" dir="rtl">
      {/* רשימת צ'אטים */}
      <div className="w-1/4 bg-white border-l">
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="חיפוש צ'אטים"
              className="w-full p-2 pr-8 rounded border"
              onChange={(e) => console.log(e.target.value)} // פונקציית חיפוש בסיסית, ניתן להרחיב לפי צורך
            />
            <Search className="absolute right-2 top-2 text-gray-400" size={20} />
          </div>
        </div>
        <ul className="overflow-y-auto h-[calc(100vh-80px)]">
          {chats.map((chat) => (
            <li
              key={chat.idMessage}
              className={`p-4 hover:bg-gray-100 cursor-pointer ${selectedChat?.phoneNumber === chat.senderData?.sender ? 'bg-gray-200' : ''}`}
              onClick={() => setSelectedChat(chat)}
            >
              <div className="font-semibold">{chat.senderData?.senderName || chat.senderData?.sender}</div>
              <div className="text-sm text-gray-600">{chat.senderData?.sender}</div>
              <div className="text-xs text-gray-500">{chat.textMessage}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* חלון צ'אט */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="bg-gray-200 p-4">
              <h2 className="font-semibold">{selectedChat.senderData?.senderName || selectedChat.senderData?.sender}</h2>
              <p className="text-sm text-gray-600">{selectedChat.senderData?.sender}</p>
            </div>
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4">
              {messages.map((message) => (
                <div key={message.id} className={`mb-4 ${message.sender === 'Me' ? 'text-left' : 'text-right'}`}>
                  <div className={`inline-block p-2 rounded-lg ${message.sender === 'Me' ? 'bg-green-500 text-white' : 'bg-white text-black'}`}>
                    {message.text || 'No text'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(message.timestamp * 1000).toLocaleString('he-IL')}</div>
                </div>
              ))}
            </div>
            <div className="bg-gray-200 p-4">
              <div className="flex items-center">
                <button onClick={handleSendMessage} className="ml-2 bg-green-500 text-white p-2 rounded">
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
