import axios from 'axios';

const GREENAPI_ID = process.env.GREENAPI_ID;
const GREENAPI_APITOKENINSTANCE = process.env.GREENAPI_APITOKENINSTANCE;
const GREENAPI_BASE_URL = `https://api.greenapi.com/waInstance${GREENAPI_ID}`;

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
    console.log("Received request to send message");
    console.log("Request body:", req.body);

    const { phoneNumber, text } = req.body;

    if (!phoneNumber || !text) {
        console.log("Missing phone number or text");
        return res.status(400).json({ error: 'Phone number and text are required' });
    }

    if (!isWithinAllowedTime()) {
        console.log("Attempt to send message outside allowed hours");
        return res.status(400).json({ error: 'Messages cannot be sent outside allowed hours.' });
    }

    try {
        const chatId = `${phoneNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`;
        const apiUrl = `${GREENAPI_BASE_URL}/sendMessage/${GREENAPI_APITOKENINSTANCE}`;

        console.log("Prepared API URL:", apiUrl);
        console.log("Prepared Chat ID:", chatId);

        console.log("Sending request to GreenAPI");
        const response = await axios.post(apiUrl, {
            chatId,
            message: text,
        });

        console.log("Response from GreenAPI:", response.data);

        res.status(200).json({ id: response.data.idMessage, status: 'Message sent successfully' });
    } catch (error) {
        console.error("Error sending message:", error);
        console.error("Error response:", error.response?.data);

        if (error.response) {
            if (error.response.status === 429) {
                console.log("Rate limit exceeded");
                res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
            } else {
                console.log(`Received error status ${error.response.status} from GreenAPI`);
                res.status(error.response.status).json({ error: error.response.data });
            }
        } else if (error.request) {
            console.log("No response received from GreenAPI");
            res.status(500).json({ error: 'No response received from messaging service' });
        } else {
            console.log("Error setting up the request");
            res.status(500).json({ error: 'Error setting up the request' });
        }
    }
}