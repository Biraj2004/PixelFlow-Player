import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { AlertTriangle, FastForward, Maximize2, Minimize2, Pause, Play, RefreshCw, Rewind, Volume2, VolumeX } from 'lucide-react';
import VideoSurface from '../VideoSurface';
import type { PlayerStatus, Strategy } from '../types';

type PlaybackPanelProps = {
  playerShellRef: React.RefObject<HTMLDivElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: PlayerStatus;
  isActivelyPlaying: boolean;
  currentStrategy: Strategy | null;
  isMuted: boolean;
  isFullscreen: boolean;
  onReload: () => Promise<void>;
  onTogglePlay: () => Promise<void>;
  onPrevious: () => Promise<void>;
  onNext: () => Promise<void>;
  onToggleMute: () => void;
  onToggleFullscreen: () => Promise<void>;
  hasActiveSource: boolean;
};

const PlaybackPanel = ({
  playerShellRef,
  videoRef,
  status,
  isActivelyPlaying,
  currentStrategy,
  isMuted,
  isFullscreen,
  onReload,
  onTogglePlay,
  onPrevious,
  onNext,
  onToggleMute,
  onToggleFullscreen,
  hasActiveSource,
}: PlaybackPanelProps) => {
  const isError = status === 'error';
  const canUsePlaybackControls = hasActiveSource && status !== 'loading' && status !== 'switching';
  const showPauseAction = status === 'playing' || (status === 'buffering' && isActivelyPlaying);
  const primaryActionLabel = showPauseAction ? 'Pause' : status === 'idle' || status === 'error' ? 'Load & Play' : 'Play';
  const [showControls, setShowControls] = useState(true);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const [bufferedSeconds, setBufferedSeconds] = useState(0);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatClock = useCallback((seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return '00:00';
    }

    const total = Math.floor(seconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  const clearHideControlsTimer = useCallback((): void => {
    if (!hideControlsTimerRef.current) {
      return;
    }

    clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = null;
  }, []);

  const scheduleHideControls = useCallback((): void => {
    clearHideControlsTimer();
    if (!isFullscreen || isError) {
      return;
    }

    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
  }, [clearHideControlsTimer, isError, isFullscreen]);

  const revealControls = useCallback((): void => {
    setShowControls(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  useEffect(() => {
    if (!isFullscreen) {
      clearHideControlsTimer();
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      revealControls();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      clearHideControlsTimer();
    };
  }, [clearHideControlsTimer, isFullscreen, revealControls]);

  useEffect(() => {
    return () => {
      clearHideControlsTimer();
    };
  }, [clearHideControlsTimer]);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    const syncProgress = (): void => {
      const duration = Number.isFinite(videoElement.duration) ? videoElement.duration : 0;
      setDurationSeconds(duration);
      setCurrentTimeSeconds(videoElement.currentTime || 0);

      if (videoElement.buffered.length > 0) {
        const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1) || 0;
        setBufferedSeconds(bufferedEnd);
      } else {
        setBufferedSeconds(0);
      }
    };

    const onSourceReset = (): void => {
      setDurationSeconds(0);
      setCurrentTimeSeconds(0);
      setBufferedSeconds(0);
    };

    videoElement.addEventListener('timeupdate', syncProgress);
    videoElement.addEventListener('loadedmetadata', syncProgress);
    videoElement.addEventListener('durationchange', syncProgress);
    videoElement.addEventListener('progress', syncProgress);
    videoElement.addEventListener('seeked', syncProgress);
    videoElement.addEventListener('emptied', onSourceReset);

    syncProgress();

    return () => {
      videoElement.removeEventListener('timeupdate', syncProgress);
      videoElement.removeEventListener('loadedmetadata', syncProgress);
      videoElement.removeEventListener('durationchange', syncProgress);
      videoElement.removeEventListener('progress', syncProgress);
      videoElement.removeEventListener('seeked', syncProgress);
      videoElement.removeEventListener('emptied', onSourceReset);
    };
  }, [videoRef]);

  const onSeek = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    const next = Number(event.target.value);
    if (!Number.isFinite(next)) {
      return;
    }

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.currentTime = next;
    }

    setCurrentTimeSeconds(next);
  }, [videoRef]);

  const scrubMax = durationSeconds > 0 ? durationSeconds : 0;
  const bufferedPct = scrubMax > 0 ? Math.min((bufferedSeconds / scrubMax) * 100, 100) : 0;
  const playedPct = scrubMax > 0 ? Math.min((currentTimeSeconds / scrubMax) * 100, 100) : 0;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!hasActiveSource) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        void onTogglePlay();
        return;
      }

      const videoElement = videoRef.current;
      if (!videoElement) {
        return;
      }

      if (event.code === 'ArrowRight') {
        event.preventDefault();
        const nextTime = Math.min(videoElement.currentTime + 5, Number.isFinite(videoElement.duration) ? videoElement.duration : videoElement.currentTime + 5);
        videoElement.currentTime = nextTime;
        setCurrentTimeSeconds(nextTime);
      }

      if (event.code === 'ArrowLeft') {
        event.preventDefault();
        const nextTime = Math.max(videoElement.currentTime - 5, 0);
        videoElement.currentTime = nextTime;
        setCurrentTimeSeconds(nextTime);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [hasActiveSource, onTogglePlay, videoRef]);

  return (
    <div
      ref={playerShellRef}
      className="relative bg-surface-low rounded-lg overflow-hidden border border-white/5 h-[340px] md:h-[420px]"
      onMouseMove={revealControls}
    >
      <div
        className={clsx(
          'absolute top-3 left-3 z-30 flex items-center gap-2 transition-opacity duration-200',
          showControls || !isFullscreen || isError ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <div
          className={clsx(
            'px-3 py-1 rounded-full border backdrop-blur-md text-[10px] font-display font-bold tracking-widest uppercase',
            status === 'playing'
              ? 'border-primary/20 bg-primary/10 text-primary'
              : status === 'error'
                ? 'border-tertiary/20 bg-tertiary/10 text-tertiary'
                : 'border-white/10 bg-black/40 text-gray-400',
          )}
        >
          {status}
        </div>

        {currentStrategy && (
          <div className="px-3 py-1 rounded-full border border-white/10 bg-black/40 text-[10px] font-display font-bold tracking-widest uppercase text-gray-300">
            {currentStrategy}
          </div>
        )}
      </div>

      <div className="h-full relative bg-black">
        {isError && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            <AlertTriangle className="w-10 h-10 text-tertiary mb-3" />
            <h3 className="text-lg font-display font-bold text-tertiary tracking-wide">Signal Lost</h3>
            <button
              onClick={() => {
                void onReload();
              }}
              className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Retry Source
            </button>
          </div>
        )}

        <VideoSurface ref={videoRef} muted={isMuted} autoPlay={false} onTimeUpdate={() => {}} />

        <div
          className={clsx(
            'absolute inset-x-0 bottom-0 z-30 border-t border-white/10 bg-black/60 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-3 transition-opacity duration-200',
            showControls || !isFullscreen || isError ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <div className="mb-2">
            <div className="mb-1 flex items-center justify-between text-[10px] font-semibold tracking-[0.12em] text-gray-400">
              <span>{formatClock(currentTimeSeconds)}</span>
              <span>{formatClock(durationSeconds)}</span>
            </div>

            <div className="relative h-2 rounded-full bg-white/10">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white/20"
                style={{ width: `${bufferedPct}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-primary shadow-[0_0_10px_rgba(153,247,255,0.35)]"
                style={{ width: `${playedPct}%` }}
              />
              <input
                type="range"
                min={0}
                max={scrubMax}
                step={0.1}
                value={Math.min(currentTimeSeconds, scrubMax)}
                onChange={onSeek}
                disabled={!canUsePlaybackControls || scrubMax <= 0}
                aria-label="Seek timeline"
                className="absolute inset-0 h-2 w-full cursor-pointer appearance-none rounded-full bg-transparent accent-primary disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => void onTogglePlay()}
                disabled={!canUsePlaybackControls}
                aria-label={primaryActionLabel}
                title={primaryActionLabel}
                className="inline-flex min-h-11 items-center gap-2 rounded border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {showPauseAction ? <Pause size={16} /> : <Play size={16} />}
                <span className="hidden sm:inline">{primaryActionLabel}</span>
              </button>

              <button
                onClick={() => void onPrevious()}
                disabled={!canUsePlaybackControls}
                aria-label="Previous source"
                title="Previous source"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-white/20 p-2 text-gray-200 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Rewind size={16} />
              </button>

              <button
                onClick={() => void onNext()}
                disabled={!canUsePlaybackControls}
                aria-label="Next source"
                title="Next source"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-white/20 p-2 text-gray-200 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FastForward size={16} />
              </button>

              <button
                onClick={onToggleMute}
                disabled={!hasActiveSource}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                title={isMuted ? 'Unmute' : 'Mute'}
                className={clsx(
                  'inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-white/20 p-2 transition-colors focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50',
                  isMuted ? 'text-gray-300' : 'text-primary',
                )}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>

            <button
              onClick={() => void onToggleFullscreen()}
              disabled={!hasActiveSource}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-white/20 p-2 text-gray-300 transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>

          {!hasActiveSource && (
            <p className="mt-2 text-[11px] text-gray-400">Paste a media URL above and click Apply Session to enable playback controls.</p>
          )}
          {hasActiveSource && (status === 'loading' || status === 'switching') && (
            <p className="mt-2 text-[11px] text-gray-400">Initializing stream... controls unlock once playback is ready.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaybackPanel;
