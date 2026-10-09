import { useEffect, useRef, useState } from 'react';
import type { GreenApiClient } from '../api/greenApi';
import type { NotificationBody } from '../api/types';

export type ConnectionStatus = 'connecting' | 'online' | 'error';

const RECEIVE_TIMEOUT_SEC = 5;
const RETRY_DELAY_MS = 3000;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

/**
 * Long-polls the GREEN-API notification queue (HTTP API technology):
 * ReceiveNotification -> handle -> DeleteNotification, one notification at a time.
 * Every received notification is deleted, even ones we ignore, so the queue never stalls.
 */
export function useNotifications(client: GreenApiClient, onNotification: (body: NotificationBody) => void) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const handlerRef = useRef(onNotification);
  handlerRef.current = onNotification;

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    (async () => {
      while (!signal.aborted) {
        try {
          const notification = await client.receiveNotification(RECEIVE_TIMEOUT_SEC, signal);
          if (signal.aborted) break;
          setStatus('online');
          if (!notification) continue;

          try {
            handlerRef.current(notification.body);
          } finally {
            await client.deleteNotification(notification.receiptId);
          }
        } catch {
          if (signal.aborted) break;
          setStatus('error');
          await sleep(RETRY_DELAY_MS, signal);
        }
      }
    })();

    return () => controller.abort();
  }, [client]);

  return status;
}
