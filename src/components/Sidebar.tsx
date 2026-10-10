import { useState, type FormEvent } from 'react';
import type { Chat } from '../api/types';
import { initials } from '../lib/chatId';
import type { ConnectionStatus } from '../hooks/useNotifications';

interface Props {
  chats: Chat[];
  activeChatId: string | null;
  messengerLabel: string;
  phonePlaceholder: string;
  status: ConnectionStatus;
  onOpenChat: (chatId: string) => void;
  /** Resolves the typed phone / @username to a chat and opens it; rejects with a user-facing message. */
  onCreateChat: (input: string) => Promise<void>;
  onLogout: () => void;
}

const STATUS_TEXT: Record<ConnectionStatus, string> = {
  connecting: 'Подключение…',
  online: 'В сети',
  error: 'Нет связи, переподключаемся…',
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

export function Sidebar({
  chats,
  activeChatId,
  messengerLabel,
  phonePlaceholder,
  status,
  onOpenChat,
  onCreateChat,
  onLogout,
}: Props) {
  const [phone, setPhone] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await onCreateChat(phone);
      setPhone('');
      setShowForm(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <div>
          <div className="sidebar__title">Чаты · {messengerLabel}</div>
          <div className={`status status--${status}`}>{STATUS_TEXT[status]}</div>
        </div>
        <button className="btn btn--ghost" onClick={onLogout} title="Выйти">
          Выйти
        </button>
      </header>

      {showForm ? (
        <form className="new-chat" onSubmit={handleCreate}>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={phonePlaceholder}
            aria-label="Номер телефона получателя"
            autoFocus
          />
          <button className="btn btn--primary" type="submit" disabled={creating || !phone.trim()}>
            {creating ? 'Ищем…' : 'Создать'}
          </button>
          <button
            className="btn btn--ghost"
            type="button"
            onClick={() => {
              setShowForm(false);
              setError(null);
            }}
          >
            Отмена
          </button>
          {error && (
            <p className="new-chat__error" role="alert">
              {error}
            </p>
          )}
        </form>
      ) : (
        <button className="btn btn--primary new-chat__open" onClick={() => setShowForm(true)}>
          + Новый чат
        </button>
      )}

      <ul className="chat-list">
        {chats.length === 0 && <li className="chat-list__empty">Пока нет чатов. Создайте новый по номеру телефона получателя.</li>}
        {chats.map((chat) => {
          const last = chat.messages[chat.messages.length - 1];
          return (
            <li key={chat.chatId}>
              <button
                className={`chat-item${chat.chatId === activeChatId ? ' is-active' : ''}`}
                onClick={() => onOpenChat(chat.chatId)}
              >
                <span className="avatar" aria-hidden>
                  {initials(chat.title)}
                </span>
                <span className="chat-item__body">
                  <span className="chat-item__row">
                    <span className="chat-item__title">{chat.title}</span>
                    {last && <span className="chat-item__time">{formatTime(last.timestamp)}</span>}
                  </span>
                  <span className="chat-item__row">
                    <span className="chat-item__preview">
                      {last ? `${last.direction === 'out' ? 'Вы: ' : ''}${last.text}` : 'Нет сообщений'}
                    </span>
                    {chat.unread > 0 && <span className="badge">{chat.unread}</span>}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
