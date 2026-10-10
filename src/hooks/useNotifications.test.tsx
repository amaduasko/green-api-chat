import { renderHook, waitFor } from '@testing-library/react';
import type { GreenApiClient } from '../api/greenApi';
import type { Notification } from '../api/types';
import { useNotifications } from './useNotifications';

function fakeClient(queue: (Notification | null)[]): GreenApiClient & { deleted: number[] } {
  const deleted: number[] = [];
  return {
    deleted,
    getStateInstance: vi.fn(),
    sendMessage: vi.fn(),
    checkAccount: vi.fn(),
    receiveNotification: vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 1));
      return queue.length ? queue.shift()! : null;
    }),
    deleteNotification: vi.fn(async (id: number) => {
      deleted.push(id);
      return true;
    }),
  };
}

describe('useNotifications', () => {
  it('passes each notification to the handler and deletes it, including ignored ones', async () => {
    const client = fakeClient([
      { receiptId: 1, body: { typeWebhook: 'incomingMessageReceived' } },
      { receiptId: 2, body: { typeWebhook: 'stateInstanceChanged' } },
    ]);
    const handler = vi.fn();
    const { result, unmount } = renderHook(() => useNotifications(client, handler));

    await waitFor(() => expect(client.deleted).toEqual([1, 2]));
    expect(handler).toHaveBeenCalledTimes(2);
    expect(result.current).toBe('online');
    unmount();
  });

  it('reports an error status when polling fails', async () => {
    const client = fakeClient([]);
    client.receiveNotification = vi.fn().mockRejectedValue(new Error('down'));
    const { result, unmount } = renderHook(() => useNotifications(client, vi.fn()));

    await waitFor(() => expect(result.current).toBe('error'));
    unmount();
  });
});
