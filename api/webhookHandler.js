import { EventEmitter } from 'events';

const messageEmitter = new EventEmitter();

export default function handler(req, res) {
    const { body } = req;

    if (body.typeWebhook === 'incomingMessageReceived') {
        const message = {
            id: body.idMessage,
            sender: 'Other',
            timestamp: body.timestamp,
            phoneNumber: body.senderData?.sender,
            text: body.messageData?.textMessageData?.textMessage || 'No text content',
        };

        messageEmitter.emit('newMessage', message);
    }

    res.status(200).send('Webhook received successfully');
}
