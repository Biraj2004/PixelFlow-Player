import { DashAdapter } from './adapters/dashAdapter';
import { HlsAdapter } from './adapters/hlsAdapter';
import { NativeAdapter } from './adapters/nativeAdapter';
import type { PlaybackAdapter, PlayerControllerCallbacks, PlayerStatus, Strategy } from './types';

const MAX_RETRIES = 3;

export class PlayerController {
  private readonly videoElement: HTMLVideoElement;
  private readonly callbacks: PlayerControllerCallbacks;
  private currentAdapter: PlaybackAdapter | null = null;
  private currentUrl = '';
  private retryCount = 0;
  private strategyQueue: Strategy[] = [];
  private currentStrategyIndex = 0;
  private state: PlayerStatus = 'idle';
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(videoElement: HTMLVideoElement, callbacks: PlayerControllerCallbacks = {}) {
    this.videoElement = videoElement;
    this.callbacks = callbacks;
    this.attachRuntimeListeners();
  }

  private setState = (newState: PlayerStatus): void => {
    this.state = newState;
    this.callbacks.onStateChange?.(newState);
  };

  private detectMediaType = (url: string): 'mp4' | 'mkv' | 'hls' | 'dash' | 'unknown' => {
    const extension = url.split('?')[0]?.split('.').pop()?.toLowerCase();
    if (extension === 'm3u8') return 'hls';
    if (extension === 'mpd') return 'dash';
    if (extension === 'mp4') return 'mp4';
    if (extension === 'mkv') return 'mkv';
    return 'unknown';
  };

  private determineStrategies = (url: string): Strategy[] => {
    const mediaType = this.detectMediaType(url);
    const supportsNativeHls = this.videoElement.canPlayType('application/vnd.apple.mpegurl') !== '';
    const strategies: Strategy[] = [];

    // Required fallback order baseline:
    // 1) native, 2) hls adapter, 3) dash adapter.
    strategies.push('native');

    if (mediaType === 'hls') {
      if (HlsAdapter.isSupported() || supportsNativeHls) {
        strategies.push('hls');
      }
      if (DashAdapter.isSupported()) {
        strategies.push('dash');
      }
      return Array.from(new Set(strategies));
    }

    if (mediaType === 'dash') {
      if (HlsAdapter.isSupported() || supportsNativeHls) {
        strategies.push('hls');
      }
      if (DashAdapter.isSupported()) {
        strategies.push('dash');
      }
      return Array.from(new Set(strategies));
    }

    if (HlsAdapter.isSupported() || supportsNativeHls) {
      strategies.push('hls');
    }
    if (DashAdapter.isSupported()) {
      strategies.push('dash');
    }

    return Array.from(new Set(strategies));
  };

  private createAdapter = (strategy: Strategy): PlaybackAdapter => {
    if (strategy === 'hls') {
      return new HlsAdapter();
    }
    if (strategy === 'dash') {
      return new DashAdapter();
    }
    return new NativeAdapter();
  };

  private clearRetryTimer = (): void => {
    if (!this.retryTimer) {
      return;
    }

    clearTimeout(this.retryTimer);
    this.retryTimer = null;
  };

  private attachRuntimeListeners = (): void => {
    this.videoElement.addEventListener('playing', () => {
      this.setState('playing');
    });

    this.videoElement.addEventListener('waiting', () => {
      if (this.state !== 'loading' && this.state !== 'switching') {
        this.setState('buffering');
      }
    });

    this.videoElement.addEventListener('stalled', () => {
      if (this.state === 'error') {
        return;
      }
      this.handleError(new Error('Playback stalled'));
    });

    this.videoElement.addEventListener('error', () => {
      const mediaError = this.videoElement.error;
      const message = mediaError ? `MediaError code ${mediaError.code}` : 'Playback error';
      this.handleError(new Error(message));
    });
  };

  load = async (url: string): Promise<void> => {
    this.clearRetryTimer();
    this.cleanupAdapter();

    this.currentUrl = url;
    this.retryCount = 0;
    this.currentStrategyIndex = 0;
    this.strategyQueue = this.determineStrategies(url);

    if (this.strategyQueue.length === 0) {
      this.setState('error');
      this.callbacks.onError?.(new Error('No supported playback strategies available'));
      return;
    }

    this.setState('loading');
    await this.attemptCurrentStrategy();
  };

  private attemptCurrentStrategy = async (): Promise<void> => {
    const strategy = this.strategyQueue[this.currentStrategyIndex];

    if (!strategy) {
      this.setState('error');
      this.callbacks.onError?.(new Error('Playback failed after all strategies'));
      return;
    }

    this.setState('switching');
    this.callbacks.onStrategyChange?.(strategy);
    console.log(`[PlayerController] strategy change -> ${strategy}`);

    this.cleanupAdapter();
    this.currentAdapter = this.createAdapter(strategy);
    this.currentAdapter.attach(this.videoElement);

    try {
      await this.currentAdapter.load(this.currentUrl);
      await this.videoElement.play();
      this.setState('playing');
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Unknown playback error'));
    }
  };

  private handleError = (error: Error): void => {
    console.error('[PlayerController] error', error);

    if (this.retryCount < MAX_RETRIES) {
      this.retryCount += 1;
      this.callbacks.onRetry?.(this.retryCount);
      console.log(`[PlayerController] retry ${this.retryCount}/${MAX_RETRIES}`);

      this.retryTimer = setTimeout(() => {
        void this.attemptCurrentStrategy();
      }, 800 * this.retryCount);
      return;
    }

    this.retryCount = 0;
    this.currentStrategyIndex += 1;

    if (this.currentStrategyIndex < this.strategyQueue.length) {
      console.log('[PlayerController] switching to next strategy');
      void this.attemptCurrentStrategy();
      return;
    }

    this.setState('error');
    this.callbacks.onError?.(error);
  };

  play = async (): Promise<void> => {
    await this.videoElement.play();
  };

  pause = (): void => {
    this.videoElement.pause();
  };

  private cleanupAdapter = (): void => {
    if (!this.currentAdapter) {
      return;
    }

    this.currentAdapter.destroy();
    this.currentAdapter = null;
  };

  destroy = (): void => {
    this.clearRetryTimer();
    this.cleanupAdapter();
    this.videoElement.pause();
    this.videoElement.removeAttribute('src');
    this.videoElement.load();
    this.setState('idle');
  };
}
