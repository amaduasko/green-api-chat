/**
 * Turns user input into a GREEN-API chatId.
 * Accepts a phone number in any common format (+7 900 123-45-67, 8 900..., 79001234567)
 * or an already-formed chatId containing "@" (passed through unchanged).
 */
export function toChatId(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes('@')) return trimmed;

  let digits = trimmed.replace(/\D/g, '');
  // Russian domestic format: 8XXXXXXXXXX -> 7XXXXXXXXXX
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;

  if (digits.length < 10 || digits.length > 15) {
    throw new Error('Введите номер в международном формате, например +7 900 123-45-67');
  }
  return `${digits}@c.us`;
}

export function chatTitle(chatId: string): string {
  const [id, domain] = chatId.split('@');
  return domain === 'c.us' && /^\d+$/.test(id) ? `+${id}` : chatId;
}
