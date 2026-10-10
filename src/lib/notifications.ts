import type { ChatMessage, NotificationBody } from '../api/types';

const DIRECTION_BY_WEBHOOK: Record<string, ChatMessage['direction']> = {
  incomingMessageReceived: 'in',
  // Sent from the phone or another device linked to the account.
  outgoingMessageReceived: 'out',
  // outgoingAPIMessageReceived is ignored on purpose: messages sent from this app are already shown
  // from the SendMessage response, and the echo could arrive under a different chat id.
};

export interface ParsedMessage {
  message: ChatMessage;
  /** Sender's display name, for chats we haven't seen yet. */
  chatName?: string;
  /** Sender's phone (digits), when the messenger reports it. Lets a reply join the chat opened by phone. */
  phone?: string;
}

function extractText(messageData: NotificationBody['messageData']): string | null {
  if (!messageData) return null;
  switch (messageData.typeMessage) {
    case 'textMessage':
      return messageData.textMessageData?.textMessage ?? null;
    case 'extendedTextMessage':
    case 'quotedMessage':
      return messageData.extendedTextMessageData?.text ?? null;
    default:
      return null; // media, stickers, polls etc. are out of scope (text only)
  }
}

/** Converts a notification body into a chat message, or null if it is not a text message. */
export function parseNotification(body: NotificationBody): ParsedMessage | null {
  const direction = DIRECTION_BY_WEBHOOK[body.typeWebhook];
  const sender = body.senderData;
  const text = extractText(body.messageData);
  if (!direction || !sender?.chatId || !body.idMessage || text === null) return null;

  const message: ChatMessage = {
    id: body.idMessage,
    chatId: sender.chatId,
    text,
    direction,
    timestamp: body.timestamp ? body.timestamp * 1000 : Date.now(),
    status: direction === 'out' ? 'sent' : undefined,
  };

  if (direction === 'out') return { message };

  return {
    message,
    chatName: sender.chatName || sender.senderContactName || sender.senderName || undefined,
    phone: sender.senderPhoneNumber ? String(sender.senderPhoneNumber) : undefined,
  };
}
