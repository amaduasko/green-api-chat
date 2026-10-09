import { chatTitle, toChatId } from './chatId';

describe('toChatId', () => {
  it.each([
    ['+7 900 123-45-67', '79001234567@c.us'],
    ['8 (900) 123-45-67', '79001234567@c.us'],
    ['79001234567', '79001234567@c.us'],
    ['+44 20 7946 0958', '442079460958@c.us'],
    ['120363000000000000@g.us', '120363000000000000@g.us'],
  ])('%s -> %s', (input, expected) => {
    expect(toChatId(input)).toBe(expected);
  });

  it('rejects numbers that are too short', () => {
    expect(() => toChatId('12345')).toThrow();
  });
});

describe('chatTitle', () => {
  it('shows personal chats as phone numbers', () => {
    expect(chatTitle('79001234567@c.us')).toBe('+79001234567');
  });
  it('leaves other ids unchanged', () => {
    expect(chatTitle('123@g.us')).toBe('123@g.us');
  });
});
