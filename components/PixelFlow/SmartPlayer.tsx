'use client';

import { type ReactElement, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePlayerSession } from './hooks/usePlayerSession';
import type { StreamOption } from './types';
import { detectMediaType } from './utils/mediaType';
import { buildPlaylistFromIntake, parseIntake, type IntakeState } from './utils/playlistInput';
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

const SmartPlayer = (): ReactElement => {
  const [intake, setIntake] = useState<IntakeState>(DEFAULT_INTAKE);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>({
    playlist: [],
    initialUrl: '',
    subtitleUrl: '',
  });

  const {
    audioTracks,
    chooseAudioTrack,
    chooseStream,
    chooseSubtitleTrack,
    currentStrategy,
    diagnostics,
    analysisMessage,
    analysisSeverity,
    analysisDecision,
    currentFormat,
    supportedFormats,
    isFullscreen,
    isMuted,
    loadCurrent,
    loadNext,
    loadPrevious,
    playlist,
    playerShellRef,
    status,
    subtitleTracks,
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

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <SessionIntakePanel
        intake={intake}
        currentFormat={currentFormat === 'unknown' ? detectedFormat : currentFormat}
        supportedFormats={supportedFormats}
        onChange={updateIntake}
        onApply={applySession}
        canApply={canApplySession}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <PlaybackPanel
            playerShellRef={playerShellRef}
            videoRef={videoRef}
            status={status}
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
        <Link
          href="/analytics"
          className="pf-btn-primary w-fit"
        >
          Open Analytics
        </Link>
      </section>
    </div>
  );
};

export default SmartPlayer;
