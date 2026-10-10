import type { Messenger } from './types';

export interface MessengerConfig {
  id: Messenger;
  label: string;
  defaultApiUrl: string;
  /**
   * How a phone number becomes a chatId:
   * - 'phone': WhatsApp accepts `79001234567@c.us` directly.
   * - 'checkAccount': MAX and Telegram use numeric chat ids, looked up with the CheckAccount method.
   */
  chatLookup: 'phone' | 'checkAccount';
  /** Country codes the messenger accepts for phone lookup, if restricted. */
  allowedCountryCodes?: string[];
  /** Telegram can also find a user by @username. */
  allowsUsername: boolean;
  placeholder: string;
}

// GREEN-API uses one URL shape for all three: {apiUrl}/waInstance{idInstance}/{method}/{apiTokenInstance}.
// Each instance shows its own apiUrl in the console; the user can override the default.
export const MESSENGERS: Record<Messenger, MessengerConfig> = {
  max: {
    id: 'max',
    label: 'MAX',
    defaultApiUrl: 'https://api.green-api.com',
    chatLookup: 'checkAccount',
    allowedCountryCodes: ['7', '375'],
    allowsUsername: false,
    placeholder: '+7 900 123-45-67',
  },
  whatsapp: {
    id: 'whatsapp',
    label: 'WhatsApp',
    defaultApiUrl: 'https://api.green-api.com',
    chatLookup: 'phone',
    allowsUsername: false,
    placeholder: '+7 900 123-45-67',
  },
  telegram: {
    id: 'telegram',
    label: 'Telegram',
    defaultApiUrl: 'https://api.green-api.com',
    chatLookup: 'checkAccount',
    allowsUsername: true,
    placeholder: '+7 900 123-45-67 или @username',
  },
};

export const MESSENGER_LIST = Object.values(MESSENGERS);
