import type { Chat, ChatMessage } from '../api/types';
import { chatTitle } from './chatId';

export interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
}

export type ChatAction =
  | { type: 'openChat'; chatId: string }
  | { type: 'closeChat' }
  | { type: 'addMessage'; message: ChatMessage }
  | { type: 'messageSent'; chatId: string; tempId: string; idMessage: string }
  | { type: 'messageFailed'; chatId: string; tempId: string };

export const initialChatState: ChatState = { chats: [], activeChatId: null };

function newChat(chatId: string): Chat {
  return { chatId, title: chatTitle(chatId), messages: [], unread: 0 };
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
        : [newChat(action.chatId), ...state.chats];
      return { chats, activeChatId: action.chatId };
    }

    case 'closeChat':
      return { ...state, activeChatId: null };

    case 'addMessage': {
      const { message } = action;
      let chats = state.chats.some((c) => c.chatId === message.chatId)
        ? state.chats
        : [...state.chats, newChat(message.chatId)];

      const chat = chats.find((c) => c.chatId === message.chatId)!;
      // The same message can arrive twice: once from our own send, once as a notification,
      // or again after a failed deleteNotification. Keep the first copy.
      if (chat.messages.some((m) => m.id === message.id)) return state;

      const isActive = state.activeChatId === message.chatId;
      chats = updateChat(chats, message.chatId, (c) => ({
        ...c,
        // Keep arrival order: server timestamps have second precision and may drift from the local clock,
        // so sorting by time can put a reply above the message it answers.
        messages: [...c.messages, message],
        unread: message.direction === 'in' && !isActive ? c.unread + 1 : c.unread,
      }));
      return { ...state, chats: sortChats(chats) };
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
