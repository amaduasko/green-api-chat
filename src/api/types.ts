export type Messenger = 'max' | 'whatsapp' | 'telegram';

export interface Credentials {
  messenger: Messenger;
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
}

export interface SendMessageResponse {
  idMessage: string;
}

export interface StateInstanceResponse {
  stateInstance: string;
}

export type CheckAccountRequest = { phoneNumber: number; force?: boolean } | { username: string; force?: boolean };

/** CheckAccount (MAX, Telegram). Errors come back as `{ status: false, reason }` with HTTP 200. */
export interface CheckAccountResponse {
  exist?: boolean;
  chatId?: string;
  username?: string;
  status?: boolean;
  reason?: string;
}

/** Envelope returned by ReceiveNotification; the API returns `null` when the queue is empty. */
export interface Notification {
  receiptId: number;
  body: NotificationBody;
}

export interface NotificationBody {
  typeWebhook: string;
  idMessage?: string;
  timestamp?: number;
  senderData?: {
    chatId: string;
    sender?: string;
    senderName?: string;
    chatName?: string;
    senderContactName?: string;
    /** MAX and Telegram include the sender's phone; 0 when hidden. */
    senderPhoneNumber?: number;
  };
  messageData?: {
    typeMessage: string;
    textMessageData?: { textMessage: string };
    extendedTextMessageData?: { text: string };
  };
}

export type MessageStatus = 'sending' | 'sent' | 'failed';

export interface ChatMessage {
  id: string;
  chatId: string;
  text: string;
  direction: 'in' | 'out';
  /** Milliseconds since epoch. */
  timestamp: number;
  status?: MessageStatus;
}

export interface Chat {
  chatId: string;
  title: string;
  /** Digits only, when the chat was opened by phone or the sender's phone is known. */
  phone?: string;
  messages: ChatMessage[];
  unread: number;
}
