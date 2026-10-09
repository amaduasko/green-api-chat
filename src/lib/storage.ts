// Browser storage can be unavailable (private mode, blocked site data), so every access is guarded.

export function readJson<T>(storage: () => Storage, key: string): T | null {
  try {
    const raw = storage().getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJson(storage: () => Storage, key: string, value: unknown): void {
  try {
    storage().setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota or access errors */
  }
}

export function remove(storage: () => Storage, key: string): void {
  try {
    storage().removeItem(key);
  } catch {
    /* ignore */
  }
}

export const session = () => window.sessionStorage;
export const local = () => window.localStorage;
