import type { Chat, ChatMessage } from '../api/types';
import { chatTitle } from './chatId';

export interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
}

export type ChatAction =
  | { type: 'openChat'; chatId: string; title?: string; phone?: string }
  | { type: 'closeChat' }
  | { type: 'addMessage'; message: ChatMessage; chatName?: string; phone?: string }
  | { type: 'messageSent'; chatId: string; tempId: string; idMessage: string }
  | { type: 'messageFailed'; chatId: string; tempId: string };

export const initialChatState: ChatState = { chats: [], activeChatId: null };

function newChat(chatId: string, title?: string, phone?: string): Chat {
  return { chatId, title: title || (phone ? `+${phone}` : chatTitle(chatId)), phone, messages: [], unread: 0 };
}

function updateChat(chats: Chat[], chatId: string, fn: (chat: Chat) => Chat): Chat[] {
  return chats.map((c) => (c.chatId === chatId ? fn(c) : c));
}

/** Most recently active chat first. */
function sortChats(chats: Chat[]): Chat[] {
  const last = (c: Chat) => c.messages[c.messages.length - 1]?.timestamp ?? 0;
  return [...chats].sort((a, b) => last(b) - last(a));
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'openChat': {
      const exists = state.chats.some((c) => c.chatId === action.chatId);
      const chats = exists
        ? updateChat(state.chats, action.chatId, (c) => ({ ...c, unread: 0 }))
        : [newChat(action.chatId, action.title, action.phone), ...state.chats];
      return { chats, activeChatId: action.chatId };
    }

    case 'closeChat':
      return { ...state, activeChatId: null };

    case 'addMessage': {
      const { message, chatName, phone } = action;
      let chats = state.chats;
      let activeChatId = state.activeChatId;

      if (!chats.some((c) => c.chatId === message.chatId)) {
        // A chat opened by phone may get its reply under a different id; join them by the sender's phone.
        const byPhone = phone ? chats.find((c) => c.phone === phone) : undefined;
        if (byPhone) {
          chats = updateChat(chats, byPhone.chatId, (c) => ({
            ...c,
            chatId: message.chatId,
            messages: c.messages.map((m) => ({ ...m, chatId: message.chatId })),
          }));
          if (activeChatId === byPhone.chatId) activeChatId = message.chatId;
        } else {
          chats = [...chats, newChat(message.chatId, chatName, phone)];
        }
      }

      const chat = chats.find((c) => c.chatId === message.chatId)!;
      // The same message can arrive twice: once from our own send, once as a notification,
      // or again after a failed deleteNotification. Keep the first copy.
      if (chat.messages.some((m) => m.id === message.id)) return state;

      const isActive = activeChatId === message.chatId;
      chats = updateChat(chats, message.chatId, (c) => ({
        ...c,
        // Keep arrival order: server timestamps have second precision and may drift from the local clock,
        // so sorting by time can put a reply above the message it answers.
        messages: [...c.messages, message],
        unread: message.direction === 'in' && !isActive ? c.unread + 1 : c.unread,
      }));
      return { chats: sortChats(chats), activeChatId };
    }

    case 'messageSent':
      return {
        ...state,
        chats: updateChat(state.chats, action.chatId, (c) => ({
          ...c,
          // If the API echo already arrived under the real id, drop the temporary copy.
          messages: c.messages.some((m) => m.id === action.idMessage)
            ? c.messages.filter((m) => m.id !== action.tempId)
            : c.messages.map((m) =>
                m.id === action.tempId ? { ...m, id: action.idMessage, status: 'sent' as const } : m,
              ),
        })),
      };

    case 'messageFailed':
      return {
        ...state,
        chats: updateChat(state.chats, action.chatId, (c) => ({
          ...c,
          messages: c.messages.map((m) => (m.id === action.tempId ? { ...m, status: 'failed' as const } : m)),
        })),
      };
  }
}
