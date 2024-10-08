import Airtable from 'airtable';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

export default async function handler(req, res) {
    const { method } = req;
    const { resource, id } = req.query;

    console.log(`Received ${method} request for resource: ${resource}, id: ${id}`);

    try {
        switch (method) {
            case 'POST':
                if (resource === 'tasks') {
                    console.log('Creating new task');
                    const { description, messageId, sender, originalMessage } = req.body;
                    const newTask = await base('Tasks').create({
                        Description: description,
                        Status: 'To Do',
                        'Related Message ID': messageId,
                        Sender: sender,
                        'Original Message': originalMessage,
                        'Created At': new Date().toISOString()
                    });
                    console.log('Created new task:', newTask);
                    return res.status(201).json({
                        id: newTask.id,
                        ...newTask.fields
                    });
                } else {
                    const newRecord = await base(resource).create(req.body);
                    console.log('Created new record:', newRecord);
                    return res.status(201).json(newRecord);
                }

            case 'GET':
                if (resource === 'tasks') {
                    console.log('Fetching tasks');
                    const tasks = await base('Tasks').select({
                        maxRecords: 20,
                        view: "Grid view",
                        filterByFormula: "{Status} = 'To Do'"
                    }).firstPage();
                    const formattedTasks = tasks.map(task => ({
                        id: task.id,
                        description: task.fields.Description,
                        status: task.fields.Status,
                        dueDate: task.fields['Due Date'],
                        priority: task.fields.Priority,
                        sender: task.fields.Sender
                    }));
                    console.log('Fetched tasks:', formattedTasks.length);
                    return res.status(200).json(formattedTasks);
                } else if (resource === 'matchingProperties' && id) {
                    console.log('Fetching matching properties for customer:', id);
                    const customerRecord = await base('Customers').find(id);
                    if (!customerRecord) {
                        console.log('Customer not found:', id);
                        return res.status(404).json({ error: 'Customer not found' });
                    }

                    if (customerRecord.fields.Budget === undefined) {
                        console.log('Budget is undefined for customer:', id);
                        return res.status(400).json({ error: 'Customer budget is not set' });
                    }

                    console.log('Customer Budget:', customerRecord.fields.Budget, typeof customerRecord.fields.Budget);

                    const customerBudget = typeof customerRecord.fields.Budget === 'string' 
                        ? parseFloat(customerRecord.fields.Budget.replace(/[^\d.-]/g, '') || '0')
                        : customerRecord.fields.Budget || 0;
                    
                    const customerRooms = customerRecord.fields.Rooms;
                    const customerCity = customerRecord.fields.City;

                    if (!customerRooms || !customerCity) {
                        console.log('Missing required fields for customer:', id);
                        return res.status(400).json({ error: 'Customer is missing required fields (Rooms or City)' });
                    }

                    console.log('Customer details:', { customerBudget, customerRooms, customerCity });

                    const properties = await base('Properties').select({
                        filterByFormula: `AND(
                            {price} <= ${customerBudget * 1.1},
                            {price} >= ${customerBudget * 0.9}
                        )`
                    }).all();

                    console.log('Found properties:', properties.length);

                    const matchingProperties = properties.map(property => {
                        const propertyPrice = typeof property.fields.price === 'string' 
                            ? parseFloat(property.fields.price.replace(/[^\d.-]/g, '') || '0')
                            : property.fields.price || 0;

                        const priceMatch = propertyPrice >= customerBudget * 0.9 && propertyPrice <= customerBudget * 1.1;
                        const roomsMatch = property.fields.rooms == customerRooms; // Using == for type coercion
                        const cityMatch = property.fields.city === customerCity;

                        let totalMatchPercentage = 0;
                        let matchDetails = [];
                        if (priceMatch) totalMatchPercentage += 70;
                        if (roomsMatch) totalMatchPercentage += 15;
                        if (cityMatch) totalMatchPercentage += 15;

                        if (!priceMatch) matchDetails.push('מחיר לא מתאים');
                        if (!roomsMatch) matchDetails.push('מספר חדרים שונה');
                        if (!cityMatch) matchDetails.push('עיר שונה');

                        return {
                            id: property.id,
                            address: `${property.fields.city}, ${property.fields.street}`,
                            price: propertyPrice,
                            rooms: property.fields.rooms,
                            square_meters: property.fields.square_meters,
                            floor: property.fields.floor,
                            imageurl: property.fields.imageurl,
                            totalMatchPercentage,
                            matchDetails: matchDetails.join(', ')
                        };
                    });

                    console.log('Matching properties:', matchingProperties.length);
                    return res.status(200).json(matchingProperties);
                } else if (resource === 'properties' && id) {
                    console.log('Fetching properties:', id);
                    // בדיקה אם id הוא מערך
                    const propertyIds = Array.isArray(id) ? id : [id];
                    
                    const properties = await Promise.all(
                        propertyIds.map(async (propId) => {
                            const record = await base('Properties').find(propId);
                            return {
                                id: record.id,
                                ...record.fields
                            };
                        })
                    );

                    return res.status(200).json(properties);
                } else if (id) {
                    console.log('Fetching single record for resource:', resource);
                    const record = await base(resource).find(id);
                    return res.status(200).json({
                        id: record.id,
                        ...record.fields
                    });
                } else {
                    console.log('Fetching all records for resource:', resource);
                    const records = await base(resource).select().all();
                    const result = records.map(record => ({
                        id: record.id,
                        ...record.fields
                    }));
                    return res.status(200).json(result);
                }

            case 'PUT':
                if (!id) {
                    return res.status(400).json({ error: 'ID is required for PUT requests' });
                }
                if (resource === 'tasks') {
                    console.log('Updating task:', id);
                    const updatedTask = await base('Tasks').update(id, req.body);
                    return res.status(200).json({
                        id: updatedTask.id,
                        ...updatedTask.fields
                    });
                } else {
                    console.log('Updating record:', id);
                    const updatedRecord = await base(resource).update(id, req.body);
                    return res.status(200).json(updatedRecord);
                }

            case 'DELETE':
                if (!id) {
                    return res.status(400).json({ error: 'ID is required for DELETE requests' });
                }
                console.log('Deleting record:', id);
                await base(resource).destroy(id);
                return res.status(200).json({ message: 'Record deleted successfully' });

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).end(`Method ${method} Not Allowed`);
        }
    } catch (error) {
        console.error('Error in dataHandler:', error);
        return res.status(500).json({ error: `Failed to process ${resource}`, details: error.message });
    }
}