import type { ChatMessage } from '../api/types';
import { chatReducer, initialChatState } from './chatStore';

const chatId = '79001234567@c.us';
const msg = (over: Partial<ChatMessage>): ChatMessage => ({
  id: 'm1',
  chatId,
  text: 'hi',
  direction: 'in',
  timestamp: 1000,
  ...over,
});

describe('chatReducer', () => {
  it('opens a new chat and makes it active', () => {
    const s = chatReducer(initialChatState, { type: 'openChat', chatId });
    expect(s.activeChatId).toBe(chatId);
    expect(s.chats[0]).toMatchObject({ chatId, title: '+79001234567', messages: [] });
  });

  it('creates a chat for an incoming message from an unknown sender and counts it unread', () => {
    const s = chatReducer(initialChatState, { type: 'addMessage', message: msg({}) });
    expect(s.chats).toHaveLength(1);
    expect(s.chats[0].unread).toBe(1);
  });

  it('does not count messages in the active chat as unread', () => {
    let s = chatReducer(initialChatState, { type: 'openChat', chatId });
    s = chatReducer(s, { type: 'addMessage', message: msg({}) });
    expect(s.chats[0].unread).toBe(0);
  });

  it('clears unread when the chat is opened', () => {
    let s = chatReducer(initialChatState, { type: 'addMessage', message: msg({}) });
    s = chatReducer(s, { type: 'openChat', chatId });
    expect(s.chats[0].unread).toBe(0);
  });

  it('ignores duplicate messages', () => {
    let s = chatReducer(initialChatState, { type: 'addMessage', message: msg({}) });
    const again = chatReducer(s, { type: 'addMessage', message: msg({}) });
    expect(again).toBe(s);
    s = again;
    expect(s.chats[0].messages).toHaveLength(1);
  });

  it('replaces the temporary id after a successful send', () => {
    let s = chatReducer(initialChatState, { type: 'openChat', chatId });
    s = chatReducer(s, { type: 'addMessage', message: msg({ id: 'tmp', direction: 'out', status: 'sending' }) });
    s = chatReducer(s, { type: 'messageSent', chatId, tempId: 'tmp', idMessage: 'REAL' });
    expect(s.chats[0].messages).toEqual([expect.objectContaining({ id: 'REAL', status: 'sent' })]);
  });

  it('drops the temporary copy if the API echo already arrived', () => {
    let s = chatReducer(initialChatState, { type: 'openChat', chatId });
    s = chatReducer(s, { type: 'addMessage', message: msg({ id: 'tmp', direction: 'out', status: 'sending' }) });
    s = chatReducer(s, { type: 'addMessage', message: msg({ id: 'REAL', direction: 'out', status: 'sent', timestamp: 1001 }) });
    s = chatReducer(s, { type: 'messageSent', chatId, tempId: 'tmp', idMessage: 'REAL' });
    expect(s.chats[0].messages.map((m) => m.id)).toEqual(['REAL']);
  });

  it('keeps arrival order even when the reply has an older server timestamp', () => {
    let s = chatReducer(initialChatState, { type: 'openChat', chatId });
    s = chatReducer(s, { type: 'addMessage', message: msg({ id: 'out', direction: 'out', timestamp: 1_700_000_000_900 }) });
    s = chatReducer(s, { type: 'addMessage', message: msg({ id: 'in', timestamp: 1_700_000_000_000 }) });
    expect(s.chats[0].messages.map((m) => m.id)).toEqual(['out', 'in']);
  });

  it('opens a chat with the given title and phone', () => {
    const s = chatReducer(initialChatState, { type: 'openChat', chatId: '10000000', title: '+79001234567', phone: '79001234567' });
    expect(s.chats[0]).toMatchObject({ chatId: '10000000', title: '+79001234567', phone: '79001234567' });
  });

  it('names a new chat from an incoming message after the sender', () => {
    const s = chatReducer(initialChatState, { type: 'addMessage', message: msg({ chatId: '42' }), chatName: 'Иван' });
    expect(s.chats[0].title).toBe('Иван');
  });

  it('joins a reply to the chat opened by phone when the chat id differs', () => {
    let s = chatReducer(initialChatState, { type: 'openChat', chatId: '79001234567@c.us', phone: '79001234567' });
    s = chatReducer(s, { type: 'addMessage', message: msg({ id: 'out', chatId: '79001234567@c.us', direction: 'out' }) });
    s = chatReducer(s, { type: 'addMessage', message: msg({ id: 'in', chatId: '10000000' }), phone: '79001234567' });

    expect(s.chats).toHaveLength(1);
    expect(s.chats[0].chatId).toBe('10000000');
    expect(s.chats[0].messages.map((m) => m.id)).toEqual(['out', 'in']);
    expect(s.activeChatId).toBe('10000000');
  });

  it('marks a message as failed', () => {
    let s = chatReducer(initialChatState, { type: 'addMessage', message: msg({ id: 'tmp', direction: 'out', status: 'sending' }) });
    s = chatReducer(s, { type: 'messageFailed', chatId, tempId: 'tmp' });
    expect(s.chats[0].messages[0].status).toBe('failed');
  });

  it('sorts chats by latest message', () => {
    let s = chatReducer(initialChatState, { type: 'addMessage', message: msg({ id: 'a', chatId: 'a@c.us', timestamp: 1 }) });
    s = chatReducer(s, { type: 'addMessage', message: msg({ id: 'b', chatId: 'b@c.us', timestamp: 2 }) });
    expect(s.chats.map((c) => c.chatId)).toEqual(['b@c.us', 'a@c.us']);
  });
});
