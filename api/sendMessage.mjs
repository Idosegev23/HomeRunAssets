import pkg from '../src/utils/api.js';
import axios from 'axios';
import 'dotenv/config';


const { getApiBaseUrl } = pkg;

const GREENAPI_ID = process.env.GREENAPI_ID;
const GREENAPI_APITOKENINSTANCE = process.env.GREENAPI_APITOKENINSTANCE;
const GREENAPI_BASE_URL = `https://api.green-api.com/waInstance${GREENAPI_ID}`;

const axiosInstance = axios.create({
  baseURL: GREENAPI_BASE_URL,
  timeout: 30000,
  headers: {'Content-Type': 'application/json'}
});

const isWithinAllowedTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const day = now.getDay();

    console.log(`Current time: ${now}, Hour: ${hours}, Day: ${day}`);

    if (day === 6) {
        console.log("It's Saturday, messages not allowed");
        return false;
    }

    if (day === 5 && hours >= 14) {
        console.log("It's Friday after 14:00, messages not allowed");
        return false;
    }

    if (hours < 8 || hours >= 20) {
        console.log("Outside allowed hours (8:00-20:00)");
        return false;
    }

    console.log("Within allowed time");
    return true;
};

const formatPhoneNumber = (phoneNumber) => {
    console.log("Formatting phone number:", phoneNumber);
    let formattedNumber = phoneNumber;
    if (typeof phoneNumber === 'number') {
        formattedNumber = phoneNumber.toString();
    } else if (typeof phoneNumber !== 'string') {
        console.error("Phone number is not a string or number:", phoneNumber);
        throw new Error('Phone number must be a string or number');
    }
    
    formattedNumber = formattedNumber.replace(/\D/g, '');
    formattedNumber = formattedNumber.replace(/^0/, '');
    
    if (!formattedNumber.startsWith('972')) {
        formattedNumber = '972' + formattedNumber;
    }
    
    return formattedNumber;
};

const replaceTemplateValues = (text, values = {}) => {
    console.log("Template values:", values);
    console.log("Original text:", text);
    const replacedText = text.replace(/{(\w+)}/g, (match, key) => {
        const value = values[key];
        console.log(`Replacing ${match} with ${value}`);
        return value !== undefined ? value : match;
    });
    console.log("Replaced text:", replacedText);
    return replacedText;
};

const checkMessageStatus = async (idMessage) => {
  try {
    const response = await axiosInstance.get(`/messageStatus/${GREENAPI_APITOKENINSTANCE}/${idMessage}`);
    console.log("Full message status response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error checking message status:", error);
    return null;
  }
};

const sendMessageWithRetry = async (chatId, message, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1} to send message...`);
      const response = await axiosInstance.post(`/sendMessage/${GREENAPI_APITOKENINSTANCE}`, { chatId, message }, {
        headers: {
          'Origin': getApiBaseUrl(),
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      console.log(`Message sent successfully on attempt ${i + 1}`);
      return response.data;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

export default async function handler(req, res) {
    console.log("Axios version:", axios.VERSION);
    console.log("Received request to send message");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    try {
        const { phoneNumber, text, templateValues } = req.body;

        if (!phoneNumber || !text) {
            console.error("Missing phone number or text");
            return res.status(400).json({ error: 'Phone number and text are required' });
        }

        if (!isWithinAllowedTime()) {
            console.error("Attempt to send message outside allowed hours");
            return res.status(400).json({ error: 'Messages cannot be sent outside allowed hours.' });
        }

        let formattedPhoneNumber;
        try {
            formattedPhoneNumber = formatPhoneNumber(phoneNumber);
        } catch (error) {
            console.error("Error formatting phone number:", error);
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        const finalText = replaceTemplateValues(text, templateValues || {});

        const chatId = `${formattedPhoneNumber}@c.us`;

        console.log("Preparing to send request to GreenAPI");
        console.log("ChatId:", chatId);
        console.log("Message:", finalText);
        console.log("Template Values:", JSON.stringify(templateValues, null, 2));

        try {
            const response = await sendMessageWithRetry(chatId, finalText);
            console.log("Raw response from GreenAPI:", response);

            const idMessage = response.idMessage;
            
            const messageStatus = await checkMessageStatus(idMessage);
            console.log("Message status:", messageStatus);

            if (messageStatus) {
                return res.status(200).json({ id: idMessage, status: 'Message sent successfully', messageStatus });
            } else {
                return res.status(500).json({ error: 'Could not confirm message status' });
            }
        } catch (error) {
            console.error("Error sending message:", error);
            
            if (error.response && error.response.status === 504) {
                return res.status(504).json({ error: 'Gateway Timeout. The server did not respond in time.' });
            }

            return res.status(500).json({ error: 'Failed to send message', details: error.message });
        }

    } catch (error) {
        console.error("Full error object:", error);
        
        if (error.code === 'ECONNREFUSED') {
            console.error("Connection refused. Check your network or the API endpoint.");
            return res.status(503).json({ error: 'Service unavailable' });
        }

        if (error.code === 'ETIMEDOUT') {
            console.error("Request timed out. The API might be slow or unresponsive.");
            return res.status(504).json({ error: 'Gateway timeout' });
        }

        if (error.response) {
            const statusCode = error.response.status;
            const errorMessage = error.response.data;
            console.error(`Received status ${statusCode} from GreenAPI`, errorMessage);
            return res.status(statusCode).json({ error: errorMessage });
        }

        if (error.request) {
            console.error("No response received from GreenAPI", error.request);
            return res.status(500).json({ error: 'No response received from messaging service' });
        }

        console.error("Error setting up the request", error.message);
        return res.status(500).json({ error: 'Error setting up the request', details: error.message });
    }
}
