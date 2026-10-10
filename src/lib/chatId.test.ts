import { chatTitle, initials, parsePhone, whatsappChatId } from './chatId';

describe('parsePhone', () => {
  it.each([
    ['+7 900 123-45-67', '79001234567'],
    ['8 (900) 123-45-67', '79001234567'],
    ['79001234567', '79001234567'],
    ['+375 29 123-45-67', '375291234567'],
    ['+44 20 7946 0958', '442079460958'],
  ])('%s -> %s', (input, expected) => {
    expect(parsePhone(input)).toBe(expected);
  });

  it('rejects numbers that are too short', () => {
    expect(() => parsePhone('12345')).toThrow();
  });
});

describe('whatsappChatId', () => {
  it('adds the @c.us suffix', () => {
    expect(whatsappChatId('79001234567')).toBe('79001234567@c.us');
  });
});

describe('chatTitle', () => {
  it('shows WhatsApp personal chats as phone numbers', () => {
    expect(chatTitle('79001234567@c.us')).toBe('+79001234567');
  });
  it('leaves other ids unchanged', () => {
    expect(chatTitle('10000000')).toBe('10000000');
  });
});

describe('initials', () => {
  it('uses the last two digits of a phone', () => {
    expect(initials('+79001234567')).toBe('67');
  });
  it('uses the first letters of a name', () => {
    expect(initials('Иван Петров')).toBe('ИП');
  });
});
