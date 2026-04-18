import { ImageResponse } from 'next/og';
import { BRANDING } from '@/lib/branding/branding';

export const size = {
  width: 64,
  height: 64,
};

export const contentType = 'image/png';

const Icon = () => {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 14,
          background: `linear-gradient(145deg, ${BRANDING.logo.dark} 0%, #101417 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: BRANDING.logo.accent,
          }}
        />
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: BRANDING.logo.primary,
            letterSpacing: -1,
          }}
        >
          PF
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
};

export default Icon;
