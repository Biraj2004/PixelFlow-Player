import Hls, { type ErrorData } from 'hls.js';
import type { PlaybackAdapter } from '../types';

export class HlsAdapter implements PlaybackAdapter {
  private hls: Hls | null = null;
  private videoElement: HTMLVideoElement | null = null;

  static isSupported = (): boolean => Hls.isSupported();

  attach = (videoElement: HTMLVideoElement): void => {
    this.videoElement = videoElement;
  };

  load = async (url: string): Promise<void> => {
    if (!this.videoElement) {
      throw new Error('Video element not attached');
    }

    if (this.hls) {
      this.destroy();
    }

    this.hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
    });

    await new Promise<void>((resolve, reject) => {
      if (!this.hls || !this.videoElement) {
        reject(new Error('HLS initialization failed'));
        return;
      }

      const onManifestParsed = (): void => {
        cleanup();
        resolve();
      };

      const onError = (_event: string, data: ErrorData): void => {
        if (!this.hls) {
          cleanup();
          reject(new Error('HLS instance not available'));
          return;
        }

        if (!data.fatal) {
          return;
        }

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.error('[HlsAdapter] fatal network error, trying startLoad recovery');
            this.hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.error('[HlsAdapter] fatal media error, trying recoverMediaError');
            this.hls.recoverMediaError();
            break;
          default:
            cleanup();
            reject(new Error(`HLS fatal error: ${data.details}`));
            break;
        }
      };

      const cleanup = (): void => {
        if (!this.hls) {
          return;
        }
        this.hls.off(Hls.Events.MANIFEST_PARSED, onManifestParsed);
        this.hls.off(Hls.Events.ERROR, onError);
      };

      this.hls.on(Hls.Events.MANIFEST_PARSED, onManifestParsed);
      this.hls.on(Hls.Events.ERROR, onError);
      this.hls.loadSource(url);
      this.hls.attachMedia(this.videoElement);
    });
  };

  destroy = (): void => {
    if (!this.hls) {
      return;
    }

    this.hls.destroy();
    this.hls = null;
  };
}
