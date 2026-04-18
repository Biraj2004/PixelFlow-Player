export type BrandPlatform = 'terabox' | 'pixeldrain';

type BrandConfig = {
  name: string;
  pageTitle: string;
  productLabel: string;
  tagline: string;
  shortDescription: string;
  description: string;
  ctaLabel: string;
  projectUrl: string;
  logo: {
    primary: string;
    accent: string;
    neutral: string;
    dark: string;
  };
  platforms: Record<BrandPlatform, { label: string; short: string }>;
};

export const BRANDING: BrandConfig = {
  name: 'PixelFlow',
  pageTitle: 'PixelFlow Player',
  productLabel: 'Link Intelligent Player',
  tagline: 'Smooth playback for Links.',
  shortDescription: 'Play any streamable link with TeraBox (best-effort) and Pixeldrain support.',
  description: 'Paste a streamable URL. PixelFlow plays broadly compatible links and includes dedicated support for Pixeldrain and TeraBox (best-effort, may fail on protected sources), with clear source status feedback.',
  ctaLabel: 'Link Play',
  projectUrl: 'https://github.com/Biraj2004/PixelFlow-Player',
  logo: {
    primary: '#99f7ff',
    accent: '#ff59e3',
    neutral: '#f8f9fe',
    dark: '#0b0e11',
  },
  platforms: {
    terabox: {
      label: 'TeraBox Support',
      short: 'TB',
    },
    pixeldrain: {
      label: 'Pixeldrain Support',
      short: 'PD',
    },
  },
};

export const getBrandHeadline = (): string => BRANDING.tagline;

export const getBrandEyebrow = (): string => `${BRANDING.name} ${BRANDING.productLabel}`;

export const getPlatformPill = (platform: BrandPlatform): string => BRANDING.platforms[platform].label;

export const getPrimaryCtaLabel = (): string => BRANDING.ctaLabel;

export const getProjectCtaLabel = (): string => 'View Project';
