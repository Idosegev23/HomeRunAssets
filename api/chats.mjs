const express = require('express');
const axios = require('axios');
const Airtable = require('airtable');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// קונפיגורציה
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const GREENAPI_ID = process.env.GREENAPI_ID;
const GREENAPI_APITOKENINSTANCE = process.env.GREENAPI_APITOKENINSTANCE;
const GREENAPI_BASE_URL = `https://api.green-api.com/waInstance${GREENAPI_ID}`;

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// הגדרת אחסון לקבצים
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

// פונקציות עזר

async function findCustomerByPhone(phoneNumber) {
  try {
    const records = await base('Customers').select({
      filterByFormula: `{Cell} = '${phoneNumber}'`
    }).firstPage();
    return records.length > 0 ? records[0] : null;
  } catch (error) {
    console.error('Error finding customer:', error);
    return null;
  }
}

async function getRecentChats() {
  try {
    const outgoingResponse = await axios.get(`${GREENAPI_BASE_URL}/lastOutgoingMessages/${GREENAPI_APITOKENINSTANCE}`);
    const incomingResponse = await axios.get(`${GREENAPI_BASE_URL}/lastIncomingMessages/${GREENAPI_APITOKENINSTANCE}`);

    const allMessages = [...outgoingResponse.data, ...incomingResponse.data];
    const uniqueChats = {};

    for (const message of allMessages) {
      const phoneNumber = message.chatId.replace('@c.us', '');
      if (!uniqueChats[phoneNumber] || message.timestamp > uniqueChats[phoneNumber].timestamp) {
        uniqueChats[phoneNumber] = {
          phoneNumber,
          lastMessage: message.textMessage || message.caption || 'Non-text message',
          timestamp: message.timestamp,
          type: message.type
        };
      }
    }

    const chats = await Promise.all(Object.values(uniqueChats).map(async (chat) => {
      const customer = await findCustomerByPhone(chat.phoneNumber);
      return {
        phoneNumber: chat.phoneNumber,
        customerName: customer ? `${customer.fields.First_name} ${customer.fields.Last_name}` : 'Unknown',
        lastMessage: chat.lastMessage,
        timestamp: chat.timestamp,
        type: chat.type
      };
    }));

    chats.sort((a, b) => b.timestamp - a.timestamp);
    return chats;
  } catch (error) {
    console.error('Error fetching recent chats:', error);
    throw error;
  }
}

// נתיבים

app.get('/api/chats', async (req, res) => {
  try {
    const chats = await getRecentChats();
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    const { phoneNumber } = req.query;
    const chatId = `${phoneNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`;
    const response = await axios.post(`${GREENAPI_BASE_URL}/getChatHistory/${GREENAPI_APITOKENINSTANCE}`, {
      chatId,
      count: 100
    });
    const messages = response.data.map(msg => ({
      id: msg.idMessage,
      sender: msg.type === 'outgoing' ? 'Me' : 'Other',
      text: msg.textMessage || msg.caption || 'Non-text message',
      timestamp: msg.timestamp,
      phoneNumber: phoneNumber
    }));
    messages.sort((a, b) => a.timestamp - b.timestamp);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
  }
});

app.post('/api/sendMessage', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    const chatId = `${phoneNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`;
    const response = await axios.post(`${GREENAPI_BASE_URL}/sendMessage/${GREENAPI_APITOKENINSTANCE}`, {
      chatId,
      message
    });
    res.json({
      id: response.data.idMessage,
      sender: 'Me',
      text: message,
      timestamp: Math.floor(Date.now() / 1000),
      phoneNumber: phoneNumber
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});

app.post('/api/uploadFile', upload.single('file'), async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const file = req.file;
    const chatId = `${phoneNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`;

    // העלאת הקובץ ל-GreenAPI
    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('file', fs.createReadStream(file.path));
    
    const response = await axios.post(`${GREENAPI_BASE_URL}/sendFileByUpload/${GREENAPI_APITOKENINSTANCE}`, formData, {
      headers: formData.getHeaders()
    });

    // מחיקת הקובץ המקומי לאחר ההעלאה
    fs.unlinkSync(file.path);

    res.json({
      id: response.data.idMessage,
      sender: 'Me',
      text: `File: ${file.originalname}`,
      timestamp: Math.floor(Date.now() / 1000),
      phoneNumber: phoneNumber,
      fileUrl: response.data.fileUrl
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
});

app.get('/api/customerInfo', async (req, res) => {
  try {
    const { phoneNumber } = req.query;
    const customer = await findCustomerByPhone(phoneNumber);
    if (customer) {
      res.json({
        name: `${customer.fields.First_name} ${customer.fields.Last_name}`,
        email: customer.fields.Email,
        address: customer.fields.Address
      });
    } else {
      res.status(404).json({ error: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer info', details: error.message });
  }
});

// היסטוריית צ'אט

app.get('/api/chatHistory', async (req, res) => {
  try {
    const { phoneNumber, startDate, endDate, limit = 100 } = req.query;
    const chatId = `${phoneNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`;

    // המרת תאריכים לטיימסטמפ
    const startTimestamp = startDate ? new Date(startDate).getTime() / 1000 : 0;
    const endTimestamp = endDate ? new Date(endDate).getTime() / 1000 : Math.floor(Date.now() / 1000);

    const response = await axios.post(`${GREENAPI_BASE_URL}/getChatHistory/${GREENAPI_APITOKENINSTANCE}`, {
      chatId,
      count: limit
    });

    const messages = response.data
      .filter(msg => msg.timestamp >= startTimestamp && msg.timestamp <= endTimestamp)
      .map(msg => ({
        id: msg.idMessage,
        sender: msg.type === 'outgoing' ? 'Me' : 'Other',
        text: msg.textMessage || msg.caption || 'Non-text message',
        timestamp: msg.timestamp,
        phoneNumber: phoneNumber,
        type: msg.typeMessage
      }));

    messages.sort((a, b) => a.timestamp - b.timestamp);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history', details: error.message });
  }
});

// חיפוש בהיסטוריית הצ'אט

app.get('/api/searchChatHistory', async (req, res) => {
  try {
    const { phoneNumber, query, startDate, endDate, limit = 100 } = req.query;
    const chatId = `${phoneNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`;

    // המרת תאריכים לטיימסטמפ
    const startTimestamp = startDate ? new Date(startDate).getTime() / 1000 : 0;
    const endTimestamp = endDate ? new Date(endDate).getTime() / 1000 : Math.floor(Date.now() / 1000);

    const response = await axios.post(`${GREENAPI_BASE_URL}/getChatHistory/${GREENAPI_APITOKENINSTANCE}`, {
      chatId,
      count: limit
    });

    const messages = response.data
      .filter(msg => 
        msg.timestamp >= startTimestamp && 
        msg.timestamp <= endTimestamp &&
        (msg.textMessage && msg.textMessage.toLowerCase().includes(query.toLowerCase()))
      )
      .map(msg => ({
        id: msg.idMessage,
        sender: msg.type === 'outgoing' ? 'Me' : 'Other',
        text: msg.textMessage || msg.caption || 'Non-text message',
        timestamp: msg.timestamp,
        phoneNumber: phoneNumber,
        type: msg.typeMessage
      }));

    messages.sort((a, b) => a.timestamp - b.timestamp);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search chat history', details: error.message });
  }
});

// ייצוא היסטוריית צ'אט

app.get('/api/exportChatHistory', async (req, res) => {
  try {
    const { phoneNumber, format = 'json', startDate, endDate } = req.query;
    const chatId = `${phoneNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`;

    // המרת תאריכים לטיימסטמפ
    const startTimestamp = startDate ? new Date(startDate).getTime() / 1000 : 0;
    const endTimestamp = endDate ? new Date(endDate).getTime() / 1000 : Math.floor(Date.now() / 1000);

    const response = await axios.post(`${GREENAPI_BASE_URL}/getChatHistory/${GREENAPI_APITOKENINSTANCE}`, {
      chatId,
      count: 1000 // מספר גדול כדי לקבל את כל ההיסטוריה
    });

    const messages = response.data
      .filter(msg => msg.timestamp >= startTimestamp && msg.timestamp <= endTimestamp)
      .map(msg => ({
        id: msg.idMessage,
        sender: msg.type === 'outgoing' ? 'Me' : 'Other',
        text: msg.textMessage || msg.caption || 'Non-text message',
        timestamp: msg.timestamp,
        type: msg.typeMessage
      }));

    messages.sort((a, b) => a.timestamp - b.timestamp);

    if (format === 'csv') {
      const csv = messages.map(msg => 
        `${msg.timestamp},${msg.sender},"${msg.text.replace(/"/g, '""')}",${msg.type}`
      ).join('\n');
      res.header('Content-Type', 'text/csv');
      res.attachment(`chat_history_${phoneNumber}.csv`);
      return res.send(csv);
    } else {
      res.json(messages);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to export chat history', details: error.message });
  }
});

// ניהול סטטוס של הודעות

app.post('/api/messageStatus', async (req, res) => {
  try {
    const { messageId, status } = req.body;
    // כאן תוכל להוסיף לוגיקה לעדכון סטטוס ההודעה במסד הנתונים שלך
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update message status', details: error.message });
  }
});

// קבלת פרטי קבוצה

app.get('/api/groupInfo', async (req, res) => {
  try {
    const { groupId } = req.query;
    const response = await axios.post(`${GREENAPI_BASE_URL}/getGroupData/${GREENAPI_APITOKENINSTANCE}`, {
      groupId: groupId
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch group info', details: error.message });
  }
});

// שליחת הודעה לקבוצה

app.post('/api/sendGroupMessage', async (req, res) => {
  try {
    const { groupId, message } = req.body;
    const response = await axios.post(`${GREENAPI_BASE_URL}/sendMessage/${GREENAPI_APITOKENINSTANCE}`, {
      chatId: groupId,
      message: message
    });
    res.json({
      id: response.data.idMessage,
      sender: 'Me',
      text: message,
      timestamp: Math.floor(Date.now() / 1000),
      groupId: groupId
    });
} catch (error) {
    res.status(500).json({ error: 'Failed to send group message', details: error.message });
  }
});

// יצירת קבוצה חדשה

app.post('/api/createGroup', async (req, res) => {
  try {
    const { groupName, participants } = req.body;
    const response = await axios.post(`${GREENAPI_BASE_URL}/createGroup/${GREENAPI_APITOKENINSTANCE}`, {
      groupName: groupName,
      chatIds: participants
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group', details: error.message });
  }
});

// הוספת משתתף לקבוצה

app.post('/api/addGroupParticipant', async (req, res) => {
  try {
    const { groupId, participantNumber } = req.body;
    const response = await axios.post(`${GREENAPI_BASE_URL}/addGroupParticipant/${GREENAPI_APITOKENINSTANCE}`, {
      groupId: groupId,
      participantChatId: `${participantNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add group participant', details: error.message });
  }
});

// הסרת משתתף מקבוצה

app.post('/api/removeGroupParticipant', async (req, res) => {
  try {
    const { groupId, participantNumber } = req.body;
    const response = await axios.post(`${GREENAPI_BASE_URL}/removeGroupParticipant/${GREENAPI_APITOKENINSTANCE}`, {
      groupId: groupId,
      participantChatId: `${participantNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove group participant', details: error.message });
  }
});

// קבלת תמונת פרופיל

app.get('/api/profilePicture', async (req, res) => {
  try {
    const { phoneNumber } = req.query;
    const chatId = `${phoneNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`;
    const response = await axios.post(`${GREENAPI_BASE_URL}/getAvatar/${GREENAPI_APITOKENINSTANCE}`, {
      chatId: chatId
    });
    res.json({ avatarUrl: response.data.urlAvatar });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile picture', details: error.message });
  }
});

// בדיקת סטטוס חשבון

app.get('/api/accountStatus', async (req, res) => {
  try {
    const response = await axios.get(`${GREENAPI_BASE_URL}/getStateInstance/${GREENAPI_APITOKENINSTANCE}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch account status', details: error.message });
  }
});

// שליחת הודעה עם כפתורים

app.post('/api/sendButtonMessage', async (req, res) => {
  try {
    const { phoneNumber, message, buttons } = req.body;
    const chatId = `${phoneNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`;
    const response = await axios.post(`${GREENAPI_BASE_URL}/sendButtons/${GREENAPI_APITOKENINSTANCE}`, {
      chatId: chatId,
      message: message,
      buttons: buttons
    });
    res.json({
      id: response.data.idMessage,
      sender: 'Me',
      text: message,
      timestamp: Math.floor(Date.now() / 1000),
      phoneNumber: phoneNumber,
      buttons: buttons
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send button message', details: error.message });
  }
});

// קבלת סטטיסטיקות שימוש

app.get('/api/usage', async (req, res) => {
  try {
    const response = await axios.get(`${GREENAPI_BASE_URL}/getStatistics/${GREENAPI_APITOKENINSTANCE}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch usage statistics', details: error.message });
  }
});

// שליחת הודעה קולית

app.post('/api/sendVoiceMessage', upload.single('audio'), async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const file = req.file;
    const chatId = `${phoneNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`;

    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('file', fs.createReadStream(file.path));
    
    const response = await axios.post(`${GREENAPI_BASE_URL}/sendFileByUpload/${GREENAPI_APITOKENINSTANCE}`, formData, {
      headers: formData.getHeaders()
    });

    fs.unlinkSync(file.path);

    res.json({
      id: response.data.idMessage,
      sender: 'Me',
      text: 'Voice message',
      timestamp: Math.floor(Date.now() / 1000),
      phoneNumber: phoneNumber,
      fileUrl: response.data.fileUrl
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send voice message', details: error.message });
  }
});

// קבלת מידע על סטטוס של משתמש

app.get('/api/userStatus', async (req, res) => {
  try {
    const { phoneNumber } = req.query;
    const chatId = `${phoneNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`;
    const response = await axios.post(`${GREENAPI_BASE_URL}/getContactInfo/${GREENAPI_APITOKENINSTANCE}`, {
      chatId: chatId
    });
    res.json({
      phoneNumber: phoneNumber,
      status: response.data.status,
      lastSeen: response.data.lastSeen
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user status', details: error.message });
  }
});

// מחיקת הודעה

app.post('/api/deleteMessage', async (req, res) => {
  try {
    const { chatId, messageId } = req.body;
    const response = await axios.post(`${GREENAPI_BASE_URL}/deleteMessage/${GREENAPI_APITOKENINSTANCE}`, {
      chatId: chatId,
      idMessage: messageId
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message', details: error.message });
  }
});

// שליחת מיקום

app.post('/api/sendLocation', async (req, res) => {
  try {
    const { phoneNumber, latitude, longitude, name, address } = req.body;
    const chatId = `${phoneNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`;
    const response = await axios.post(`${GREENAPI_BASE_URL}/sendLocation/${GREENAPI_APITOKENINSTANCE}`, {
      chatId: chatId,
      latitude: latitude,
      longitude: longitude,
      nameLocation: name,
      address: address
    });
    res.json({
      id: response.data.idMessage,
      sender: 'Me',
      text: 'Location',
      timestamp: Math.floor(Date.now() / 1000),
      phoneNumber: phoneNumber,
      location: { latitude, longitude, name, address }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send location', details: error.message });
  }
});

// הגדרת webhook לקבלת עדכונים בזמן אמת

app.post('/api/setWebhook', async (req, res) => {
  try {
    const { url } = req.body;
    const response = await axios.post(`${GREENAPI_BASE_URL}/setWebhook/${GREENAPI_APITOKENINSTANCE}`, {
      webhookUrl: url
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to set webhook', details: error.message });
  }
});

// קבלת עדכונים מהwebhook
app.post('/webhook', (req, res) => {
  const update = req.body;
  console.log('Received update:', update);
  // כאן תוכל להוסיף לוגיקה לטיפול בעדכונים שמתקבלים
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});