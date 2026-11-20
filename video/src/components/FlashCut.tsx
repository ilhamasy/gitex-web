import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const FlashCut: React.FC<{ duration?: number; color?: string }> = ({
  duration = 12,
  color = 'rgba(199, 243, 107, 0.45)',
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, duration * 0.3, duration],
    [0, 0.75, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        opacity,
        background: `radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.95), ${color} 45%, transparent 75%)`,
      }}
    />
  );
};
