import axios from 'axios';
const GREENAPI_ID = process.env.GREENAPI_ID;
const GREENAPI_APITOKENINSTANCE = process.env.GREENAPI_APITOKENINSTANCE;
const GREENAPI_BASE_URL = `https://api.greenapi.com/waInstance${GREENAPI_ID}`;

export default async function handler(req, res) {
    try {
        const response = await axios.get(`${GREENAPI_BASE_URL}/lastIncomingMessages/${GREENAPI_APITOKENINSTANCE}`);
        const formattedMessages = response.data.map(message => ({
            idMessage: message.idMessage,
            timestamp: message.timestamp,
            typeMessage: message.typeMessage,
            textMessage: message.textMessage,
            statusMessage: message.statusMessage,
            senderData: message.senderData,
        }));
        res.status(200).json(formattedMessages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch last incoming messages', details: error.message });
    }
}