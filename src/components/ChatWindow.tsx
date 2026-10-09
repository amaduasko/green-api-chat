import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import type { Chat } from '../api/types';

interface Props {
  chat: Chat | null;
  onSend: (chatId: string, text: string) => void;
  onBack: () => void;
}

const STATUS_ICON = { sending: '🕓', sent: '✓', failed: '⚠' } as const;

export function ChatWindow({ chat, onSend, onBack }: Props) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [chat?.chatId, chat?.messages.length]);

  if (!chat) {
    return (
      <main className="chat chat--empty">
        <p>Выберите чат или создайте новый</p>
      </main>
    );
  }

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const message = text.trim();
    if (!message || !chat) return;
    onSend(chat.chatId, message);
    setText('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <main className="chat">
      <header className="chat__header">
        <button className="btn btn--ghost chat__back" onClick={onBack} aria-label="Назад к списку чатов">
          ←
        </button>
        <span className="avatar" aria-hidden>
          {chat.title.replace(/\D/g, '').slice(-2) || '#'}
        </span>
        <span className="chat__title">{chat.title}</span>
      </header>

      <div className="chat__messages" role="log" aria-live="polite">
        {chat.messages.length === 0 && <p className="chat__placeholder">Напишите первое сообщение</p>}
        {chat.messages.map((m) => (
          <div key={m.id} className={`bubble bubble--${m.direction}${m.status === 'failed' ? ' bubble--failed' : ''}`}>
            <span className="bubble__text">{m.text}</span>
            <span className="bubble__meta">
              {new Date(m.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              {m.direction === 'out' && m.status && (
                <span title={m.status === 'failed' ? 'Не отправлено' : undefined}> {STATUS_ICON[m.status]}</span>
              )}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="composer" onSubmit={submit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Сообщение"
          rows={1}
          aria-label="Текст сообщения"
        />
        <button className="btn btn--send" type="submit" disabled={!text.trim()} aria-label="Отправить">
          ➤
        </button>
      </form>
    </main>
  );
}
