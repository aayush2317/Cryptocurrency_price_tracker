import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { coins } from '../data/coins';
import { useWatchlist } from './useWatchlist';
export default function useWebMCP() {
  const watchlist = useWatchlist(),
    latest = useRef(watchlist);
  latest.current = watchlist;
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tool = {
      name: 'set_watchlist_asset',
      title: 'Set watchlist asset',
      description:
        'Add or remove one sample cryptocurrency from the device-local CryptoPulse watchlist.',
      inputSchema: {
        type: 'object',
        properties: {
          coinId: { type: 'string', enum: coins.map((c) => c.id) },
          saved: { type: 'boolean' },
        },
        required: ['coinId', 'saved'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (
          !input ||
          typeof input.saved !== 'boolean' ||
          !coins.some((c) => c.id === input.coinId) ||
          Object.keys(input).some((k) => !['coinId', 'saved'].includes(k))
        )
          throw new Error('Provide a valid coinId and a boolean saved value.');
        if (latest.current.ids.includes(input.coinId) !== input.saved)
          flushSync(() => latest.current.toggle(input.coinId));
        return {
          coinId: input.coinId,
          saved: latest.current.ids.includes(input.coinId),
          storage: 'this device',
        };
      },
    };
    try {
      Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {});
    } catch {
      /* Optional browser capability: the visible UI remains available. */
    }
    return () => lifecycle.abort();
  }, []);
}
