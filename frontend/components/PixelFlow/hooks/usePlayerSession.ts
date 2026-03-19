import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAudioTracks, selectAudioTrack } from '../managers/audioManager';
import { PlaylistManager } from '../managers/playlistManager';
import { getSubtitleTracks, selectSubtitleTrack } from '../managers/subtitleManager';
import { buildAnalyticsSnapshot, createDiagnostics } from '../services/analyticsService';
import { PlayerController } from '../playerController';
import type {
  LogLevel,
  PlayerAnalyticsSnapshot,
  PlayerDiagnostics,
  PlayerLog,
  PlayerStatus,
  SelectableTrack,
  StreamOption,
  Strategy,
} from '../types';

const INITIAL_ANALYTICS: PlayerAnalyticsSnapshot = {
  diagnostics: null,
  currentStrategy: null,
  retries: 0,
  latencyMs: 0,
  estimatedBandwidthKbps: 0,
  bufferedSeconds: 0,
  capturedAt: 0,
};

export const usePlayerSession = (playlist: StreamOption[]) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerShellRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<PlayerController | null>(null);
  const playlistManager = useMemo(() => new PlaylistManager(playlist), [playlist]);

  const [url, setUrl] = useState(playlist[0]?.url ?? '');
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [logs, setLogs] = useState<PlayerLog[]>([]);
  const [currentStrategy, setCurrentStrategy] = useState<Strategy | null>(null);
  const [retries, setRetries] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [audioTracks, setAudioTracks] = useState<SelectableTrack[]>([]);
  const [subtitleTracks, setSubtitleTracks] = useState<SelectableTrack[]>([]);
  const [diagnostics, setDiagnostics] = useState<PlayerDiagnostics | null>(null);
  const [analytics, setAnalytics] = useState<PlayerAnalyticsSnapshot>(INITIAL_ANALYTICS);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const addLog = useCallback((msg: string, type: LogLevel = 'info'): void => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-7), { msg, type, time }]);
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      return;
    }

    controllerRef.current = new PlayerController(videoElement, {
      onStateChange: (nextState) => {
        setStatus(nextState);
        addLog(`State changed to ${nextState}`, 'info');
      },
      onError: (error) => {
        setStatus('error');
        addLog(`Error: ${error.message}`, 'error');
      },
      onRetry: (count) => {
        setRetries(count);
        addLog(`Retry ${count} triggered`, 'warning');
      },
      onStrategyChange: (strategy) => {
        setCurrentStrategy(strategy);
        addLog(`Strategy changed -> ${strategy}`, 'success');
      },
    });

    const handleLoadedMetadata = (): void => {
      const nextAudioTracks = getAudioTracks(videoElement);
      const nextSubtitleTracks = getSubtitleTracks(videoElement);
      setAudioTracks(nextAudioTracks);
      setSubtitleTracks(nextSubtitleTracks);
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, [addLog]);

  useEffect(() => {
    const onFullscreenChange = (): void => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnalytics(
        buildAnalyticsSnapshot({
          diagnostics,
          strategy: currentStrategy,
          retries,
          videoElement: videoRef.current,
        }),
      );
    }, 1200);

    return () => clearInterval(interval);
  }, [currentStrategy, diagnostics, retries]);

  const load = useCallback(async (sourceUrl: string): Promise<void> => {
    if (!sourceUrl.trim() || !controllerRef.current) {
      return;
    }

    setLogs([]);
    setRetries(0);
    setDiagnostics(createDiagnostics(sourceUrl));
    addLog(`Initializing playback for ${sourceUrl}`, 'info');

    try {
      await controllerRef.current.load(sourceUrl);
      addLog('Playback initialized', 'success');
      playlistManager.setCurrentByUrl(sourceUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown load error';
      addLog(`Load failed: ${message}`, 'error');
    }
  }, [addLog, playlistManager]);

  const loadCurrent = useCallback(async (): Promise<void> => {
    await load(url);
  }, [load, url]);

  const loadNext = useCallback(async (): Promise<void> => {
    const next = playlistManager.next();
    if (!next) {
      return;
    }

    setUrl(next.url);
    await load(next.url);
  }, [load, playlistManager]);

  const loadPrevious = useCallback(async (): Promise<void> => {
    const previous = playlistManager.previous();
    if (!previous) {
      return;
    }

    setUrl(previous.url);
    await load(previous.url);
  }, [load, playlistManager]);

  const togglePlay = useCallback(async (): Promise<void> => {
    if (!controllerRef.current) {
      return;
    }

    if (status === 'playing') {
      controllerRef.current.pause();
      return;
    }

    await controllerRef.current.play();
  }, [status]);

  const toggleMute = useCallback((): void => {
    setIsMuted((value) => !value);
  }, []);

  const chooseAudioTrack = useCallback((id: string): void => {
    if (!videoRef.current) {
      return;
    }

    selectAudioTrack(videoRef.current, id);
    setAudioTracks(getAudioTracks(videoRef.current));
    addLog(`Audio track switched -> ${id}`, 'info');
  }, [addLog]);

  const chooseSubtitleTrack = useCallback((id: string): void => {
    if (!videoRef.current) {
      return;
    }

    selectSubtitleTrack(videoRef.current, id);
    setSubtitleTracks(getSubtitleTracks(videoRef.current));
    addLog(`Subtitle track switched -> ${id}`, 'info');
  }, [addLog]);

  const chooseStream = useCallback(async (stream: StreamOption): Promise<void> => {
    setUrl(stream.url);
    await load(stream.url);
  }, [load]);

  const toggleFullscreen = useCallback(async (): Promise<void> => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    if (!playerShellRef.current) {
      return;
    }

    await playerShellRef.current.requestFullscreen();
  }, []);

  return {
    videoRef,
    playerShellRef,
    url,
    setUrl,
    status,
    logs,
    retries,
    isMuted,
    currentStrategy,
    diagnostics,
    analytics,
    isFullscreen,
    audioTracks,
    subtitleTracks,
    loadCurrent,
    load,
    loadNext,
    loadPrevious,
    togglePlay,
    toggleMute,
    chooseAudioTrack,
    chooseSubtitleTrack,
    chooseStream,
    toggleFullscreen,
    playlist: playlistManager.getAll(),
  };
};
