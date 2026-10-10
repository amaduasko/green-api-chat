/**
 * Extracts a phone number in international format (digits only) from user input:
 * "+7 900 123-45-67", "8 (900) 123-45-67" and "79001234567" all give "79001234567".
 */
export function parsePhone(input: string): string {
  let digits = input.replace(/\D/g, '');
  // Russian domestic format: 8XXXXXXXXXX -> 7XXXXXXXXXX
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;

  if (digits.length < 10 || digits.length > 15) {
    throw new Error('Введите номер в международном формате, например +7 900 123-45-67');
  }
  return digits;
}

/** WhatsApp personal chat id for a phone number. */
export function whatsappChatId(phone: string): string {
  return `${phone}@c.us`;
}

/** Fallback chat title when no name or phone is known. */
export function chatTitle(chatId: string): string {
  const [id, domain] = chatId.split('@');
  return domain === 'c.us' && /^\d+$/.test(id) ? `+${id}` : chatId;
}

/** Two-character avatar label: last two digits of a phone, or initials of a name. */
export function initials(title: string): string {
  const digits = title.replace(/\D/g, '');
  if (/^\+?[\d\s-]+$/.test(title)) return digits.slice(-2) || '#';
  return (
    title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || '#'
  );
}
