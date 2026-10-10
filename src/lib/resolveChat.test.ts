import type { GreenApiClient } from '../api/greenApi';
import { resolveChat } from './resolveChat';

function client(checkAccount = vi.fn()): GreenApiClient {
  return {
    getStateInstance: vi.fn(),
    sendMessage: vi.fn(),
    receiveNotification: vi.fn(),
    deleteNotification: vi.fn(),
    checkAccount,
  };
}

describe('resolveChat', () => {
  it('WhatsApp: builds phone@c.us without an API call', async () => {
    const check = vi.fn();
    await expect(resolveChat(client(check), 'whatsapp', '+7 900 123-45-67')).resolves.toEqual({
      chatId: '79001234567@c.us',
      title: '+79001234567',
      phone: '79001234567',
    });
    expect(check).not.toHaveBeenCalled();
  });

  it('MAX: looks up the numeric chatId with CheckAccount', async () => {
    const check = vi.fn().mockResolvedValue({ exist: true, chatId: '10000000', fromCache: true });
    await expect(resolveChat(client(check), 'max', '8 900 123-45-67')).resolves.toEqual({
      chatId: '10000000',
      title: '+79001234567',
      phone: '79001234567',
    });
    expect(check).toHaveBeenCalledWith({ phoneNumber: 79001234567 });
  });

  it('MAX: rejects numbers outside +7 and +375 before calling the API', async () => {
    const check = vi.fn();
    await expect(resolveChat(client(check), 'max', '+44 20 7946 0958')).rejects.toThrow('+7, +375');
    expect(check).not.toHaveBeenCalled();
  });

  it('MAX: reports a missing account', async () => {
    const check = vi.fn().mockResolvedValue({ exist: false, chatId: '' });
    await expect(resolveChat(client(check), 'max', '+79001234567')).rejects.toThrow('нет аккаунта MAX');
  });

  it('passes through API errors returned as status: false', async () => {
    const check = vi.fn().mockResolvedValue({ status: false, reason: 'instance is starting or not authorized' });
    await expect(resolveChat(client(check), 'max', '+79001234567')).rejects.toThrow('instance is starting');
  });

  it('Telegram: finds a user by @username', async () => {
    const check = vi.fn().mockResolvedValue({ exist: true, chatId: '555', username: '@durov' });
    await expect(resolveChat(client(check), 'telegram', '@durov')).resolves.toEqual({ chatId: '555', title: '@durov' });
    expect(check).toHaveBeenCalledWith({ username: '@durov' });
  });

  it('Telegram: accepts any country code', async () => {
    const check = vi.fn().mockResolvedValue({ exist: true, chatId: '777' });
    await expect(resolveChat(client(check), 'telegram', '+44 20 7946 0958')).resolves.toMatchObject({ chatId: '777' });
  });
});
