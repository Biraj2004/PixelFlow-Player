import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAudioTracks, selectAudioTrack } from '../managers/audioManager';
import { PlaylistManager } from '../managers/playlistManager';
import { attachExternalSubtitleTrack, getSubtitleTracks, selectSubtitleTrack } from '../managers/subtitleManager';
import { buildAnalyticsSnapshot, createDiagnostics } from '../services/analyticsService';
import { analyzePlaybackSource } from '../services/playbackAnalysisService';
import { PlayerController } from '../playerController';
import { PIXELFLOW_ANALYTICS_STORAGE_KEY } from '../utils/analyticsStorage';
import { redactUrl } from '@/lib/pixelflow-server/security';
import type {
  AnalysisDecision,
  AnalysisSeverity,
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

type UsePlayerSessionArgs = {
  playlist: StreamOption[];
  initialUrl?: string;
  externalSubtitleUrl?: string;
};

export const usePlayerSession = ({ playlist, initialUrl, externalSubtitleUrl }: UsePlayerSessionArgs) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerShellRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<PlayerController | null>(null);
  const autoLoadedInitialRef = useRef<string>('');
  const playlistManager = useMemo(() => new PlaylistManager(playlist), [playlist]);

  const [url, setUrl] = useState(initialUrl || playlist[0]?.url || '');
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
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [analysisSeverity, setAnalysisSeverity] = useState<AnalysisSeverity>('info');
  const [analysisDecision, setAnalysisDecision] = useState<AnalysisDecision>('direct');
  const [currentFormat, setCurrentFormat] = useState<PlayerDiagnostics['mediaType']>('unknown');
  const [supportedFormats, setSupportedFormats] = useState<Array<PlayerDiagnostics['mediaType']>>(['hls', 'dash', 'mp4', 'mkv']);

  const addLog = useCallback((msg: string, type: LogLevel = 'info'): void => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-7), { msg, type, time }]);
  }, []);

  const resolveTrackSnapshot = useCallback((args: {
    controllerAudio?: SelectableTrack[];
    controllerSubtitles?: SelectableTrack[];
  }): { audio: SelectableTrack[]; subtitles: SelectableTrack[] } => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      return {
        audio: args.controllerAudio ?? [],
        subtitles: args.controllerSubtitles ?? [],
      };
    }

    const audio = (args.controllerAudio ?? []).length > 0 ? args.controllerAudio ?? [] : getAudioTracks(videoElement);
    const subtitles = (args.controllerSubtitles ?? []).length > 0 ? args.controllerSubtitles ?? [] : getSubtitleTracks(videoElement);

    return { audio, subtitles };
  }, []);

  const refreshTrackState = useCallback((): void => {
    const controller = controllerRef.current;

    const tracks = resolveTrackSnapshot({
      controllerAudio: controller?.getAudioTracks() ?? [],
      controllerSubtitles: controller?.getSubtitleTracks() ?? [],
    });

    setAudioTracks(tracks.audio);
    setSubtitleTracks(tracks.subtitles);
  }, [resolveTrackSnapshot]);

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
      onTracksChanged: ({ audio, subtitles }) => {
        const tracks = resolveTrackSnapshot({
          controllerAudio: audio,
          controllerSubtitles: subtitles,
        });
        setAudioTracks(tracks.audio);
        setSubtitleTracks(tracks.subtitles);
      },
    });

    const handleLoadedMetadata = (): void => {
      if (externalSubtitleUrl) {
        attachExternalSubtitleTrack(videoElement, externalSubtitleUrl);
      }

      refreshTrackState();
    };

    const handleTrackMutation = (): void => {
      refreshTrackState();
    };

    const textTrackList = videoElement.textTracks;
    const nativeAudioTracks = (videoElement as HTMLVideoElement & {
      audioTracks?: {
        addEventListener?: (name: string, listener: EventListener) => void;
        removeEventListener?: (name: string, listener: EventListener) => void;
      };
    }).audioTracks;

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('emptied', handleTrackMutation);
    textTrackList.addEventListener?.('addtrack', handleTrackMutation as EventListener);
    textTrackList.addEventListener?.('removetrack', handleTrackMutation as EventListener);
    textTrackList.addEventListener?.('change', handleTrackMutation as EventListener);
    nativeAudioTracks?.addEventListener?.('addtrack', handleTrackMutation as EventListener);
    nativeAudioTracks?.addEventListener?.('removetrack', handleTrackMutation as EventListener);
    nativeAudioTracks?.addEventListener?.('change', handleTrackMutation as EventListener);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('emptied', handleTrackMutation);
      textTrackList.removeEventListener?.('addtrack', handleTrackMutation as EventListener);
      textTrackList.removeEventListener?.('removetrack', handleTrackMutation as EventListener);
      textTrackList.removeEventListener?.('change', handleTrackMutation as EventListener);
      nativeAudioTracks?.removeEventListener?.('addtrack', handleTrackMutation as EventListener);
      nativeAudioTracks?.removeEventListener?.('removetrack', handleTrackMutation as EventListener);
      nativeAudioTracks?.removeEventListener?.('change', handleTrackMutation as EventListener);
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, [addLog, externalSubtitleUrl, refreshTrackState, resolveTrackSnapshot]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !externalSubtitleUrl) {
      return;
    }

    attachExternalSubtitleTrack(videoElement, externalSubtitleUrl);
    const frame = window.requestAnimationFrame(() => {
      refreshTrackState();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [externalSubtitleUrl, refreshTrackState]);

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
    const stopSession = (): void => {
      controllerRef.current?.destroy();
    };

    window.addEventListener('beforeunload', stopSession);
    window.addEventListener('unload', stopSession);

    return () => {
      window.removeEventListener('beforeunload', stopSession);
      window.removeEventListener('unload', stopSession);
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

    setUrl(sourceUrl);
    setLogs([]);
    setRetries(0);

    const analysis = await analyzePlaybackSource(sourceUrl);
    setAnalysisMessage(analysis.message);
    setAnalysisSeverity(analysis.severity);
    setAnalysisDecision(analysis.decision);
    setCurrentFormat(analysis.currentFormat);
    setSupportedFormats(analysis.supportedFormats);
    addLog(`Analysis -> ${analysis.decision}: ${analysis.message}`, analysis.severity === 'error' ? 'error' : 'info');

    if (!analysis.shouldProceed) {
      setStatus('error');
      return;
    }

    const resolvedUrl = analysis.playbackUrl || sourceUrl;
    const redactedResolvedUrl = redactUrl(resolvedUrl);

    setDiagnostics(createDiagnostics(resolvedUrl));
    addLog(`Initializing playback for ${redactedResolvedUrl}`, 'info');

    try {
      await controllerRef.current.load(resolvedUrl);
      addLog('Playback initialized', 'success');
      playlistManager.setCurrentByUrl(sourceUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown load error';
      addLog(`Load failed: ${message}`, 'error');
    }
  }, [addLog, playlistManager]);

  useEffect(() => {
    if (!initialUrl || autoLoadedInitialRef.current === initialUrl) {
      return;
    }

    autoLoadedInitialRef.current = initialUrl;
    const timeoutId = window.setTimeout(() => {
      void load(initialUrl);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [initialUrl, load]);

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
    if (!controllerRef.current || !url.trim()) {
      return;
    }

    if (status === 'playing') {
      controllerRef.current.pause();
      return;
    }

    if (status === 'idle' || status === 'error') {
      await load(url);
      return;
    }

    await controllerRef.current.play();
  }, [load, status, url]);

  const toggleMute = useCallback((): void => {
    setIsMuted((value) => !value);
  }, []);

  const chooseAudioTrack = useCallback((id: string): void => {
    if (!videoRef.current) {
      return;
    }

    controllerRef.current?.selectAudioTrack(id);
    if (controllerRef.current?.getAudioTracks().length === 0) {
      selectAudioTrack(videoRef.current, id);
    }
    refreshTrackState();
    addLog(`Audio track switched -> ${id}`, 'info');
  }, [addLog, refreshTrackState]);

  const chooseSubtitleTrack = useCallback((id: string): void => {
    if (!videoRef.current) {
      return;
    }

    controllerRef.current?.selectSubtitleTrack(id);
    if (controllerRef.current?.getSubtitleTracks().length === 0) {
      selectSubtitleTrack(videoRef.current, id);
    }
    refreshTrackState();
    addLog(`Subtitle track switched -> ${id}`, 'info');
  }, [addLog, refreshTrackState]);

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const snapshot = {
      status,
      retries,
      currentStrategy,
      diagnostics,
      analytics,
      logs,
      analysisDecision,
      analysisMessage,
      analysisSeverity,
      currentFormat,
      supportedFormats,
      updatedAt: Date.now(),
    };

    window.localStorage.setItem(PIXELFLOW_ANALYTICS_STORAGE_KEY, JSON.stringify(snapshot));
  }, [
    analytics,
    analysisDecision,
    analysisMessage,
    analysisSeverity,
    currentFormat,
    currentStrategy,
    diagnostics,
    logs,
    retries,
    status,
    supportedFormats,
  ]);

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
    analysisMessage,
    analysisSeverity,
    analysisDecision,
    currentFormat,
    supportedFormats,
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
    hasActiveSource: url.trim().length > 0,
  };
};
