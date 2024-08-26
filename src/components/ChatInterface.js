import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Image, Video, File } from 'lucide-react';
import axios from 'axios';

const WhatsAppStyleChat = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [relevantProperties, setRelevantProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchMessages(selectedCustomer.phoneNumber);
      fetchRelevantProperties(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/chats');
      setCustomers(response.data);
    } catch (error) {
      setError('Failed to fetch customers. Please try again.');
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (phoneNumber) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/messages?phoneNumber=${phoneNumber}`);
      setMessages(response.data);
    } catch (error) {
      setError('Failed to fetch messages. Please try again.');
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelevantProperties = async (customerId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/properties?customerId=${customerId}`);
      setRelevantProperties(response.data);
    } catch (error) {
      setError('Failed to fetch relevant properties. Please try again.');
      console.error('Error fetching relevant properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() && selectedCustomer) {
      try {
        setLoading(true);
        const response = await axios.post('/api/sendMessage', {
          phoneNumber: selectedCustomer.phoneNumber,
          message: inputMessage
        });
        setMessages([...messages, response.data]);
        setInputMessage('');
      } catch (error) {
        setError('Failed to send message. Please try again.');
        console.error('Error sending message:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && selectedCustomer) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('phoneNumber', selectedCustomer.phoneNumber);

      try {
        setLoading(true);
        const response = await axios.post('/api/uploadFile', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessages([...messages, response.data]);
      } catch (error) {
        setError('Failed to upload file. Please try again.');
        console.error('Error uploading file:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSendProperty = (property) => {
    const propertyText = `נכס: ${property.address}\nמחיר: ${property.price}`;
    setInputMessage(propertyText);
  };

  return (
    <div className="flex h-screen bg-gray-100" dir="rtl">
      {/* Customer List */}
      <div className="w-1/4 bg-white border-l">
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="חיפוש לקוחות"
              className="w-full p-2 pr-8 rounded border"
            />
            <Search className="absolute right-2 top-2 text-gray-400" size={20} />
          </div>
        </div>
        <ul className="overflow-y-auto h-[calc(100vh-80px)]">
          {customers.map((customer) => (
            <li
              key={customer.phoneNumber}
              className={`p-4 hover:bg-gray-100 cursor-pointer ${
                selectedCustomer?.phoneNumber === customer.phoneNumber ? 'bg-gray-200' : ''
              }`}
              onClick={() => setSelectedCustomer(customer)}
            >
              <div className="font-semibold">{customer.customerName}</div>
              <div className="text-sm text-gray-600">{customer.phoneNumber}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedCustomer ? (
          <>
            <div className="bg-gray-200 p-4">
              <h2 className="font-semibold">{selectedCustomer.customerName}</h2>
              <p className="text-sm text-gray-600">{selectedCustomer.phoneNumber}</p>
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
            בחר לקוח כדי להתחיל בשיחה
          </div>
        )}
      </div>

      {/* Customer Details and Properties */}
      <div className="w-1/4 bg-white border-r">
        {selectedCustomer && (
          <>
            <div className="p-4 border-b">
              <h2 className="font-semibold">פרטי לקוח</h2>
              <p>שם: {selectedCustomer.customerName}</p>
              <p>טלפון: {selectedCustomer.phoneNumber}</p>
            </div>
            <div className="p-4">
              <h2 className="font-semibold mb-2">נכסים רלוונטיים</h2>
              <ul>
                {relevantProperties.map((property) => (
                  <li key={property.id} className="mb-2">
                    <div>{property.address}</div>
                    <div>{property.price}</div>
                    <button
                      onClick={() => handleSendProperty(property)}
                      className="mt-1 bg-blue-500 text-white px-2 py-1 rounded text-sm"
                    >
                      שלח ללקוח
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
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