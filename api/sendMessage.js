const axios = require('axios');

const GREENAPI_ID = process.env.GREENAPI_ID;
const GREENAPI_APITOKENINSTANCE = process.env.GREENAPI_APITOKENINSTANCE;
const GREENAPI_BASE_URL = `https://api.green-api.com/waInstance${GREENAPI_ID}`;

const axiosInstance = axios.create({
  baseURL: GREENAPI_BASE_URL,
  timeout: 10000,
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
    if (typeof phoneNumber !== 'string') {
        console.error("Phone number is not a string:", phoneNumber);
        throw new Error('Phone number must be a string');
    }
    return phoneNumber.replace(/\D/g, '').replace(/^0/, '972');
};

module.exports = async function handler(req, res) {
    console.log("Axios version:", axios.VERSION);
    console.log("Received request to send message");
    console.log("Request body:", req.body);

    try {
        const { phoneNumber, text } = req.body;

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

        const chatId = `${formattedPhoneNumber}@c.us`;
        const apiUrl = `/sendMessage/${GREENAPI_APITOKENINSTANCE}`;

        console.log("Preparing to send request to GreenAPI");
        console.log("API URL:", apiUrl);
        console.log("Request payload:", { chatId, message: text });

        try {
            const response = await axiosInstance.post(apiUrl, { chatId, message: text }, {
                headers: {
                    'Origin': 'https://your-domain.com',
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Content-Type'
                }
            });

            console.log("Raw response from GreenAPI:", response);
            console.log("Response data from GreenAPI:", response.data);

            return res.status(200).json({ id: response.data.idMessage, status: 'Message sent successfully' });
        } catch (axiosError) {
            console.error("Axios specific error:", axiosError);
            throw axiosError;
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
};