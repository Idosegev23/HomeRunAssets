const express = require('express');
const cors = require('cors');
const Airtable = require('airtable');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 5001;

// הגדרת Airtable API
const AIRTABLE_API_KEY = 'patC2ORwELg6ZyiYm.72b542c50b01957c9ea3257edc21c9aeb6968f002d3e0015d273e61817ae3dde';
const AIRTABLE_BASE_ID = 'app77hvk5g7LD52Nf';

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// בדיקת חיבור ל-Airtable
base('Customers').select({ maxRecords: 1 }).firstPage((err, records) => {
  if (err) {
    console.error('Error connecting to Airtable:', err);
  } else {
    console.log('Successfully connected to Airtable');
  }
});

// הגדרת Green API
const GREENAPI_ID = '7103957095';
const GREENAPI_APITOKENINSTANCE = '3d5b3813c614437baea72c0e825205f22d19bf84baf34365a8';
const GREENAPI_BASE_URL = `https://api.greenapi.com/waInstance${GREENAPI_ID}`;

// הגדרת CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// הגדרת Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 דקות
  max: 100 // הגבלת כל IP ל-100 בקשות בכל חלון זמן
});

// החלת Rate Limiting על כל הבקשות
app.use(apiLimiter);

// Middleware לוגים
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// נקודת קצה לקבלת כל הלקוחות
app.get('/api/customers', async (req, res) => {
  try {
    console.log('Fetching customers from Airtable...');
    const records = await base('Customers').select().all();
    console.log(`Fetched ${records.length} records from Airtable`);
    const customers = records.map(record => ({
      id: record.id,
      ...record.fields
    }));
    console.log(`Processed ${customers.length} customers`);
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers', details: error.message });
  }
});

// נקודת קצה לקבלת כל הנכסים
app.get('/api/properties', async (req, res) => {
  try {
    console.log('Fetching properties from Airtable...');
    const records = await base('Properties').select().all();
    console.log(`Fetched ${records.length} records from Airtable`);
    const properties = records.map(record => {
      const property = {
        id: record.id,
        ...record.fields
      };
      // בדיקה אם יש תכונה 'city'
      if (!property.city) {
        console.warn(`Property with id ${property.id} is missing 'city' field`);
      }
      return property;
    });
    console.log(`Processed ${properties.length} properties`);
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties', details: error.message });
  }
});

// נקודת קצה להוספת נכס חדש
app.post('/api/properties', async (req, res) => {
  try {
    console.log('Adding new property to Airtable...');
    const newProperty = await base('Properties').create(req.body);
    console.log('Successfully added new property');
    res.status(201).json(newProperty);
  } catch (error) {
    console.error('Error adding property:', error);
    res.status(500).json({ error: 'Failed to add property', details: error.message });
  }
});

// נקודת קצה להוספת לקוח חדש
app.post('/api/customers', async (req, res) => {
  try {
    console.log('Adding new customer to Airtable...');
    const newCustomer = await base('Customers').create(req.body);
    console.log('Successfully added new customer');
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error adding customer:', error);
    res.status(500).json({ error: 'Failed to add customer', details: error.message });
  }
});

// נקודת קצה לקבלת הודעות אחרונות
app.get('/api/lastIncomingMessages', async (req, res) => {
  try {
    console.log('Fetching last incoming messages from Green API...');
    const response = await axios.get(`${GREENAPI_BASE_URL}/lastIncomingMessages/${GREENAPI_APITOKENINSTANCE}`);
    console.log('Successfully fetched last incoming messages');
    
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response format from Green API');
    }
    
    // עיבוד התשובה לפורמט הנדרש על ידי הלקוח
    const processedMessages = response.data.map(message => {
      if (!message || !message.senderData || !message.messageData || !message.messageData.textMessageData) {
        console.warn('Skipping invalid message:', message);
        return null;
      }
      return {
        id: message.idMessage,
        chatId: message.senderData.chatId,
        senderName: message.senderData.senderName,
        textMessage: message.messageData.textMessageData.textMessage,
        timestamp: message.timestamp
      };
    }).filter(message => message !== null);
    
    console.log(`Processed ${processedMessages.length} messages`);
    res.json(processedMessages);
  } catch (error) {
    console.error('Error fetching last incoming messages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch last incoming messages', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


// נקודת קצה לקבלת היסטוריית צ'אט
app.post('/api/getChatHistory', async (req, res) => {
  try {
    console.log('Fetching chat history from Green API...');
    const response = await axios.post(`${GREENAPI_BASE_URL}/getChatHistory/${GREENAPI_APITOKENINSTANCE}`, req.body);
    console.log('Successfully fetched chat history');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history', details: error.message });
  }
});

// נקודת קצה לשליחת הודעה
app.post('/api/sendMessage', async (req, res) => {
  try {
    console.log('Sending message via Green API...');
    const response = await axios.post(`${GREENAPI_BASE_URL}/sendMessage/${GREENAPI_APITOKENINSTANCE}`, req.body);
    console.log('Successfully sent message');
    res.json(response.data);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});
app.get('/api/matches', async (req, res) => {
  try {
    console.log('Fetching matches from Airtable...');
    const records = await base('Matches').select().all();
    console.log(`Fetched ${records.length} records from Airtable`);
    const matches = records.map(record => ({
      id: record.id,
      ...record.fields
    }));
    console.log(`Processed ${matches.length} matches`);
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches', details: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));