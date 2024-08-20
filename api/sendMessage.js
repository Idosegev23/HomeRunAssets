import axios from 'axios';

const GREENAPI_ID = process.env.GREENAPI_ID;
const GREENAPI_APITOKENINSTANCE = process.env.GREENAPI_APITOKENINSTANCE;
const GREENAPI_BASE_URL = `https://api.green-api.com/waInstance${GREENAPI_ID}`;

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

export default async function handler(req, res) {
    try {
        console.log("Received request to send message");
        const { phoneNumber, text } = req.body;

        if (!phoneNumber || !text) {
            console.error("Missing phone number or text");
            return res.status(400).json({ error: 'Phone number and text are required' });
        }

        if (!isWithinAllowedTime()) {
            console.error("Attempt to send message outside allowed hours");
            return res.status(400).json({ error: 'Messages cannot be sent outside allowed hours.' });
        }

        const chatId = `${phoneNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`;
        const apiUrl = `${GREENAPI_BASE_URL}/sendMessage/${GREENAPI_APITOKENINSTANCE}`;

        console.log("Sending request to GreenAPI with Chat ID:", chatId);
        const response = await axios.post(apiUrl, { chatId, message: text });

        console.log("Response from GreenAPI:", response.data);
        return res.status(200).json({ id: response.data.idMessage, status: 'Message sent successfully' });

    } catch (error) {
        console.error("Error occurred during message sending:", error);

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
