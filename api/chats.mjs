import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { kv } from '@vercel/kv';
import Airtable from 'airtable';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import FormData from 'form-data';

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

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

function formatPhoneNumber(phoneNumber) {
  phoneNumber = phoneNumber.replace(/\D/g, '');
  if (phoneNumber.startsWith('972')) {
    phoneNumber = '0' + phoneNumber.slice(3);
  } else if (!phoneNumber.startsWith('0')) {
    phoneNumber = '0' + phoneNumber;
  }
  return phoneNumber;
}

async function getCustomerInfo(phoneNumber) {
  const formattedNumber = formatPhoneNumber(phoneNumber.replace('@c.us', ''));
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
      const senderId = msg.senderId || msg.chatId;
      if (!senderId) {
        console.error('Message without senderId or chatId:', msg);
        return null;
      }
      const customerInfo = await getCustomerInfo(senderId);
      return {
        type: msg.type,
        idMessage: msg.idMessage,
        timestamp: msg.timestamp,
        typeMessage: msg.typeMessage,
        chatId: msg.chatId || msg.senderId,
        senderId: senderId,
        senderName: customerInfo ? `${customerInfo.First_name} ${customerInfo.Last_name}` : (msg.senderName || 'Unknown'),
        textMessage: msg.textMessage || msg.caption || 'Non-text message',
        downloadUrl: msg.downloadUrl,
        caption: msg.caption,
        fileName: msg.fileName,
        extendedTextMessage: msg.extendedTextMessage,
        customerInfo: customerInfo
      };
    }));

    const validMessages = formattedMessages.filter(msg => msg !== null);
    await kv.set('last_incoming_messages', validMessages, { ex: 300 });
    res.status(200).json(validMessages);
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

    const cachedHistory = await kv.get(`chat_history:${chatId}`);

    if (cachedHistory) {
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

app.post('/api/uploadFile', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  try {
    const filePath = req.file.path;
    const chatId = req.body.chatId;

    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('file', fs.createReadStream(filePath));
    formData.append('caption', req.file.originalname);

    const response = await axios.post(
      `${GREENAPI_BASE_URL}/sendFileByUpload/${GREENAPI_APITOKENINSTANCE}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    io.emit('newMessage', {
      id: response.data.idMessage,
      type: 'outgoing',
      textMessage: `File: ${req.file.originalname}`,
      timestamp: Math.floor(Date.now() / 1000),
      chatId: chatId,
      fileUrl: response.data.urlFile,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype
    });

    res.json({ 
      success: true,
      messageId: response.data.idMessage,
      fileUrl: response.data.urlFile
    });

    fs.unlinkSync(filePath);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
});

app.post('/api/webhook', async (req, res) => {
  const update = req.body;
  console.log('Received update:', update);

  if (update.body.typeWebhook === 'incomingMessageReceived') {
    const message = update.body.messageData;
    const senderInfo = await getCustomerInfo(message.sender);
    
    let newMessage = {
      id: message.idMessage,
      type: 'incoming',
      timestamp: message.timestamp,
      chatId: message.sender,
      senderName: senderInfo ? `${senderInfo.First_name} ${senderInfo.Last_name}` : 'Unknown'
    };

    if (message.typeMessage === 'textMessage') {
      newMessage.textMessage = message.textMessage;
    } else if (['imageMessage', 'videoMessage', 'documentMessage'].includes(message.typeMessage)) {
      newMessage.textMessage = message.caption || 'File received';
      newMessage.fileUrl = message.downloadUrl;
      newMessage.fileName = message.fileName;
      newMessage.mimeType = message.mimeType;
    }

    io.emit('newMessage', newMessage);
  }

  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));