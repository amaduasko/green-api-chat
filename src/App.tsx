import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { createGreenApiClient } from './api/greenApi';
import { MESSENGERS } from './api/messengers';
import type { Credentials, NotificationBody } from './api/types';
import { ChatWindow } from './components/ChatWindow';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { useNotifications } from './hooks/useNotifications';
import { chatReducer, initialChatState, type ChatState } from './lib/chatStore';
import { toChatMessage } from './lib/notifications';
import { local, readJson, remove, session, writeJson } from './lib/storage';

const CREDS_KEY = 'green-api-chat:credentials';
const historyKey = (c: Credentials) => `green-api-chat:history:${c.messenger}:${c.idInstance}`;

export default function App() {
  // Credentials live only in sessionStorage: they are cleared when the tab closes.
  const [creds, setCreds] = useState<Credentials | null>(() => readJson<Credentials>(session, CREDS_KEY));

  if (!creds) {
    return (
      <LoginScreen
        onLogin={(c) => {
          writeJson(session, CREDS_KEY, c);
          setCreds(c);
        }}
      />
    );
  }

  return (
    <ChatApp
      key={historyKey(creds)}
      creds={creds}
      onLogout={() => {
        remove(session, CREDS_KEY);
        setCreds(null);
      }}
    />
  );
}

function ChatApp({ creds, onLogout }: { creds: Credentials; onLogout: () => void }) {
  const client = useMemo(() => createGreenApiClient(creds), [creds]);
  const [state, dispatch] = useReducer(chatReducer, undefined, () => ({
    ...initialChatState,
    // A message still "sending" when the page closed never got confirmed; show it as failed.
    chats: (readJson<ChatState['chats']>(local, historyKey(creds)) ?? []).map((c) => ({
      ...c,
      messages: c.messages.map((m) => (m.status === 'sending' ? { ...m, status: 'failed' as const } : m)),
    })),
  }));

  useEffect(() => {
    writeJson(local, historyKey(creds), state.chats);
  }, [creds, state.chats]);

  const status = useNotifications(
    client,
    useCallback((body: NotificationBody) => {
      const message = toChatMessage(body);
      if (message) dispatch({ type: 'addMessage', message });
    }, []),
  );

  async function handleSend(chatId: string, text: string) {
    const tempId = `local-${crypto.randomUUID()}`;
    dispatch({
      type: 'addMessage',
      message: { id: tempId, chatId, text, direction: 'out', timestamp: Date.now(), status: 'sending' },
    });
    try {
      const { idMessage } = await client.sendMessage(chatId, text);
      dispatch({ type: 'messageSent', chatId, tempId, idMessage });
    } catch {
      dispatch({ type: 'messageFailed', chatId, tempId });
    }
  }

  const activeChat = state.chats.find((c) => c.chatId === state.activeChatId) ?? null;

  return (
    <div className={`layout${activeChat ? ' has-active-chat' : ''}`}>
      <Sidebar
        chats={state.chats}
        activeChatId={state.activeChatId}
        messengerLabel={MESSENGERS[creds.messenger].label}
        status={status}
        onOpenChat={(chatId) => dispatch({ type: 'openChat', chatId })}
        onLogout={onLogout}
      />
      <ChatWindow chat={activeChat} onSend={handleSend} onBack={() => dispatch({ type: 'closeChat' })} />
    </div>
  );
}
