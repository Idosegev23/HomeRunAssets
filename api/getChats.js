import Airtable from 'airtable';

import axios from 'axios';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const GREENAPI_ID = process.env.GREENAPI_ID;
const GREENAPI_APITOKENINSTANCE = process.env.GREENAPI_APITOKENINSTANCE;
const GREENAPI_BASE_URL = `https://api.greenapi.com/waInstance${GREENAPI_ID}`;

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function findCustomerByPhone(phoneNumber) {
    const records = await base('Customers').select({
        filterByFormula: `{Cell} = '${phoneNumber}'`
    }).firstPage();
    return records.length > 0 ? records[0] : null;
}

export default async function handler(req, res) {
    try {
        const response = await axios.get(`${GREENAPI_BASE_URL}/getChats/${GREENAPI_APITOKENINSTANCE}`);
        const chats = await Promise.all(response.data.map(async (chat) => {
            const phoneNumber = chat.id.replace('@c.us', '');
            const customer = await findCustomerByPhone(phoneNumber);
            return {
                phoneNumber,
                customerName: customer ? `${customer.fields.First_name} ${customer.fields.Last_name}` : (chat.name || 'Unknown'),
                lastMessage: chat.lastMessage ? chat.lastMessage.text : 'No messages',
                timestamp: chat.lastMessage ? chat.lastMessage.timestamp : Date.now(),
            };
        }));
        res.status(200).json(chats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
}
