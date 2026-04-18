import type { StreamOption } from '../components/types';
import { detectMediaType } from './mediaType';

export type IntakeState = {
  sourceInput: string;
};

export type ParsedIntake = {
  mediaUrls: string[];
  subtitleUrl: string;
};

const clean = (value: string): string => value.trim();

export const parsePlaylistRaw = (sourceInput: string): string[] => {
  const raw = clean(sourceInput);
  if (!raw) {
    return [];
  }

  // Accept one URL, newline-separated URLs, or combined delimiters like comma/semicolon/space.
  const extractedMatches = raw.match(/https?:\/\/[^\s,;]+/g) ?? [];

  const normalized = (extractedMatches.length > 0 ? extractedMatches : raw.split(/[\n,;\s]+/g))
    .map(clean)
    .filter(Boolean)
    .map((value) => value.replace(/[),.;]+$/g, ''));

  return Array.from(new Set(normalized));
};

const isSubtitleUrl = (value: string): boolean => {
  const normalized = value.split('?')[0]?.toLowerCase() ?? '';
  return normalized.endsWith('.vtt') || normalized.endsWith('.srt');
};

export const parseIntake = (sourceInput: string): ParsedIntake => {
  const urls = parsePlaylistRaw(sourceInput);
  const subtitleCandidate = urls.find(isSubtitleUrl) ?? '';
  const mediaUrls = urls.filter((url) => !isSubtitleUrl(url));

  return {
    mediaUrls,
    subtitleUrl: subtitleCandidate,
  };
};

export const buildPlaylistFromIntake = (intake: IntakeState): StreamOption[] => {
  const { mediaUrls: urls } = parseIntake(intake.sourceInput);

  return Array.from(new Set(urls)).map((url, index) => {
    const mediaType = detectMediaType(url);

    return {
      name: `Source ${index + 1} (${mediaType.toUpperCase()})`,
      url,
    };
  });
};
