import { GreenApiError, type GreenApiClient } from '../api/greenApi';
import { MESSENGERS } from '../api/messengers';
import type { Messenger } from '../api/types';
import { parsePhone, whatsappChatId } from './chatId';

export interface ResolvedChat {
  chatId: string;
  title: string;
  phone?: string;
}

/**
 * Turns what the user typed in "New chat" into a chatId for the selected messenger.
 * WhatsApp: phone -> `phone@c.us`. MAX and Telegram: CheckAccount returns the numeric chatId
 * that incoming notifications will also use, so replies land in the same chat.
 */
export async function resolveChat(client: GreenApiClient, messenger: Messenger, input: string): Promise<ResolvedChat> {
  const config = MESSENGERS[messenger];
  const value = input.trim();

  if (config.allowsUsername && value.startsWith('@')) {
    const res = await client.checkAccount({ username: value });
    return { chatId: accountChatId(res, config.label), title: res.username || value };
  }

  const phone = parsePhone(value);

  if (config.allowedCountryCodes && !config.allowedCountryCodes.some((code) => phone.startsWith(code))) {
    throw new Error(`${config.label} поддерживает только номера с кодами +${config.allowedCountryCodes.join(', +')}`);
  }

  if (config.chatLookup === 'phone') {
    return { chatId: whatsappChatId(phone), title: `+${phone}`, phone };
  }

  const res = await client.checkAccount({ phoneNumber: Number(phone) });
  return { chatId: accountChatId(res, config.label), title: `+${phone}`, phone };
}

function accountChatId(res: Awaited<ReturnType<GreenApiClient['checkAccount']>>, label: string): string {
  if (res.status === false) throw new GreenApiError(res.reason || 'Не удалось проверить аккаунт');
  if (!res.exist || !res.chatId) throw new Error(`У этого пользователя нет аккаунта ${label} или он скрыт настройками приватности`);
  return res.chatId;
}
