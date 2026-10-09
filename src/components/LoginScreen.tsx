import { useState, type FormEvent } from 'react';
import { createGreenApiClient, GreenApiError } from '../api/greenApi';
import { MESSENGERS, MESSENGER_LIST } from '../api/messengers';
import type { Credentials, Messenger } from '../api/types';

interface Props {
  onLogin: (creds: Credentials) => void;
}

export function LoginScreen({ onLogin }: Props) {
  const [messenger, setMessenger] = useState<Messenger>('max');
  const [apiUrl, setApiUrl] = useState(MESSENGERS.max.defaultApiUrl);
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d+$/.test(idInstance.trim())) {
      setError('idInstance должен состоять из цифр');
      return;
    }
    const creds: Credentials = { messenger, apiUrl, idInstance: idInstance.trim(), apiTokenInstance: apiTokenInstance.trim() };

    setLoading(true);
    try {
      const { stateInstance } = await createGreenApiClient(creds).getStateInstance();
      if (stateInstance !== 'authorized') {
        setError(`Инстанс не авторизован (состояние: ${stateInstance}). Авторизуйте его в консоли GREEN-API.`);
        return;
      }
      onLogin(creds);
    } catch (err) {
      setError(err instanceof GreenApiError ? err.message : 'Не удалось подключиться');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={handleSubmit}>
        <h1 className="login__title">Вход в чат</h1>
        <p className="login__hint">Учетные данные инстанса из консоли GREEN-API</p>

        <div className="segmented" role="radiogroup" aria-label="Мессенджер">
          {MESSENGER_LIST.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={messenger === m.id}
              className={`segmented__item${messenger === m.id ? ' is-active' : ''}`}
              onClick={() => {
                setMessenger(m.id);
                setApiUrl(m.defaultApiUrl);
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <label className="field">
          <span>idInstance</span>
          <input value={idInstance} onChange={(e) => setIdInstance(e.target.value)} inputMode="numeric" required autoFocus />
        </label>
        <label className="field">
          <span>apiTokenInstance</span>
          <input
            type="password"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            autoComplete="off"
            required
          />
        </label>
        <label className="field">
          <span>apiUrl</span>
          <input type="url" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} required />
        </label>

        {error && (
          <p className="login__error" role="alert">
            {error}
          </p>
        )}

        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
