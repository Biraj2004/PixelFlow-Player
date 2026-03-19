import type { PlaybackAdapter } from '../types';

export class NativeAdapter implements PlaybackAdapter {
  private videoElement: HTMLVideoElement | null = null;

  attach = (videoElement: HTMLVideoElement): void => {
    this.videoElement = videoElement;
  };

  load = async (url: string): Promise<void> => {
    if (!this.videoElement) {
      throw new Error('Video element not attached');
    }

    this.videoElement.src = url;
    this.videoElement.load();
  };

  destroy = (): void => {
    if (!this.videoElement) {
      return;
    }

    this.videoElement.pause();
    this.videoElement.removeAttribute('src');
    this.videoElement.load();
  };
}
