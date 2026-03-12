import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../app/components/AuthProvider';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Helper: renders AuthProvider and exposes fetchWithAuth via a callback
function renderFetchWithAuth(callback: (fn: (input: RequestInfo, init?: RequestInit) => Promise<Response>) => void) {
  function Consumer() {
    const { fetchWithAuth } = useAuth();
    useEffect(() => { callback(fetchWithAuth); }, [fetchWithAuth]);
    return null;
  }
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>
  );
}

describe('fetchWithAuth', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the response normally on a 200', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 200 } as Response);

    let result: Response | undefined;
    await act(async () => {
      renderFetchWithAuth(async (fetchWithAuth) => {
        result = await fetchWithAuth('http://localhost:3001/api/metadata');
      });
    });

    expect(result?.status).toBe(200);
  });

  it('calls /api/refresh then retries on 401 with "token expired"', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        clone: () => ({
          json: async () => ({ message: 'Token expired' }),
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response) // refresh
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response); // retry

    await act(async () => {
      renderFetchWithAuth(async (fetchWithAuth) => {
        await fetchWithAuth('http://localhost:3001/api/metadata');
      });
    });

    const calls = vi.mocked(fetch).mock.calls.map((c) => c[0]);
    expect(calls.some((url) => String(url).includes('/api/refresh'))).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('does NOT call /api/refresh on a 401 without "token expired"', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      clone: () => ({
        json: async () => ({ message: 'Unauthorized' }),
      }),
    } as unknown as Response);

    await act(async () => {
      renderFetchWithAuth(async (fetchWithAuth) => {
        await fetchWithAuth('http://localhost:3001/api/metadata');
      });
    });

    const calls = vi.mocked(fetch).mock.calls.map((c) => c[0]);
    expect(calls.some((url) => String(url).includes('/api/refresh'))).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
