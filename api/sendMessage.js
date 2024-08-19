import axios from 'axios';

const GREENAPI_ID = process.env.GREENAPI_ID;
const GREENAPI_APITOKENINSTANCE = process.env.GREENAPI_APITOKENINSTANCE;
const GREENAPI_BASE_URL = `https://api.greenapi.com/waInstance${GREENAPI_ID}`;

export default async function handler(req, res) {
    const { phoneNumber, text } = req.body;
    if (!phoneNumber || !text) {
        return res.status(400).json({ error: 'Phone number and text are required' });
    }
    try {
        const chatId = `${phoneNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`;
        const response = await axios.post(`${GREENAPI_BASE_URL}/sendMessage/${GREENAPI_APITOKENINSTANCE}`, {
            chatId,
            message: text,
        });
        res.status(200).json({ id: response.data.idMessage, status: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
}
