import type { NotificationBody } from '../api/types';
import { parseNotification } from './notifications';

// Shapes taken from the GREEN-API docs (MAX v3 and WhatsApp examples).
const maxIncoming: NotificationBody = {
  typeWebhook: 'incomingMessageReceived',
  timestamp: 1763115112,
  idMessage: '1763115112345',
  senderData: {
    chatId: '10000000',
    chatName: 'Ходабрыш Пробешёлов',
    sender: '10000000',
    senderName: 'Ходабрыш Пробешёлов',
    senderPhoneNumber: 79876543210,
  },
  messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет от Green-API!' } },
};

describe('parseNotification', () => {
  it('parses an incoming MAX text message with sender name and phone', () => {
    expect(parseNotification(maxIncoming)).toEqual({
      message: {
        id: '1763115112345',
        chatId: '10000000',
        text: 'Привет от Green-API!',
        direction: 'in',
        timestamp: 1763115112000,
        status: undefined,
      },
      chatName: 'Ходабрыш Пробешёлов',
      phone: '79876543210',
    });
  });

  it('parses an incoming WhatsApp message without a phone field', () => {
    const parsed = parseNotification({
      ...maxIncoming,
      senderData: { chatId: '79001234567@c.us', chatName: 'Иван' },
    });
    expect(parsed).toMatchObject({ message: { chatId: '79001234567@c.us' }, chatName: 'Иван', phone: undefined });
  });

  it('parses an extended text message', () => {
    const parsed = parseNotification({
      ...maxIncoming,
      messageData: { typeMessage: 'extendedTextMessage', extendedTextMessageData: { text: 'https://x.ru' } },
    });
    expect(parsed?.message.text).toBe('https://x.ru');
  });

  it('treats messages sent from the phone as outgoing and ignores sender details', () => {
    const parsed = parseNotification({ ...maxIncoming, typeWebhook: 'outgoingMessageReceived' });
    expect(parsed).toEqual({ message: expect.objectContaining({ direction: 'out', status: 'sent' }) });
  });

  it('ignores API echoes, non-text messages and other notification types', () => {
    expect(parseNotification({ ...maxIncoming, typeWebhook: 'outgoingAPIMessageReceived' })).toBeNull();
    expect(parseNotification({ ...maxIncoming, messageData: { typeMessage: 'imageMessage' } })).toBeNull();
    expect(parseNotification({ typeWebhook: 'stateInstanceChanged' })).toBeNull();
    expect(parseNotification({ ...maxIncoming, typeWebhook: 'outgoingMessageStatus' })).toBeNull();
  });
});
