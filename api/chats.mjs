import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { kv } from '@vercel/kv';
import Airtable from 'airtable';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const GREENAPI_ID = process.env.GREENAPI_ID;
const GREENAPI_APITOKENINSTANCE = process.env.GREENAPI_APITOKENINSTANCE;
const GREENAPI_BASE_URL = `https://api.green-api.com/waInstance${GREENAPI_ID}`;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: AIRTABLE_API_KEY
});
const base = Airtable.base(AIRTABLE_BASE_ID);

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

async function getCustomerInfo(phoneNumber) {
  const formattedNumber = phoneNumber.replace(/^\+?972/, '0').replace('@c.us', '');
  
  try {
    const records = await base('customers').select({
      filterByFormula: `{Cell}='${formattedNumber}'`
    }).firstPage();
    
    if (records.length > 0) {
      return records[0].fields;
    }
    return null;
  } catch (error) {
    console.error('Error fetching customer info from Airtable:', error);
    return null;
  }
}

app.get('/api/getLastIncomingMessages', async (req, res) => {
  try {
    const response = await axios.get(`${GREENAPI_BASE_URL}/lastIncomingMessages/${GREENAPI_APITOKENINSTANCE}`);
    const formattedMessages = await Promise.all(response.data.map(async msg => {
      const customerInfo = await getCustomerInfo(msg.senderId);
      return {
        type: msg.type,
        idMessage: msg.idMessage,
        timestamp: msg.timestamp,
        typeMessage: msg.typeMessage,
        chatId: msg.chatId,
        senderId: msg.senderId,
        senderName: customerInfo ? `${customerInfo.First_name} ${customerInfo.Last_name}` : (msg.senderName || 'Unknown'),
        textMessage: msg.textMessage || msg.caption || 'Non-text message',
        downloadUrl: msg.downloadUrl,
        caption: msg.caption,
        fileName: msg.fileName,
        extendedTextMessage: msg.extendedTextMessage,
        customerInfo: customerInfo
      };
    }));

    await kv.set('last_incoming_messages', formattedMessages, { ex: 300 }); // Cache for 5 minutes
    res.status(200).json(formattedMessages);
  } catch (error) {
    console.error('Failed to fetch last incoming messages:', error);
    res.status(500).json({ error: 'Failed to fetch last incoming messages' });
  }
});

app.get('/api/getCustomerInfo', async (req, res) => {
  const { phoneNumber } = req.query;
  try {
    const customerInfo = await getCustomerInfo(phoneNumber);
    res.status(200).json(customerInfo);
  } catch (error) {
    console.error('Failed to fetch customer info:', error);
    res.status(500).json({ error: 'Failed to fetch customer info' });
  }
});

app.post('/api/sendMessage', async (req, res) => {
  const { chatId, message } = req.body;
  try {
    if (!chatId) {
      console.error('Chat ID is missing');
      return res.status(400).json({ error: 'Chat ID is required' });
    }

    console.log('Sending message to:', chatId);

    const response = await axios.post(`${GREENAPI_BASE_URL}/sendMessage/${GREENAPI_APITOKENINSTANCE}`, {
      chatId,
      message
    });
    
    io.emit('newMessage', {
      id: response.data.idMessage,
      type: 'outgoing',
      textMessage: message,
      timestamp: Math.floor(Date.now() / 1000),
      chatId: chatId
    });

    res.status(200).json({ success: true, messageId: response.data.idMessage });
  } catch (error) {
    console.error('Failed to send message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.get('/api/getChatHistory', async (req, res) => {
  const { chatId, count = 50 } = req.query;
  try {
    if (!chatId) {
      console.error('Chat ID is missing');
      return res.status(400).json({ error: 'Chat ID is required' });
    }

    console.log('Fetching chat history for:', chatId);

    const cachedHistory = await kv.get(`chat_history:${chatId}`);

    if (cachedHistory) {
      console.log('Returning cached chat history');
      return res.status(200).json(cachedHistory);
    }

    const response = await axios.post(`${GREENAPI_BASE_URL}/getChatHistory/${GREENAPI_APITOKENINSTANCE}`, {
      chatId,
      count
    });

    const history = response.data;

    await kv.set(`chat_history:${chatId}`, history, { ex: 600 });
    res.status(200).json(history);
  } catch (error) {
    console.error('Failed to fetch chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

app.post('/api/sendFile', async (req, res) => {
  const { chatId, fileUrl, caption } = req.body;
  try {
    if (!chatId) {
      console.error('Chat ID is missing');
      return res.status(400).json({ error: 'Chat ID is required' });
    }

    console.log('Sending file to:', chatId);

    const response = await axios.post(`${GREENAPI_BASE_URL}/sendFileByUrl/${GREENAPI_APITOKENINSTANCE}`, {
      chatId,
      urlFile: fileUrl,
      fileName: 'file',
      caption: caption || ''
    });

    io.emit('newMessage', {
      id: response.data.idMessage,
      type: 'outgoing',
      textMessage: `File: ${caption || 'Untitled'}`,
      timestamp: Math.floor(Date.now() / 1000),
      chatId: chatId,
      fileUrl: fileUrl
    });

    res.status(200).json({ success: true, messageId: response.data.idMessage });
  } catch (error) {
    console.error('Failed to send file:', error);
    res.status(500).json({ error: 'Failed to send file' });
  }
});

app.post('/api/webhook', async (req, res) => {
  const update = req.body;
  console.log('Received update:', update);

  if (update.body.typeWebhook === 'incomingMessageReceived') {
    const message = update.body.messageData;
    const senderInfo = await getCustomerInfo(message.sender);
    
    io.emit('newMessage', {
      id: message.idMessage,
      type: 'incoming',
      textMessage: message.textMessage || message.caption || 'Non-text message',
      timestamp: message.timestamp,
      chatId: message.sender,
      senderName: senderInfo ? `${senderInfo.First_name} ${senderInfo.Last_name}` : 'Unknown'
    });
  }

  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));