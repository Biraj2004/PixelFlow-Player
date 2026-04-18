'use client';

import { type ReactElement, useCallback, useMemo, useState } from 'react';
import { usePlayerSession } from './hooks/usePlayerSession';
import type { StreamOption } from './types';
import { detectMediaType } from './utils/mediaType';
import { buildPlaylistFromIntake, parseIntake, type IntakeState } from './utils/playlistInput';
import AnalyticsDashboard from './AnalyticsDashboard';
import PlaybackPanel from './panels/PlaybackPanel';
import SessionIntakePanel from './panels/SessionIntakePanel';
import SidebarPanel from './panels/SidebarPanel';

type SessionConfig = {
  playlist: StreamOption[];
  initialUrl: string;
  subtitleUrl: string;
};

const DEFAULT_INTAKE: IntakeState = {
  sourceInput: '',
};

const EMPTY_SESSION: SessionConfig = {
  playlist: [],
  initialUrl: '',
  subtitleUrl: '',
};

const SmartPlayer = (): ReactElement => {
  const [intake, setIntake] = useState<IntakeState>(DEFAULT_INTAKE);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>(EMPTY_SESSION);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const {
    audioTracks,
    chooseAudioTrack,
    chooseStream,
    chooseSubtitleTrack,
    currentStrategy,
    diagnostics,
    analysisMessage,
    audioSupportNotice,
    analysisSeverity,
    analysisDecision,
    sourceStatusLabel,
    sourceStatusTone,
    currentFormat,
    supportedFormats,
    isFullscreen,
    isActivelyPlaying,
    isMuted,
    loadCurrent,
    loadNext,
    loadPrevious,
    playlist,
    playerShellRef,
    status,
    subtitleTracks,
    setUrl,
    toggleMute,
    toggleFullscreen,
    togglePlay,
    url,
    videoRef,
    hasActiveSource,
  } = usePlayerSession({
    playlist: sessionConfig.playlist,
    initialUrl: sessionConfig.initialUrl,
    externalSubtitleUrl: sessionConfig.subtitleUrl,
  });

  const detectedFormat = useMemo(() => {
    const parsedSources = parseIntake(intake.sourceInput).mediaUrls;
    const first = parsedSources[0] ?? '';
    return detectMediaType(first);
  }, [intake.sourceInput]);

  const canApplySession = useMemo(() => parseIntake(intake.sourceInput).mediaUrls.length > 0, [intake.sourceInput]);

  const updateIntake = (field: keyof IntakeState, value: string): void => {
    setIntake((prev) => ({ ...prev, [field]: value }));
  };

  const applySession = (): void => {
    const { subtitleUrl } = parseIntake(intake.sourceInput);
    const computedPlaylist = buildPlaylistFromIntake(intake);
    if (computedPlaylist.length === 0) {
      return;
    }

    const initialUrl = computedPlaylist[0]?.url || '';

    setSessionConfig({
      playlist: computedPlaylist,
      initialUrl,
      subtitleUrl,
    });
  };

  const clearSessionInput = useCallback((): void => {
    setIntake(DEFAULT_INTAKE);
    setSessionConfig(EMPTY_SESSION);
    setUrl('');

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  }, [setUrl, videoRef]);

  const canClearSession = intake.sourceInput.trim().length > 0 || sessionConfig.initialUrl.trim().length > 0;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <SessionIntakePanel
        intake={intake}
        currentFormat={currentFormat === 'unknown' ? detectedFormat : currentFormat}
        supportedFormats={supportedFormats}
        sourceStatusLabel={sourceStatusLabel}
        sourceStatusTone={sourceStatusTone}
        audioSupportNotice={audioSupportNotice}
        onChange={updateIntake}
        onApply={applySession}
        onClear={clearSessionInput}
        canApply={canApplySession}
        canClear={canClearSession}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <PlaybackPanel
            playerShellRef={playerShellRef}
            videoRef={videoRef}
            status={status}
            isActivelyPlaying={isActivelyPlaying}
            currentStrategy={currentStrategy}
            isMuted={isMuted}
            isFullscreen={isFullscreen}
            onReload={loadCurrent}
            onTogglePlay={togglePlay}
            onPrevious={loadPrevious}
            onNext={loadNext}
            onToggleMute={toggleMute}
            onToggleFullscreen={toggleFullscreen}
            hasActiveSource={hasActiveSource}
          />
        </div>

        <div className="lg:col-span-4">
          <SidebarPanel
            playlist={playlist}
            url={url}
            diagnostics={diagnostics}
            audioTracks={audioTracks}
            subtitleTracks={subtitleTracks}
            showPlaylist={playlist.length > 1}
            currentFormat={currentFormat}
            analysisDecision={analysisDecision}
            analysisSeverity={analysisSeverity}
            analysisMessage={analysisMessage}
            onChooseStream={chooseStream}
            onChooseAudio={chooseAudioTrack}
            onChooseSubtitle={chooseSubtitleTrack}
          />
        </div>
      </div>

      <section className="pf-panel bg-surface-low/60 px-4 py-3 md:px-5 md:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="pf-body">
          Need deeper playback logs, retries, and session diagnostics?
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAnalytics((value) => !value);
          }}
          className="pf-btn-primary w-fit"
        >
          {showAnalytics ? 'Hide Analytics' : 'Open Analytics'}
        </button>
      </section>

      {showAnalytics ? <AnalyticsDashboard /> : null}
    </div>
  );
};

export default SmartPlayer;
