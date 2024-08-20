import axios from 'axios';

const GREENAPI_ID = process.env.GREENAPI_ID;
const GREENAPI_APITOKENINSTANCE = process.env.GREENAPI_APITOKENINSTANCE;
const GREENAPI_BASE_URL = `https://api.greenapi.com/waInstance${GREENAPI_ID}`;

const isWithinAllowedTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const day = now.getDay();

    if (day === 6) { // יום שבת - אין שליחת הודעות
        return false;
    }

    if (day === 5 && hours >= 14) { // יום שישי אחרי השעה 14:00 - אין שליחת הודעות
        return false;
    }

    if (hours < 8 || hours >= 20) { // שאר הימים - שעות מותרות מ-8:00 עד 20:00
        return false;
    }

    return true;
};

export default async function handler(req, res) {
    const { phoneNumber, text } = req.body;

    if (!phoneNumber || !text) {
        return res.status(400).json({ error: 'Phone number and text are required' });
    }

    if (!isWithinAllowedTime()) {
        return res.status(400).json({ error: 'Messages cannot be sent outside allowed hours.' });
    }

    try {
        const chatId = `${phoneNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`;
        const apiUrl = `${GREENAPI_BASE_URL}/sendMessage/${GREENAPI_APITOKENINSTANCE}`;

        console.log("API URL:", apiUrl);
        console.log("Chat ID:", chatId);

        const response = await axios.post(apiUrl, {
            chatId,
            message: text,
        });

        console.log("Message sent successfully:", response.data);

        res.status(200).json({ id: response.data.idMessage, status: 'Message sent successfully' });
    } catch (error) {
        console.error("Error sending message:", error.response ? error.response.data : error.message);

        if (error.response && error.response.status === 429) {
            res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
        } else {
            res.status(500).json({ error: 'Failed to send message' });
        }
    }
}
