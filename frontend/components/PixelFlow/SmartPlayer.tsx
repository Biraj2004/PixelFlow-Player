'use client';

import { type ReactElement } from 'react';
import {
  Activity,
  AlertTriangle,
  Captions,
  FastForward,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RefreshCw,
  Rewind,
  Settings,
  Volume2,
} from 'lucide-react';
import clsx from 'clsx';
import VideoSurface from './VideoSurface';
import { usePlayerSession } from './hooks/usePlayerSession';
import type { StreamOption } from './types';

const MOCK_STREAMS: StreamOption[] = [
  { name: 'Big Buck Bunny (HLS)', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
  { name: 'Sintel (DASH)', url: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd' },
  { name: 'Tears of Steel (MKV)', url: 'https://test-streams.mux.dev/pts_shift/master.m3u8?src=tears-mkv' },
  { name: 'Ocean (MP4)', url: 'https://vjs.zencdn.net/v/oceans.mp4' },
];

const SmartPlayer = (): ReactElement => {
  const {
    analytics,
    audioTracks,
    chooseAudioTrack,
    chooseStream,
    chooseSubtitleTrack,
    currentStrategy,
    diagnostics,
    isFullscreen,
    isMuted,
    loadCurrent,
    loadNext,
    loadPrevious,
    logs,
    playlist,
    playerShellRef,
    retries,
    setUrl,
    status,
    subtitleTracks,
    toggleMute,
    toggleFullscreen,
    togglePlay,
    url,
    videoRef,
  } = usePlayerSession(MOCK_STREAMS);

  const isError = status === 'error';
  const isLoading = status === 'loading' || status === 'switching';

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      
      {/* Header / Input Area */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-surface-low p-6 rounded-lg border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary box-shadow-glow-primary"></div>
        
        <div className="flex-1 w-full space-y-2">
          <label className="text-xs font-display tracking-widest text-primary font-bold uppercase">Stream Source</label>
          <div className="relative group">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-surface-container border-b-2 border-surface-bright focus:border-primary outline-none py-3 text-sm font-sans transition-all placeholder:text-surface-bright text-foreground"
              placeholder="Enter stream URL (.m3u8, .mpd, .mp4)"
            />
            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary group-focus-within:w-full transition-all duration-300 shadow-glow-primary"></div>
          </div>
        </div>

        <button 
          onClick={() => {
            void loadCurrent();
          }}
          className="px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-black font-bold font-display tracking-wide rounded hover:shadow-glow-primary transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'INITIALIZING...' : 'JACK IN'}
        </button>
      </div>

      {/* Main Interface Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Player Surface */}
        <div ref={playerShellRef} className="lg:col-span-8 relative bg-surface-low rounded-lg overflow-hidden border border-white/5 flex flex-col h-[360px] md:h-[420px] lg:h-[460px]">
          
          {/* Status Bar */}
          <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
            <div className={clsx(
              "px-3 py-1 rounded-full border backdrop-blur-md text-[10px] font-display font-bold tracking-widest uppercase flex items-center gap-2",
              status === 'playing' ? "border-primary/20 bg-primary/10 text-primary" : 
              status === 'error' ? "border-tertiary/20 bg-tertiary/10 text-tertiary" :
              "border-white/10 bg-black/40 text-gray-400"
            )}>
              <div className={clsx("w-2 h-2 rounded-full animate-pulse", 
                status === 'playing' ? "bg-primary shadow-[0_0_10px_#99f7ff]" : 
                status === 'error' ? "bg-tertiary shadow-[0_0_10px_#ff59e3]" : 
                "bg-gray-500"
              )}></div>
              {status}
            </div>
            
            {currentStrategy && (
              <div className="px-3 py-1 rounded-full border border-white/10 bg-black/40 backdrop-blur-md text-[10px] font-display font-bold tracking-widest uppercase text-gray-300">
                {currentStrategy}
              </div>
            )}
          </div>

          {/* Video Surface */}
          <div className="flex-1 relative bg-black">
              {isError && (
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                      <AlertTriangle className="w-12 h-12 text-tertiary mb-4 animate-bounce" />
                      <h3 className="text-xl font-display font-bold text-tertiary tracking-wide">SIGNAL LOST</h3>
                      <p className="text-sm text-gray-400 mt-2 font-mono">Check connection coordinates and retry.</p>
                      <button
                        onClick={() => {
                          void loadCurrent();
                        }}
                        className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-white transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" /> Re-establish Link
                      </button>
                  </div>
              )}
              
              <VideoSurface 
                ref={videoRef}
                muted={isMuted}
                autoPlay={false}
                onTimeUpdate={() => {}}
              />
          </div>

          {/* Controls Overlay */}
          <div className="h-16 bg-surface-low border-t border-white/5 flex items-center px-4 justify-between relative z-30">
             <div className="flex items-center gap-4">
                 <button onClick={() => { void togglePlay(); }} className="text-primary hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                     {status === 'playing' ? <Pause size={24} /> : <Play size={24} />}
                 </button>

                 <button onClick={() => { void loadPrevious(); }} className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                   <Rewind size={20} />
                 </button>

                 <button onClick={() => { void loadNext(); }} className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                   <FastForward size={20} />
                 </button>
                 
                 <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

                  <button onClick={toggleMute} className={clsx("transition-colors p-2 rounded-full", isMuted ? "text-gray-500" : "text-primary")}>
                    <Volume2 size={20} />
                 </button>
             </div>

             <div className="flex items-center gap-6">
                 {/* Bitrate Monitor */}
                 <div className="flex flex-col items-end">
                     <span className="text-[10px] text-gray-500 font-display uppercase tracking-widest">Bitrate</span>
                     <div className="flex items-center gap-2 text-xs font-mono text-primary">
                         <Activity size={12} />
                         <span>{analytics.estimatedBandwidthKbps} kbps</span>
                     </div>
                 </div>
                 
                 <button className="text-gray-400 hover:text-primary transition-colors">
                   <Captions size={20} />
                 </button>
                 <button className="text-gray-400 hover:text-primary transition-colors">
                     <Settings size={20} />
                 </button>
                 <button onClick={() => { void toggleFullscreen(); }} className="text-gray-400 hover:text-primary transition-colors">
                   {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                 </button>
             </div>
          </div>
        </div>

        {/* Right Col: Diagnostics & Logs */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Select */}
            <div className="bg-surface-low rounded-lg p-4 border border-white/5">
                <h3 className="text-xs font-display font-bold text-gray-500 uppercase tracking-widest mb-4">Quick Targets</h3>
                <div className="space-y-2">
                    {playlist.map((stream) => (
                      <button
                        key={stream.url}
                        onClick={() => {
                          void chooseStream(stream);
                        }}
                        className={clsx(
                          'w-full text-left px-3 py-2 text-xs font-medium rounded transition-all border truncate',
                          url === stream.url
                            ? 'text-primary border-primary/30 bg-primary/10'
                            : 'text-gray-300 hover:text-primary hover:bg-surface-container border-transparent hover:border-primary/20',
                        )}
                        >
                        {stream.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-surface-low rounded-lg p-4 border border-white/5 space-y-3">
              <h3 className="text-xs font-display font-bold text-gray-500 uppercase tracking-widest">Audio Tracks</h3>
              {audioTracks.length === 0 ? (
                <p className="text-xs text-gray-500">No alternate audio tracks detected.</p>
              ) : (
                <div className="space-y-2">
                  {audioTracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => chooseAudioTrack(track.id)}
                      className={clsx(
                        'w-full text-left px-3 py-2 text-xs rounded border transition-colors',
                        track.enabled ? 'border-primary/40 text-primary bg-primary/10' : 'border-white/10 text-gray-300 hover:border-primary/20',
                      )}
                    >
                      {track.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-surface-low rounded-lg p-4 border border-white/5 space-y-3">
              <h3 className="text-xs font-display font-bold text-gray-500 uppercase tracking-widest">Subtitle Tracks</h3>
              {subtitleTracks.length === 0 ? (
                <p className="text-xs text-gray-500">No subtitle tracks detected.</p>
              ) : (
                <div className="space-y-2">
                  {subtitleTracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => chooseSubtitleTrack(track.id)}
                      className={clsx(
                        'w-full text-left px-3 py-2 text-xs rounded border transition-colors',
                        track.enabled ? 'border-primary/40 text-primary bg-primary/10' : 'border-white/10 text-gray-300 hover:border-primary/20',
                      )}
                    >
                      {track.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Logs Terminal */}
            <div className="bg-surface-container rounded-lg border border-white/5 flex flex-col h-[300px] overflow-hidden">
                <div className="px-4 py-2 bg-surface-low border-b border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-display font-bold text-gray-500 uppercase tracking-widest">System Logs</span>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                    </div>
                </div>
                <div className="flex-1 p-4 font-mono text-[10px] space-y-2 overflow-y-auto custom-scrollbar">
                    {logs.length === 0 && <span className="text-gray-600 italic opacity-50">Waiting for input...</span>}
                    {logs.map((log) => (
                      <div key={`${log.time}-${log.msg}`} className={clsx("flex gap-2", 
                            log.type === 'error' ? "text-tertiary" : 
                            log.type === 'success' ? "text-primary" : 
                            log.type === 'warning' ? "text-yellow-400" :
                            "text-gray-400"
                        )}>
                            <span className="opacity-50">[{log.time}]</span>
                            <span>{log.msg}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-surface-low p-3 rounded border border-white/5">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Retries</div>
                    <div className="text-xl font-display font-bold text-white">{retries}</div>
                </div>
                <div className="bg-surface-low p-3 rounded border border-white/5">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Buffer</div>
                    <div className="text-xl font-display font-bold text-white">{analytics.bufferedSeconds}s</div>
                </div>
            </div>

            <div className="bg-surface-container rounded-lg border border-white/5 p-4 space-y-2">
              <h3 className="text-[10px] font-display font-bold text-gray-500 uppercase tracking-widest">Diagnostics</h3>
              <div className="text-xs text-gray-300">Type: {diagnostics?.mediaType ?? 'unknown'}</div>
              <div className="text-xs text-gray-300">CORS Risk: {diagnostics?.corsLikelyRequired ? 'high' : 'low'}</div>
              <div className="text-xs text-gray-300">Latency: {analytics.latencyMs} ms</div>
              <div className="text-xs text-gray-300">Strategy: {currentStrategy ?? 'none'}</div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default SmartPlayer;
