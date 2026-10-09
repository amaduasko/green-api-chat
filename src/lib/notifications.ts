import type { ChatMessage, NotificationBody } from '../api/types';

const DIRECTION_BY_WEBHOOK: Record<string, ChatMessage['direction']> = {
  incomingMessageReceived: 'in',
  // Sent from the phone or another device linked to the account.
  outgoingMessageReceived: 'out',
  // Sent through the API (including by this app); deduplicated by idMessage in the store.
  outgoingAPIMessageReceived: 'out',
};

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
export function toChatMessage(body: NotificationBody): ChatMessage | null {
  const direction = DIRECTION_BY_WEBHOOK[body.typeWebhook];
  const chatId = body.senderData?.chatId;
  const text = extractText(body.messageData);
  if (!direction || !chatId || !body.idMessage || text === null) return null;

  return {
    id: body.idMessage,
    chatId,
    text,
    direction,
    timestamp: body.timestamp ? body.timestamp * 1000 : Date.now(),
    status: direction === 'out' ? 'sent' : undefined,
  };
}
