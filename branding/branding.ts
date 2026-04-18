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
  shortDescription: 'Smart link playback for TeraBox and Pixeldrain.',
  description: 'Paste your share URL. PixelFlow resolves it to a playable stream when available and shows clear source status when authentication is required.',
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
