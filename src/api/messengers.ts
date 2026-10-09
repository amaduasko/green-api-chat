import type { Messenger } from './types';

export interface MessengerConfig {
  id: Messenger;
  label: string;
  /** Path segment that precedes the instance id in every GREEN-API method URL. */
  instancePrefix: string;
  defaultApiUrl: string;
}

// All three products share the same REST shape: {apiUrl}/{prefix}{idInstance}/{method}/{apiTokenInstance}.
// Each instance shows its own apiUrl in the GREEN-API console; the user can override the default.
export const MESSENGERS: Record<Messenger, MessengerConfig> = {
  max: { id: 'max', label: 'MAX', instancePrefix: 'waInstance', defaultApiUrl: 'https://api.green-api.com' },
  whatsapp: { id: 'whatsapp', label: 'WhatsApp', instancePrefix: 'waInstance', defaultApiUrl: 'https://api.green-api.com' },
  telegram: { id: 'telegram', label: 'Telegram', instancePrefix: 'waInstance', defaultApiUrl: 'https://api.green-api.com' },
};

export const MESSENGER_LIST = Object.values(MESSENGERS);
