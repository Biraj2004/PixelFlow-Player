import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { AlertTriangle, FastForward, Maximize2, Minimize2, Pause, Play, RefreshCw, Rewind, Volume2, VolumeX } from 'lucide-react';
import VideoSurface from '../VideoSurface';
import type { PlayerStatus, Strategy } from '../types';

type PlaybackPanelProps = {
  playerShellRef: React.RefObject<HTMLDivElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: PlayerStatus;
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
  const primaryActionLabel = status === 'playing' ? 'Pause' : status === 'idle' || status === 'error' ? 'Load & Play' : 'Play';
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => void onTogglePlay()}
                disabled={!canUsePlaybackControls}
                aria-label={primaryActionLabel}
                title={primaryActionLabel}
                className="inline-flex items-center gap-2 rounded border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === 'playing' ? <Pause size={16} /> : <Play size={16} />}
                <span className="hidden sm:inline">{primaryActionLabel}</span>
              </button>

              <button
                onClick={() => void onPrevious()}
                disabled={!canUsePlaybackControls}
                aria-label="Previous source"
                title="Previous source"
                className="text-gray-200 hover:text-white transition-colors p-1.5 rounded border border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Rewind size={16} />
              </button>

              <button
                onClick={() => void onNext()}
                disabled={!canUsePlaybackControls}
                aria-label="Next source"
                title="Next source"
                className="text-gray-200 hover:text-white transition-colors p-1.5 rounded border border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FastForward size={16} />
              </button>

              <button
                onClick={onToggleMute}
                disabled={!hasActiveSource}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                title={isMuted ? 'Unmute' : 'Mute'}
                className={clsx(
                  'transition-colors p-1.5 rounded border border-white/20 disabled:cursor-not-allowed disabled:opacity-50',
                  isMuted ? 'text-gray-300' : 'text-primary',
                )}
              >
                {isMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>

            <button
              onClick={() => void onToggleFullscreen()}
              disabled={!hasActiveSource}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="text-gray-300 hover:text-primary transition-colors p-1.5 rounded border border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
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
