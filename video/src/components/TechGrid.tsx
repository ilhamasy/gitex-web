import React from 'react';
import { AbsoluteFill } from 'remotion';

export const TechGrid: React.FC<{
  opacity?: number;
  glowColor?: string;
  gridSize?: number;
}> = ({
  opacity = 0.35,
  glowColor = 'rgba(199, 243, 107, 0.14)',
  gridSize = 48,
}) => {
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#0c0e0c' }}>
      {/* Subtle digital grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: -20,
          backgroundImage: `
            linear-gradient(to right, rgba(199, 243, 107, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(199, 243, 107, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          opacity,
          pointerEvents: 'none',
        }}
      />

      {/* Landing page green lighting gradients */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '20%',
          width: '60%',
          height: '60%',
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '15%',
          width: '50%',
          height: '50%',
          background: 'radial-gradient(circle, rgba(163, 230, 53, 0.1) 0%, transparent 70%)',
          filter: 'blur(75px)',
          pointerEvents: 'none',
        }}
      />

      {/* Vignette border */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 35%, rgba(12, 14, 12, 0.92) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
