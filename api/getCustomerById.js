import Airtable from 'airtable';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

export default async function handler(req, res) {
    try {
        const record = await base('Customers').find(req.query.id);
        res.status(200).json({
            id: record.id,
            ...record.fields
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customer', details: error.message });
    }
}
