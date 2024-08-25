import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dataHandler from '../api/dataHandler.mjs';
import getChatHistory from '../api/getChatHistory.mjs';
import getChats from '../api/getChats.mjs';
import getLastIncomingMessages from '../api/getLastIncomingMessages.mjs';
import getMatchingProperties from '../api/getMatchingProperties.mjs';
import getUnreadMessagesCount from '../api/getUnreadMessagesCount.mjs';
import ping from '../api/ping.mjs';
import sendMessage from '../api/sendMessage.mjs';
import uploadFile from '../api/uploadFile.mjs';
import webhookHandler from '../api/webhookHandler.mjs';

const app = express();
const PORT = process.env.PORT || 3000;

// הגדרת CORS בצורה מותאמת לשני הסביבות: פריסה ומקומי
const allowedOrigins = ['http://localhost:5001', 'process.env.REACT_APP_API_BASE_URL'];
app.use(cors({
  origin: function (origin, callback) {
    // לאפשר גישה אם המקור נמצא ברשימת המקורות המותרים
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Define routes
app.use('/api/dataHandler', dataHandler);
app.use('/api/getChatHistory', getChatHistory);
app.use('/api/getChats', getChats);
app.use('/api/getLastIncomingMessages', getLastIncomingMessages);
app.use('/api/getMatchingProperties', getMatchingProperties);
app.use('/api/getUnreadMessagesCount', getUnreadMessagesCount);
app.use('/api/ping', ping);
app.use('/api/sendMessage', sendMessage);
app.use('/api/uploadFile', uploadFile);
app.use('/api/webhookHandler', webhookHandler);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '..', 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
