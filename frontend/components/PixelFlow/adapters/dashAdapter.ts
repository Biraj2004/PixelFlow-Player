import type { PlaybackAdapter } from '../types';

type DashLikePlayer = {
  initialize: (element: HTMLMediaElement, source: string, autoPlay: boolean) => void;
  on: (event: string, handler: (payload: unknown) => void) => void;
  off: (event: string, handler: (payload: unknown) => void) => void;
  reset: () => void;
};

export class DashAdapter implements PlaybackAdapter {
  private player: DashLikePlayer | null = null;
  private videoElement: HTMLVideoElement | null = null;

  static isSupported = (): boolean => {
    return typeof window !== 'undefined' && typeof window.MediaSource !== 'undefined';
  };

  attach = (videoElement: HTMLVideoElement): void => {
    this.videoElement = videoElement;
  };

  load = async (url: string): Promise<void> => {
    if (!this.videoElement) {
      throw new Error('Video element not attached');
    }
    const videoElement = this.videoElement;

    if (this.player) {
      this.destroy();
    }

    await new Promise<void>((resolve, reject) => {
      try {
        void import('dashjs').then((dashjsModule) => {
          const dashjs = dashjsModule.MediaPlayer;
          const events = dashjs.events;
          this.player = dashjs().create() as DashLikePlayer;

          if (!this.player) {
            reject(new Error('Failed to initialize DASH player'));
            return;
          }

          const onInitialized = (): void => {
            cleanup();
            resolve();
          };

          const onError = (event: unknown): void => {
            cleanup();
            reject(new Error(`DASH error: ${JSON.stringify(event)}`));
          };

          const cleanup = (): void => {
            if (!this.player) {
              return;
            }
            this.player.off(events.STREAM_INITIALIZED, onInitialized);
            this.player.off(events.ERROR, onError);
          };

          this.player.on(events.STREAM_INITIALIZED, onInitialized);
          this.player.on(events.ERROR, onError);
          this.player.initialize(videoElement, url, false);
        }).catch((error) => {
          reject(error instanceof Error ? error : new Error('Failed to import dash.js'));
        });
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Unknown DASH error'));
      }
    });
  };

  destroy = (): void => {
    if (!this.player) {
      return;
    }

    this.player.reset();
    this.player = null;
  };
}
