import { useState, type FormEvent } from 'react';
import type { Chat } from '../api/types';
import { toChatId } from '../lib/chatId';
import type { ConnectionStatus } from '../hooks/useNotifications';

interface Props {
  chats: Chat[];
  activeChatId: string | null;
  messengerLabel: string;
  status: ConnectionStatus;
  onOpenChat: (chatId: string) => void;
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

export function Sidebar({ chats, activeChatId, messengerLabel, status, onOpenChat, onLogout }: Props) {
  const [phone, setPhone] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    try {
      onOpenChat(toChatId(phone));
      setPhone('');
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
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
            placeholder="+7 900 123-45-67"
            inputMode="tel"
            aria-label="Номер телефона получателя"
            autoFocus
          />
          <button className="btn btn--primary" type="submit">
            Создать
          </button>
          <button className="btn btn--ghost" type="button" onClick={() => setShowForm(false)}>
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
        {chats.length === 0 && <li className="chat-list__empty">Пока нет чатов. Создайте новый по номеру телефона.</li>}
        {chats.map((chat) => {
          const last = chat.messages[chat.messages.length - 1];
          return (
            <li key={chat.chatId}>
              <button
                className={`chat-item${chat.chatId === activeChatId ? ' is-active' : ''}`}
                onClick={() => onOpenChat(chat.chatId)}
              >
                <span className="avatar" aria-hidden>
                  {chat.title.replace(/\D/g, '').slice(-2) || '#'}
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
