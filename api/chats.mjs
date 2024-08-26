import axios from 'axios';
import { kv } from '@vercel/kv';

const GREENAPI_ID = process.env.GREENAPI_ID;
const GREENAPI_APITOKENINSTANCE = process.env.GREENAPI_APITOKENINSTANCE;
const GREENAPI_BASE_URL = `https://api.green-api.com/waInstance${GREENAPI_ID}`;

// שליחת הודעה טקסט
export async function sendMessage(req, res) {
  const { phoneNumber, message } = req.body;
  try {
    const chatId = `${phoneNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`;
    const response = await axios.post(`${GREENAPI_BASE_URL}/sendMessage/${GREENAPI_APITOKENINSTANCE}`, {
      chatId,
      message
    });
    res.status(200).json({ success: true, messageId: response.data.idMessage });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
}

// קבלת הודעות אחרונות
export async function getRecentMessages(req, res) {
  const { phoneNumber } = req.query;
  try {
    const chatId = `${phoneNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`;
    const cachedMessages = await kv.get(`recent_messages:${chatId}`);
    
    if (cachedMessages) {
      return res.status(200).json(cachedMessages);
    }

    const response = await axios.post(`${GREENAPI_BASE_URL}/getChatHistory/${GREENAPI_APITOKENINSTANCE}`, {
      chatId,
      count: 50
    });

    const messages = response.data.map(msg => ({
      id: msg.idMessage,
      sender: msg.type === 'outgoing' ? 'Me' : 'Other',
      text: msg.textMessage || msg.caption || 'Non-text message',
      timestamp: msg.timestamp,
      type: msg.typeMessage
    }));

    await kv.set(`recent_messages:${chatId}`, messages, { ex: 300 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent messages' });
  }
}

// שליחת קובץ (תמונה או וידאו)
export async function sendFile(req, res) {
  const { phoneNumber, fileUrl, caption } = req.body;
  try {
    const chatId = `${phoneNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`;
    const response = await axios.post(`${GREENAPI_BASE_URL}/sendFileByUrl/${GREENAPI_APITOKENINSTANCE}`, {
      chatId,
      urlFile: fileUrl,
      fileName: 'file',
      caption: caption || ''
    });
    res.status(200).json({ success: true, messageId: response.data.idMessage });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send file' });
  }
}

// קבלת היסטוריית צ'אט
export async function getChatHistory(req, res) {
  const { phoneNumber, limit = 100 } = req.query;
  try {
    const chatId = `${phoneNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`;
    const cachedHistory = await kv.get(`chat_history:${chatId}`);
    
    if (cachedHistory) {
      return res.status(200).json(cachedHistory);
    }

    const response = await axios.post(`${GREENAPI_BASE_URL}/getChatHistory/${GREENAPI_APITOKENINSTANCE}`, {
      chatId,
      count: limit
    });

    const history = response.data.map(msg => ({
      id: msg.idMessage,
      sender: msg.type === 'outgoing' ? 'Me' : 'Other',
      text: msg.textMessage || msg.caption || 'Non-text message',
      timestamp: msg.timestamp,
      type: msg.typeMessage
    }));

    await kv.set(`chat_history:${chatId}`, history, { ex: 600 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
}

// Webhook לקבלת הודעות בזמן אמת
export async function webhookHandler(req, res) {
  const update = req.body;
  console.log('Received update:', update);
  
  // כאן תוכל להוסיף לוגיקה לטיפול בעדכונים שמתקבלים

  res.status(200).send('OK');
}

export default async function handler(req, res) {
  const { method } = req;
  
  switch(method) {
    case 'POST':
      if (req.url.endsWith('/sendMessage')) {
        await sendMessage(req, res);
      } else if (req.url.endsWith('/sendFile')) {
        await sendFile(req, res);
      } else if (req.url.endsWith('/webhook')) {
        await webhookHandler(req, res);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
      break;
    case 'GET':
      if (req.url.includes('/getRecentMessages')) {
        await getRecentMessages(req, res);
      } else if (req.url.includes('/getChatHistory')) {
        await getChatHistory(req, res);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}