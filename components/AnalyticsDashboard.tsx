'use client';

import { useEffect, useMemo, useState } from 'react';
import { PIXELFLOW_ANALYTICS_STORAGE_KEY } from '../utils/analyticsStorage';
import type { PlayerAnalyticsSnapshot, PlayerDiagnostics, PlayerLog, Strategy } from './types';

type AnalyticsSnapshot = {
  status: string;
  retries: number;
  currentStrategy: Strategy | null;
  diagnostics: PlayerDiagnostics | null;
  analytics: PlayerAnalyticsSnapshot;
  logs: PlayerLog[];
  updatedAt: number;
};

const emptySnapshot: AnalyticsSnapshot = {
  status: 'idle',
  retries: 0,
  currentStrategy: null,
  diagnostics: null,
  analytics: {
    diagnostics: null,
    currentStrategy: null,
    retries: 0,
    latencyMs: 0,
    estimatedBandwidthKbps: 0,
    bufferedSeconds: 0,
    capturedAt: 0,
  },
  logs: [],
  updatedAt: 0,
};

const getStatusTone = (status: string): string => {
  const normalized = status.toLowerCase();

  if (normalized === 'playing') return 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10';
  if (normalized === 'loading' || normalized === 'buffering' || normalized === 'switching') return 'text-amber-300 border-amber-400/30 bg-amber-400/10';
  if (normalized === 'error') return 'text-rose-300 border-rose-400/30 bg-rose-400/10';

  return 'text-gray-300 border-white/15 bg-white/5';
};

const getLogTone = (type: PlayerLog['type']): string => {
  if (type === 'error') return 'text-rose-300';
  if (type === 'warning') return 'text-amber-300';
  if (type === 'success') return 'text-emerald-300';
  return 'text-gray-200';
};

const AnalyticsDashboard = () => {
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot>(emptySnapshot);
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  useEffect(() => {
    const readSnapshot = (): void => {
      const raw = window.localStorage.getItem(PIXELFLOW_ANALYTICS_STORAGE_KEY);
      if (!raw) {
        setSnapshot(emptySnapshot);
        return;
      }

      try {
        setSnapshot(JSON.parse(raw) as AnalyticsSnapshot);
      } catch {
        setSnapshot(emptySnapshot);
      }
    };

    const onStorage = (event: StorageEvent): void => {
      if (event.key === PIXELFLOW_ANALYTICS_STORAGE_KEY) {
        readSnapshot();
      }
    };

    readSnapshot();
    window.addEventListener('storage', onStorage);
    const poll = window.setInterval(readSnapshot, 1500);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setNowTs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(tick);
    };
  }, []);

  const cards = useMemo(() => {
    return [
      {
        label: 'Latency',
        unit: 'ms',
        value: snapshot.analytics.latencyMs,
      },
      {
        label: 'Buffered',
        unit: 's',
        value: snapshot.analytics.bufferedSeconds,
      },
      {
        label: 'Retries',
        unit: '',
        value: snapshot.retries,
      },
      {
        label: 'Log Events',
        unit: '',
        value: snapshot.logs.length,
      },
    ];
  }, [snapshot]);

  const updatedLabel = useMemo(() => {
    if (!snapshot.updatedAt) {
      return 'No session data yet';
    }

    const elapsedMs = nowTs - snapshot.updatedAt;
    if (elapsedMs < 10_000) {
      return 'Updated just now';
    }

    return `Updated ${Math.floor(elapsedMs / 1000)}s ago`;
  }, [nowTs, snapshot.updatedAt]);

  return (
    <section className="px-1 py-1">
      <section className="mx-auto max-w-6xl space-y-5">
        <div className="flex items-center justify-end gap-4 px-1">
          <span className="text-xs text-gray-400">{updatedLabel}</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl border border-white/10 bg-surface-low/80 p-4 transition-colors hover:border-primary/25">
              <div className="text-[11px] uppercase tracking-[0.16em] text-gray-400">{card.label}</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold leading-none text-foreground">{card.value}</span>
                {card.unit ? <span className="text-xs uppercase tracking-[0.14em] text-gray-400">{card.unit}</span> : null}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${getStatusTone(snapshot.status)}`}>
            Status: {snapshot.status}
          </span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-300">
            Strategy: {snapshot.currentStrategy ?? 'none'}
          </span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-300">
            Type: {snapshot.diagnostics?.mediaType ?? 'unknown'}
          </span>
        </div>

        <section className="overflow-hidden rounded-xl border border-white/10 bg-surface-low">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="text-xs font-display uppercase tracking-[0.16em] text-gray-400">Session Logs</span>
            <span className="text-[11px] uppercase tracking-[0.14em] text-gray-400">{snapshot.logs.length} entries</span>
          </div>
          <div className="max-h-[420px] space-y-2 overflow-y-auto p-4 font-mono text-xs">
            {snapshot.logs.length === 0 && <p className="text-gray-400">No logs captured yet. Start playback to begin analytics capture.</p>}
            {snapshot.logs.map((log, index) => (
              <div key={`${log.time}-${log.msg}-${index}`} className={`flex gap-2 rounded border border-white/5 bg-black/10 px-3 py-2 ${getLogTone(log.type)}`}>
                <span className="text-gray-400">[{log.time}]</span>
                <span>{log.msg}</span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </section>
  );
};

export default AnalyticsDashboard;
