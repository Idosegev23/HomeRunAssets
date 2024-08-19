import Airtable from 'airtable';

// הגדרת המפתחות של Airtable מתוך משתני הסביבה
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// חיבור ל-Airtable עם המפתח וה-Base ID
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// פונקציה ראשית שמטפלת בבקשות ל-API
export default async function handler(req, res) {
    const { method } = req;  // שיטת הבקשה (GET, POST, וכו')
    const { resource, id } = req.query; // פרמטרים מתוך ה-URL, כמו סוג המשאב (customers או properties) ו-ID אם קיים

    try {
        switch (method) {
            case 'POST': // אם שיטת הבקשה היא POST - יצירת רשומה חדשה
                const newRecord = await base(resource).create(req.body);
                return res.status(201).json(newRecord); // החזרה של הרשומה שנוצרה עם סטטוס 201

            case 'GET': // אם שיטת הבקשה היא GET - קריאה לרשומות
                if (id) { // אם קיים ID, מבצעים קריאה לפי ID
                    const record = await base(resource).find(id);
                    return res.status(200).json({
                        id: record.id,
                        ...record.fields
                    }); // החזרה של הרשומה המבוקשת
                } else { // אם לא קיים ID, מחזירים את כל הרשומות מהמשאב המבוקש
                    const records = await base(resource).select().all();
                    const result = records.map(record => ({
                        id: record.id,
                        ...record.fields
                    }));
                    return res.status(200).json(result); // החזרה של כל הרשומות
                }

            default: // אם השיטה אינה נתמכת (למשל PUT, DELETE), מחזירים סטטוס 405
                res.setHeader('Allow', ['GET', 'POST']);
                return res.status(405).end(`Method ${method} Not Allowed`);
        }
    } catch (error) {
        // טיפול בשגיאות במקרה של בעיה בביצוע הפעולה
        return res.status(500).json({ error: `Failed to process ${resource}`, details: error.message });
    }
}
