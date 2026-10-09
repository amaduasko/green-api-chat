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
  messages: ChatMessage[];
  unread: number;
}
