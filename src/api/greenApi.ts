import type {
  CheckAccountRequest,
  CheckAccountResponse,
  Credentials,
  Notification,
  SendMessageResponse,
  StateInstanceResponse,
} from './types';

export class GreenApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'GreenApiError';
  }
}

export interface GreenApiClient {
  getStateInstance(): Promise<StateInstanceResponse>;
  sendMessage(chatId: string, message: string): Promise<SendMessageResponse>;
  checkAccount(params: CheckAccountRequest): Promise<CheckAccountResponse>;
  receiveNotification(receiveTimeoutSec?: number, signal?: AbortSignal): Promise<Notification | null>;
  deleteNotification(receiptId: number): Promise<boolean>;
}

export function createGreenApiClient(creds: Credentials, fetchImpl: typeof fetch = fetch): GreenApiClient {
  // Same URL shape for MAX, WhatsApp and Telegram (GREEN-API v3 unified format).
  const base = `${creds.apiUrl.trim().replace(/\/+$/, '')}/waInstance${creds.idInstance.trim()}`;
  const token = encodeURIComponent(creds.apiTokenInstance.trim());

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
      res = await fetchImpl(`${base}/${path}`, init);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      throw new GreenApiError('Нет соединения с GREEN-API');
    }
    if (!res.ok) {
      const reason =
        res.status === 401 || res.status === 403
          ? 'Неверный idInstance или apiTokenInstance'
          : res.status === 429
            ? 'Слишком много запросов, попробуйте позже'
            : `Ошибка GREEN-API (${res.status})`;
      throw new GreenApiError(reason, res.status);
    }
    const text = await res.text();
    return (text ? JSON.parse(text) : null) as T;
  }

  return {
    getStateInstance: () => request<StateInstanceResponse>(`getStateInstance/${token}`),

    sendMessage: (chatId, message) =>
      request<SendMessageResponse>(`sendMessage/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message }),
      }),

    checkAccount: (params) =>
      request<CheckAccountResponse>(`checkAccount/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      }),

    receiveNotification: (receiveTimeoutSec = 5, signal) =>
      request<Notification | null>(`receiveNotification/${token}?receiveTimeout=${receiveTimeoutSec}`, { signal }),

    deleteNotification: async (receiptId) => {
      const res = await request<{ result: boolean } | null>(`deleteNotification/${token}/${receiptId}`, {
        method: 'DELETE',
      });
      return Boolean(res?.result);
    },
  };
}
