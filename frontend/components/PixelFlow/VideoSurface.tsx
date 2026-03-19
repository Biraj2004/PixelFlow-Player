import { forwardRef } from 'react';
import clsx from 'clsx';

type VideoSurfaceProps = {
  className?: string;
  onTimeUpdate?: React.ReactEventHandler<HTMLVideoElement>;
  onLoadedMetadata?: React.ReactEventHandler<HTMLVideoElement>;
  onWaiting?: React.ReactEventHandler<HTMLVideoElement>;
  onPlaying?: React.ReactEventHandler<HTMLVideoElement>;
  onPause?: React.ReactEventHandler<HTMLVideoElement>;
  onEnded?: React.ReactEventHandler<HTMLVideoElement>;
  onError?: React.ReactEventHandler<HTMLVideoElement>;
  muted?: boolean;
  autoPlay?: boolean;
};

const VideoSurface = forwardRef<HTMLVideoElement, VideoSurfaceProps>(({
  className,
  onTimeUpdate,
  onLoadedMetadata,
  onWaiting,
  onPlaying,
  onPause,
  onEnded,
  onError,
  muted = false,
  autoPlay = false,
}, ref) => {
  return (
    <div className={clsx('relative w-full h-full bg-surface-container overflow-hidden rounded-lg group', className)}>
      {/* Cyber-Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(153,247,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(153,247,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] mix-blend-overlay"></div>
      
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-20 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(11,14,17,0.6))]"></div>

      <video
        ref={ref}
        className="w-full h-full object-contain relative z-0"
        playsInline
        muted={muted}
        autoPlay={autoPlay}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onWaiting={onWaiting}
        onPlaying={onPlaying}
        onPause={onPause}
        onEnded={onEnded}
        onError={onError}
      />
    </div>
  );
});

VideoSurface.displayName = 'VideoSurface';

export default VideoSurface;
