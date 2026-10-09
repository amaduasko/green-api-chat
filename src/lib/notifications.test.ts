import type { NotificationBody } from '../api/types';
import { toChatMessage } from './notifications';

const base = {
  idMessage: 'MSG1',
  timestamp: 1_700_000_000,
  senderData: { chatId: '79001234567@c.us' },
};

describe('toChatMessage', () => {
  it('parses an incoming text message', () => {
    const body: NotificationBody = {
      ...base,
      typeWebhook: 'incomingMessageReceived',
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет!' } },
    };
    expect(toChatMessage(body)).toEqual({
      id: 'MSG1',
      chatId: '79001234567@c.us',
      text: 'Привет!',
      direction: 'in',
      timestamp: 1_700_000_000_000,
      status: undefined,
    });
  });

  it('parses an extended text message', () => {
    const body: NotificationBody = {
      ...base,
      typeWebhook: 'incomingMessageReceived',
      messageData: { typeMessage: 'extendedTextMessage', extendedTextMessageData: { text: 'https://x.ru' } },
    };
    expect(toChatMessage(body)?.text).toBe('https://x.ru');
  });

  it('treats messages sent from the phone as outgoing', () => {
    const body: NotificationBody = {
      ...base,
      typeWebhook: 'outgoingMessageReceived',
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'с телефона' } },
    };
    expect(toChatMessage(body)).toMatchObject({ direction: 'out', status: 'sent' });
  });

  it('ignores non-text messages and other notification types', () => {
    expect(
      toChatMessage({ ...base, typeWebhook: 'incomingMessageReceived', messageData: { typeMessage: 'imageMessage' } }),
    ).toBeNull();
    expect(toChatMessage({ typeWebhook: 'stateInstanceChanged' })).toBeNull();
    expect(toChatMessage({ ...base, typeWebhook: 'outgoingMessageStatus' })).toBeNull();
  });
});
