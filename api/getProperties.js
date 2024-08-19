import Airtable from 'airtable';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

export default async function handler(req, res) {
    try {
        const records = await base('Properties').select().all();
        const properties = records.map(record => ({
            id: record.id,
            ...record.fields
        }));
        res.status(200).json(properties);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
}
