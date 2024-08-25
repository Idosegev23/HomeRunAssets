import axios from 'axios';
const GREENAPI_ID = process.env.GREENAPI_ID;
const GREENAPI_APITOKENINSTANCE = process.env.GREENAPI_APITOKENINSTANCE;
const GREENAPI_BASE_URL = `https://api.greenapi.com/waInstance${GREENAPI_ID}`;

export default async function handler(req, res) {
    try {
        const response = await axios.get(`${GREENAPI_BASE_URL}/getChats/${GREENAPI_APITOKENINSTANCE}`);
        const unreadCount = response.data.reduce((count, chat) => {
            return count + (chat.unreadCount || 0);
        }, 0);
        res.status(200).json({ count: unreadCount });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch unread messages count', details: error.message });
    }
}
