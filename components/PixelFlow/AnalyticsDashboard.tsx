'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PIXELFLOW_ANALYTICS_STORAGE_KEY } from './utils/analyticsStorage';
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
      { label: 'Logs', value: snapshot.logs.length },
      { label: 'Retries', value: snapshot.retries },
      { label: 'Latency (ms)', value: snapshot.analytics.latencyMs },
      { label: 'Buffer (s)', value: snapshot.analytics.bufferedSeconds },
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
    <main className="min-h-screen px-6 py-10 md:px-10 lg:px-16">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl text-foreground">Analytics</h1>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">{updatedLabel}</span>
            <Link href="/" className="text-sm text-gray-300 underline decoration-primary/40 underline-offset-4 hover:text-primary">
              Back to Player
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cards.map((card) => (
            <div key={card.label} className="rounded-lg border border-white/10 bg-surface-low p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-gray-500">{card.label}</div>
              <div className="mt-1 text-2xl font-display font-bold text-foreground">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-white/10 bg-surface-low p-4 text-sm text-gray-300">Status: {snapshot.status}</div>
          <div className="rounded-lg border border-white/10 bg-surface-low p-4 text-sm text-gray-300">Strategy: {snapshot.currentStrategy ?? 'none'}</div>
          <div className="rounded-lg border border-white/10 bg-surface-low p-4 text-sm text-gray-300">Type: {snapshot.diagnostics?.mediaType ?? 'unknown'}</div>
        </div>

        <section className="rounded-lg border border-white/10 bg-surface-low overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 text-xs font-display uppercase tracking-[0.16em] text-gray-400">Logs</div>
          <div className="max-h-[360px] overflow-y-auto p-4 space-y-2 font-mono text-xs">
            {snapshot.logs.length === 0 && <p className="text-gray-500">No logs captured yet.</p>}
            {snapshot.logs.map((log) => (
              <div key={`${log.time}-${log.msg}`} className="flex gap-2 text-gray-300">
                <span className="text-gray-500">[{log.time}]</span>
                <span>{log.msg}</span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
};

export default AnalyticsDashboard;
