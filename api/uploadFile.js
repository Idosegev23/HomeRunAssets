import axios from 'axios';

const GREENAPI_ID = process.env.GREENAPI_ID;
const GREENAPI_APITOKENINSTANCE = process.env.GREENAPI_APITOKENINSTANCE;
const GREENAPI_BASE_URL = `https://api.greenapi.com/waInstance${GREENAPI_ID}`;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { chatId, file, fileName } = req.body;

        // Convert the file to base64
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const base64File = fileBuffer.toString('base64');

        const response = await axios.post(`${GREENAPI_BASE_URL}/sendFileByUpload/${GREENAPI_APITOKENINSTANCE}`, {
            chatId,
            file: base64File,
            fileName,
            caption: fileName
        });

        res.status(200).json({ id: response.data.idMessage, status: 'File sent successfully' });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
}