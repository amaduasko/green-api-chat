import { createGreenApiClient, GreenApiError } from './greenApi';
import type { Credentials } from './types';

const creds: Credentials = {
  messenger: 'max',
  apiUrl: 'https://api.example.com/',
  idInstance: '1101000001',
  apiTokenInstance: 'tok',
};

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue(
    new Response(body === null ? 'null' : JSON.stringify(body), { status }),
  );
}

describe('GREEN-API client', () => {
  it('sends a text message with SendMessage', async () => {
    const fetch = mockFetch(200, { idMessage: 'ABC' });
    const res = await createGreenApiClient(creds, fetch).sendMessage('79001234567@c.us', 'Привет');

    expect(res).toEqual({ idMessage: 'ABC' });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://api.example.com/waInstance1101000001/sendMessage/tok');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ chatId: '79001234567@c.us', message: 'Привет' });
  });

  it('receives a notification with a timeout and returns null for an empty queue', async () => {
    const fetch = mockFetch(200, null);
    const res = await createGreenApiClient(creds, fetch).receiveNotification(5);

    expect(res).toBeNull();
    expect(fetch.mock.calls[0][0]).toBe(
      'https://api.example.com/waInstance1101000001/receiveNotification/tok?receiveTimeout=5',
    );
  });

  it('deletes a notification by receiptId', async () => {
    const fetch = mockFetch(200, { result: true });
    const ok = await createGreenApiClient(creds, fetch).deleteNotification(42);

    expect(ok).toBe(true);
    expect(fetch.mock.calls[0][0]).toBe('https://api.example.com/waInstance1101000001/deleteNotification/tok/42');
    expect(fetch.mock.calls[0][1].method).toBe('DELETE');
  });

  it('maps auth failures to a readable error', async () => {
    const client = createGreenApiClient(creds, mockFetch(401, {}));
    await expect(client.getStateInstance()).rejects.toThrow(GreenApiError);
    await expect(client.getStateInstance()).rejects.toThrow('Неверный idInstance или apiTokenInstance');
  });

  it('maps network failures to a readable error', async () => {
    const client = createGreenApiClient(creds, vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(client.sendMessage('1@c.us', 'x')).rejects.toThrow('Нет соединения с GREEN-API');
  });
});
