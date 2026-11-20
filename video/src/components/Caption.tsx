import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export const Caption: React.FC<{
  text: string;
  duration: number;
  badge?: string;
  accent?: string;
}> = ({
  text,
  duration,
  badge,
  accent = '#c7f36b', // GitEx landing page citrus accent
}) => {
  const frame = useCurrentFrame();
  const inT = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const outT = interpolate(frame, [duration - 10, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 56,
        left: '50%',
        transform: `translate(-50%, ${(1 - inT) * 12}px)`,
        opacity: inT * outT,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 22px',
        background: 'rgba(23, 26, 22, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(199, 243, 107, 0.25)',
        borderRadius: 9999,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7), 0 0 16px rgba(199, 243, 107, 0.15)',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: accent,
          boxShadow: `0 0 10px ${accent}`,
          display: 'inline-block',
        }}
      />
      {badge && (
        <span
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: accent,
            textTransform: 'uppercase',
            paddingRight: 6,
            borderRight: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          {badge}
        </span>
      )}
      <span
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
          fontSize: 15,
          fontWeight: 500,
          letterSpacing: '0.03em',
          color: '#f1f5f9',
        }}
      >
        {text}
      </span>
    </div>
  );
};
