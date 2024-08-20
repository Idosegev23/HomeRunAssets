const axios = require('axios');

const GREENAPI_ID = process.env.GREENAPI_ID;
const GREENAPI_APITOKENINSTANCE = process.env.GREENAPI_APITOKENINSTANCE;
const GREENAPI_BASE_URL = `https://api.greenapi.com/waInstance${GREENAPI_ID}`;

export default async function handler(req, res) {
    try {
        const chatId = `${req.query.phoneNumber.replace(/\D/g, '').replace(/^0/, '972')}@c.us`;
        const response = await axios.post(`${GREENAPI_BASE_URL}/getChatHistory/${GREENAPI_APITOKENINSTANCE}`, {
            chatId,
            count: 100
        });
        const messages = response.data.map(msg => ({
            id: msg.idMessage,
            sender: msg.type === 'outgoing' ? 'Me' : 'Other',
            text: msg.textMessage || msg.caption || 'Non-text message',
            timestamp: msg.timestamp,
            phoneNumber: req.query.phoneNumber
        }));
        messages.sort((a, b) => a.timestamp - b.timestamp);
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chat history', details: error.message });
    }
}
