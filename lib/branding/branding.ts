export type BrandPlatform = 'terabox' | 'pixeldrain';

type BrandConfig = {
  name: string;
  productLabel: string;
  tagline: string;
  description: string;
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
  productLabel: 'Link Intelligence',
  tagline: 'Smooth playback for TeraBox and Pixeldrain links.',
  description: 'Paste your share URL. PixelFlow resolves it to a playable stream when available and shows clear source status when authentication is required.',
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
