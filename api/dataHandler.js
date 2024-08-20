import Airtable from 'airtable';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

export default async function handler(req, res) {
    const { method } = req;
    const { resource, id } = req.query;

    try {
        switch (method) {
            case 'POST':
                const newRecord = await base(resource).create(req.body);
                return res.status(201).json(newRecord);

            case 'GET':
                if (resource === 'matchingProperties' && id) {
                    // Logic for finding matching properties
                    const customerRecord = await base('Customers').find(id);
                    const customerBudget = parseFloat(customerRecord.fields.Budget.replace(/[^\d.-]/g, ''));
                    const customerRooms = customerRecord.fields.Rooms;
                    const customerCity = customerRecord.fields.City;

                    const properties = await base('Properties').select({
                        filterByFormula: `AND(
                            {price} <= ${customerBudget * 1.1},
                            {price} >= ${customerBudget * 0.9}
                        )`
                    }).all();

                    const matchingProperties = properties.map(property => {
                        const priceMatch = property.fields.price >= customerBudget * 0.9 && property.fields.price <= customerBudget * 1.1;
                        const roomsMatch = property.fields.rooms === customerRooms;
                        const cityMatch = property.fields.city === customerCity;

                        let totalMatchPercentage = 0;
                        let matchDetails = [];
                        if (priceMatch) totalMatchPercentage += 70;
                        if (roomsMatch) totalMatchPercentage += 15;
                        if (cityMatch) totalMatchPercentage += 15;

                        return {
                            id: property.id,
                            address: `${property.fields.city}, ${property.fields.street}`,
                            price: property.fields.price,
                            rooms: property.fields.rooms,
                            square_meters: property.fields.square_meters,
                            floor: property.fields.floor,
                            imageurl: property.fields.imageurl,
                            totalMatchPercentage,
                            matchDetails: matchDetails.join(', ')
                        };
                    });

                    return res.status(200).json(matchingProperties);
                } else if (id) {
                    const record = await base(resource).find(id);
                    return res.status(200).json({
                        id: record.id,
                        ...record.fields
                    });
                } else {
                    const records = await base(resource).select().all();
                    const result = records.map(record => ({
                        id: record.id,
                        ...record.fields
                    }));
                    return res.status(200).json(result);
                }

            default:
                res.setHeader('Allow', ['GET', 'POST']);
                return res.status(405).end(`Method ${method} Not Allowed`);
        }
    } catch (error) {
        console.error('Error in dataHandler:', error);
        return res.status(500).json({ error: `Failed to process ${resource}`, details: error.message });
    }
}