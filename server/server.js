const express = require('express');
const cors = require('cors');
const Airtable = require('airtable');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const EventEmitter = require('events');
const FormData = require('form-data');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5001;

// הגדרת Airtable API
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'patC2ORwELg6ZyiYm.72b542c50b01957c9ea3257edc21c9aeb6968f002d3e0015d273e61817ae3dde';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'app77hvk5g7LD52Nf';

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// הגדרת Green API
const GREENAPI_ID = process.env.GREENAPI_ID || '7103957095';
const GREENAPI_APITOKENINSTANCE = process.env.GREENAPI_APITOKENINSTANCE || '3d5b3813c614437baea72c0e825205f22d19bf84baf34365a8';
const GREENAPI_BASE_URL = `https://api.greenapi.com/waInstance${GREENAPI_ID}`;

// הגדרת CORS
const allowedOrigins = [
  'https://home-run-assets.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    // אפשר בקשות ללא מקור (למשל, מ-Postman או מדפדפנים ישירות)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// הגדרת Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(apiLimiter);

// Middleware לוגים
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// הגדרת multer לטיפול בהעלאת קבצים
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// יצירת EventEmitter לטיפול באירועים בזמן אמת
const messageEmitter = new EventEmitter();

// פונקציה לביצוע בקשה ל-Green API עם exponential backoff
async function fetchWithBackoff(url, options, retries = 3, delay = 1000) {
  try {
    console.log(`Attempting to fetch from ${url}`);
    const response = await axios(url, options);
    console.log(`Successfully fetched from ${url}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 429 && retries > 0) {
      console.log(`Rate limited. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithBackoff(url, options, retries - 1, delay * 2);
    }
    console.error(`Error fetching from ${url}:`, error);
    throw error;
  }
}

// פונקציה עזר למציאת לקוח לפי מספר טלפון
async function findCustomerByPhone(phoneNumber) {
  try {
    console.log(`Searching for customer with phone number: ${phoneNumber}`);
    const records = await base('Customers').select({
      filterByFormula: `{Cell} = '${phoneNumber}'`
    }).firstPage();
    
    if (records.length > 0) {
      console.log(`Found customer: ${records[0].fields.First_name} ${records[0].fields.Last_name}`);
      return records[0];
    } else {
      console.log(`No customer found for phone number: ${phoneNumber}`);
      return null;
    }
  } catch (error) {
    console.error('Error finding customer by phone:', error);
    return null;
  }
}

// פונקציה עזר להמרת מספר טלפון לפורמט הנכון עבור Green API
function formatPhoneNumberForGreenAPI(phoneNumber) {
  console.log(`Formatting phone number for Green API: ${phoneNumber}`);

  if (!phoneNumber) {
    throw new Error("PhoneNumber is undefined or null");
  }

  // הסר כל תו שאינו ספרה
  phoneNumber = phoneNumber.replace(/\D/g, '');

  // אם המספר מתחיל ב-0, הסר אותו
  if (phoneNumber.startsWith('0')) {
    phoneNumber = phoneNumber.slice(1);
  }

  // אם המספר לא מתחיל ב-972, הוסף אותו
  if (!phoneNumber.startsWith('972')) {
    phoneNumber = '972' + phoneNumber;
  }

  // הוסף את הסיומת @c.us
  const formattedNumber = `${phoneNumber}@c.us`;

  console.log(`Formatted phone number: ${formattedNumber}`);
  return formattedNumber;
}

// פונקציה עזר להמרת מספר טלפון
function formatPhoneNumber(phoneNumber) {
  console.log(`Formatting phone number: ${phoneNumber}`);
  // הסר כל תו שאינו ספרה
  phoneNumber = phoneNumber.replace(/\D/g, '');
  
  // אם המספר מתחיל ב-972, הסר אותו והוסף 0
  if (phoneNumber.startsWith('972')) {
    phoneNumber = '0' + phoneNumber.slice(3);
  } else if (!phoneNumber.startsWith('0')) {
    // אם המספר לא מתחיל ב-0, הוסף 0
    phoneNumber = '0' + phoneNumber;
  }
  
  console.log(`Formatted phone number: ${phoneNumber}`);
  return phoneNumber;
}


// נקודת קצה לקבלת כל הצ'אטים
app.get('/api/chats', async (req, res) => {
  try {
    console.log('Fetching all chats...');
    const response = await fetchWithBackoff(`${GREENAPI_BASE_URL}/getChats/${GREENAPI_APITOKENINSTANCE}`);
    
    console.log(`Raw response from Green API: ${JSON.stringify(response)}`);

    if (!Array.isArray(response)) {
      console.error('Unexpected response format from Green API');
      return res.status(500).json({ error: 'Unexpected response format from Green API' });
    }

    const chatsPromises = response.map(async (chat) => {
      const phoneNumber = formatPhoneNumber(chat.id.replace('@c.us', ''));
      const customer = await findCustomerByPhone(phoneNumber);
      return {
        phoneNumber,
        customerName: customer ? `${customer.fields.First_name} ${customer.fields.Last_name}` : (chat.name || 'Unknown'),
        customerId: customer ? customer.id : null,
        lastMessage: chat.lastMessage ? chat.lastMessage.text : 'No messages',
        timestamp: chat.lastMessage ? chat.lastMessage.timestamp : Date.now()
      };
    });

    const chats = await Promise.all(chatsPromises);
    
    console.log(`Fetched ${chats.length} chats`);
    console.log(`Fetched chats: ${JSON.stringify(chats)}`);
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats', details: error.message });
  }
});

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
    
    if (!response.data) {
      throw new Error('No data received from Green API');
    }

    if (!Array.isArray(response.data)) {
      console.warn('Unexpected response format from Green API:', response.data);
      throw new Error('Invalid response format from Green API');
    }

    // Log the number of messages received
    console.log(`Received ${response.data.length} messages from Green API`);

    // Process and format the messages if needed
    const formattedMessages = response.data.map(message => ({
      idMessage: message.idMessage,
      timestamp: message.timestamp,
      typeMessage: message.typeMessage,
      textMessage: message.textMessage,
      statusMessage: message.statusMessage,
      senderData: message.senderData,
      // Add any other fields you need
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching last incoming messages:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Green API response error:', error.response.data);
      console.error('Green API response status:', error.response.status);
      console.error('Green API response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from Green API');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request to Green API:', error.message);
    }
    res.status(500).json({ 
      error: 'Failed to fetch last incoming messages', 
      details: error.message,
      serverMessage: 'An internal server error occurred while fetching messages.'
    });
  }
});

// נקודת קצה לקבלת היסטוריית צ'אט
app.get('/api/messages/:phoneNumber', async (req, res) => {
  console.log(`Received request for chat history. Phone number: ${req.params.phoneNumber}`);
  
  // בדיקה אם זו בקשת stream
  if (req.params.phoneNumber === 'stream') {
    console.log('Redirecting to stream endpoint');
    return handleMessageStream(req, res);
  }

  try {
    console.log(`Fetching chat history for phone number: ${req.params.phoneNumber}`);
    const chatId = formatPhoneNumberForGreenAPI(req.params.phoneNumber);
    console.log(`Formatted chatId: ${chatId}`);
    
    console.log(`Sending request to Green API for chat history. ChatId: ${chatId}`);
    const response = await fetchWithBackoff(`${GREENAPI_BASE_URL}/getChatHistory/${GREENAPI_APITOKENINSTANCE}`, {
      method: 'POST',
      data: {
        chatId: chatId,
        count: 100
      }
    });
    
    console.log(`Raw response from Green API: ${JSON.stringify(response)}`);

    if (!Array.isArray(response)) {
      console.error('Unexpected response format from Green API');
      return res.status(500).json({ error: 'Unexpected response format from Green API' });
    }

    const messages = response.map(msg => ({
      id: msg.idMessage,
      sender: msg.type === 'outgoing' ? 'Me' : 'Other',
      text: msg.textMessage || msg.caption || 'Non-text message',
      timestamp: msg.timestamp,
      phoneNumber: formatPhoneNumber(req.params.phoneNumber)
    }));

    messages.sort((a, b) => a.timestamp - b.timestamp);

    console.log(`Successfully processed ${messages.length} messages for ${req.params.phoneNumber}`);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    if (error.response && error.response.status === 400) {
      console.error('Bad Request Error:', error.response.data);
      return res.status(400).json({ error: 'Invalid request', details: error.response.data });
    }
    res.status(500).json({ error: 'Failed to fetch chat history', details: error.message });
  }
});

app.get('/api/customers/:id', async (req, res) => {
  try {
    const record = await base('Customers').find(req.params.id);
    res.json({
      id: record.id,
      ...record.fields
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

app.get('/api/chat-history/:customerId', async (req, res) => {
  try {
    const records = await base('Conversations').select({
      filterByFormula: `{customerId} = '${req.params.customerId}'`,
      sort: [{ field: 'timestamp', direction: 'asc' }]
    }).all();
    const messages = records.map(record => ({
      id: record.id,
      ...record.fields
    }));
    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

app.get('/api/properties/:id', async (req, res) => {
  try {
    const record = await base('Properties').find(req.params.id);
    res.json({
      id: record.id,
      ...record.fields
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// פונקציה לטיפול בstream של הודעות
function handleMessageStream(req, res) {
  console.log('Client connected to SSE');
  const phoneNumber = req.query.phoneNumber;
  if (phoneNumber) {
    console.log(`Streaming messages for phone number: ${phoneNumber}`);
  } else {
    console.log('No specific phone number provided for streaming');
  }
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const newMessageListener = (message) => {
    try {
      console.log('Attempting to send message to client:', message);
      const data = `data: ${JSON.stringify(message)}\n\n`;
      res.write(data);
      console.log('Successfully sent message to client');
    } catch (error) {
      console.error('Error sending message to client:', error);
    }
  };

  messageEmitter.on('newMessage', newMessageListener);

  // שליחת הודעת בדיקה לוודא שהחיבור עובד
  console.log('Sending test message to client');
  res.write(`data: ${JSON.stringify({type: 'connection', message: 'Connected successfully'})}\n\n`);

  req.on('close', () => {
    console.log('Client disconnected from SSE');
    messageEmitter.removeListener('newMessage', newMessageListener);
  });
}

// נקודת קצה נפרדת ל-stream (למקרה שמישהו מנסה לגשת ישירות)
app.get('/api/messages/stream', handleMessageStream);

// נקודת קצה לשליחת הודעה
app.post('/api/sendMessage', async (req, res) => {
  try {
    console.log('Sending message via Green API...');
    const { phoneNumber, text } = req.body;
    console.log('Received phone number:', phoneNumber); // לוג לדיבוג
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }
    const chatId = formatPhoneNumberForGreenAPI(phoneNumber);
    console.log('Formatted chatId:', chatId); // לוג לדיבוג
    
    const response = await fetchWithBackoff(`${GREENAPI_BASE_URL}/sendMessage/${GREENAPI_APITOKENINSTANCE}`, {
      method: 'POST',
      data: {
        chatId: chatId,
        message: text
      }
    });
    
    console.log('Successfully sent message');
    res.json({ 
      id: response.idMessage,
      sender: 'Me',
      text: text,
      timestamp: new Date().toISOString(),
      phoneNumber: formatPhoneNumber(phoneNumber)
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});


app.get('/api/messages/unread', async (req, res) => {
  try {
    console.log('Fetching unread messages count from Green API...');
    const response = await fetchWithBackoff(`${GREENAPI_BASE_URL}/getChats/${GREENAPI_APITOKENINSTANCE}`);
    
    if (!Array.isArray(response)) {
      console.error('Unexpected response format from Green API');
      return res.status(500).json({ error: 'Unexpected response format from Green API' });
    }

    const unreadCount = response.reduce((count, chat) => {
      return count + (chat.unreadCount || 0);
    }, 0);

    console.log(`Total unread messages: ${unreadCount}`);
    res.json({ count: unreadCount });
  } catch (error) {
    console.error('Error fetching unread messages count:', error);
    res.status(500).json({ error: 'Failed to fetch unread messages count', details: error.message });
  }
});

// נקודת קצה לקבלת פרטי לקוח
app.get('/api/customers/:customerId', async (req, res) => {
  try {
    console.log(`Fetching customer details for ID: ${req.params.customerId}`);
    const customerRecord = await base('Customers').find(req.params.customerId);
    if (!customerRecord) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    console.log(`Successfully fetched customer details for ${customerRecord.fields.First_name} ${customerRecord.fields.Last_name}`);
    res.json(customerRecord.fields);
  } catch (error) {
    console.error('Error fetching customer details:', error);
    res.status(500).json({ error: 'Failed to fetch customer details', details: error.message });
  }
});

// נקודת קצה לקבלת נכסים מתאימים ללקוח
app.get('/api/matchingProperties/:customerId', async (req, res) => {
  try {
    console.log(`Fetching matching properties for customer with ID: ${req.params.customerId}`);
    const customerRecord = await base('Customers').find(req.params.customerId);
    
    if (!customerRecord) {
      console.log(`Customer with ID ${req.params.customerId} not found.`);
      return res.status(404).json({ error: 'Customer not found' });
    }

    let customerBudget;
    if (typeof customerRecord.fields.Budget === 'string') {
      customerBudget = parseFloat(customerRecord.fields.Budget.replace(/[^\d.-]/g, ''));
      console.log(`Customer budget (parsed from string): ${customerBudget}`);
    } else if (typeof customerRecord.fields.Budget === 'number') {
      customerBudget = customerRecord.fields.Budget;
      console.log(`Customer budget (number): ${customerBudget}`);
    } else {
      console.warn(`Unexpected Budget format for customer ${req.params.customerId}: ${customerRecord.fields.Budget}`);
      customerBudget = 0;
    }

    if (isNaN(customerBudget)) {
      console.error(`Failed to parse customer budget for customer ${req.params.customerId}.`);
      return res.status(400).json({ error: 'Invalid customer budget format' });
    }

    const customerRooms = customerRecord.fields.Rooms;
    const customerCity = customerRecord.fields.City;

    console.log(`Customer preferences - Budget: ${customerBudget}, Rooms: ${customerRooms}, City: ${customerCity}`);

    const properties = await base('Properties').select({
      filterByFormula: `AND(
        {price} <= ${customerBudget * 1.1},
        {price} >= ${customerBudget * 0.9}
      )`
    }).all();

    console.log(`Found ${properties.length} properties within budget range for customer ${req.params.customerId}.`);

    const matchingProperties = properties.map(property => {
      const priceMatch = property.fields.price >= customerBudget * 0.9 && property.fields.price <= customerBudget * 1.1;
      const roomsMatch = property.fields.rooms ? property.fields.rooms === customerRooms : false;
      const cityMatch = property.fields.city ? property.fields.city === customerCity : false;

      let totalMatchPercentage = 0;
      let matchDetails = [];
      if (priceMatch) {
        totalMatchPercentage += 70;
      } else {
        matchDetails.push('המחיר אינו תואם');
      }
      if (roomsMatch) {
        totalMatchPercentage += 15;
      } else {
        matchDetails.push('מספר החדרים אינו תואם');
      }
      if (cityMatch) {
        totalMatchPercentage += 15;
      } else {
        matchDetails.push('העיר אינה תואמת');
      }

      console.log(`Property ${property.id} match details: Price: ${priceMatch}, Rooms: ${roomsMatch}, City: ${cityMatch}`);
      return {
        id: property.id,
        address: property.fields.city ? `${property.fields.city}, ${property.fields.street}` : `${property.fields.street}`,
        price: property.fields.price,
        rooms: property.fields.rooms,
        square_meters: property.fields.square_meters,
        floor: property.fields.floor,
        imageurl: property.fields.imageurl,
        totalMatchPercentage: totalMatchPercentage,
        matchDetails: matchDetails.join(', ')
      };
    });

    console.log(`Returning ${matchingProperties.length} matching properties for customer ${req.params.customerId}`);
    res.json(matchingProperties);
  } catch (error) {
    console.error(`Error fetching matching properties for customer ${req.params.customerId}:`, error);
    res.status(500).json({ error: 'Failed to fetch matching properties', details: error.message });
  }
});

// נקודת קצה להעלאת קובץ
app.post('/api/uploadFile', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  try {
    console.log('Uploading file to Green API...');
    const filePath = req.file.path;
    const chatId = formatPhoneNumberForGreenAPI(req.body.chatId);

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

    console.log('Successfully uploaded file');
    res.json({ 
      id: response.data.idMessage,
      sender: 'Me',
      text: req.file.originalname,
      timestamp: new Date().toISOString(),
      phoneNumber: formatPhoneNumber(req.body.chatId),
      type: 'outgoing',
      fileUrl: response.data.urlFile,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype
    });

    // Clean up the uploaded file
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
});

// נקודת קצה לקבלת Webhooks מ-Green API
app.post('/webhook', express.json(), (req, res) => {
  console.log('Received webhook:', JSON.stringify(req.body));
  
  const { body } = req;
  if (body.typeWebhook === 'incomingMessageReceived') {
    console.log('Processing incoming message');
    let message = {
      id: body.idMessage,
      sender: 'Other',
      timestamp: body.timestamp,
      phoneNumber: formatPhoneNumberForGreenAPI(body.senderData?.sender)
    };

    if (body.messageData?.typeMessage === 'textMessage') {
      message.text = body.messageData.textMessageData?.textMessage || 'No text content';
      message.type = 'text';
    } else if (['imageMessage', 'videoMessage', 'documentMessage', 'audioMessage'].includes(body.messageData?.typeMessage)) {
      message.text = body.messageData.fileMessageData?.caption || 'File received';
      message.type = body.messageData.typeMessage;
      message.fileUrl = body.messageData.fileMessageData?.downloadUrl;
      message.fileName = body.messageData.fileMessageData?.fileName;
      message.mimeType = body.messageData.fileMessageData?.mimeType;
    } else if (body.messageData?.typeMessage === 'extendedTextMessage') {
      message.text = body.messageData.extendedTextMessageData?.text || 'No text content';
      message.type = 'extendedText';
    } else {
      message.text = 'Unsupported message type';
      message.type = body.messageData?.typeMessage || 'unknown';
    }
    
    console.log('Emitting new message:', message);
    messageEmitter.emit('newMessage', message);
  } else {
    console.log('Received non-message webhook:', body.typeWebhook);
  }
  
  res.sendStatus(200);
});

// הוספת נקודת קצה לבדיקת חיבור
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Server is running' });
});

// הפעלת השרת
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
