import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { TechGrid } from '../components/TechGrid';
import { ParticleField } from '../components/ParticleField';

export const Scene07Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Part 1 typography (frames 0-80)
  const part1Spring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 100 },
  });
  const part1Fade = interpolate(frame, [65, 80], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Part 2 Final Lockup (frames 80-240)
  const finalSpring = spring({
    frame: Math.max(0, frame - 80),
    fps,
    config: { damping: 14, stiffness: 90, mass: 0.9 },
  });

  const ctaSpring = spring({
    frame: Math.max(0, frame - 110),
    fps,
    config: { damping: 16, stiffness: 110 },
  });

  const rotAngle = (frame - 80) * 2;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0c0e0c', overflow: 'hidden' }}>
      <TechGrid opacity={0.45} glowColor="rgba(199, 243, 107, 0.22)" />
      <ParticleField count={45} color="rgba(199, 243, 107, 0.45)" speed={0.3} />

      {/* Part 1: Less time exploring. More time building. */}
      {frame < 85 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
            opacity: part1Spring * part1Fade,
            transform: `scale(${0.94 + part1Spring * 0.06})`,
          }}
        >
          <h2
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
              fontSize: 54,
              fontWeight: 600,
              letterSpacing: '-0.03em',
              color: '#a8aea2',
              margin: 0,
            }}
          >
            Less time exploring.
          </h2>
          <h1
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: '#ffffff',
              margin: 0,
            }}
          >
            More time <span style={{ color: '#c7f36b' }}>building</span>.
          </h1>
        </div>
      )}

      {/* Part 2: Final Hero Brand Lockup & Call To Action */}
      {frame >= 75 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: finalSpring,
            transform: `scale(${0.92 + finalSpring * 0.08})`,
          }}
        >
          {/* Glowing central green halo */}
          <div
            style={{
              position: 'absolute',
              width: 620,
              height: 320,
              borderRadius: '50%',
              background:
                'radial-gradient(ellipse, rgba(199, 243, 107, 0.28) 0%, rgba(163, 230, 53, 0.16) 50%, transparent 75%)',
              filter: 'blur(60px)',
              pointerEvents: 'none',
            }}
          />

          {/* Logo emblem */}
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 24,
              background: 'linear-gradient(135deg, #171916 0%, #20231f 100%)',
              border: '2px solid rgba(199, 243, 107, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 45px rgba(199, 243, 107, 0.45)',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: 20,
            }}
          >
            {/* Spinning green beam */}
            <div
              style={{
                position: 'absolute',
                inset: -20,
                background: `conic-gradient(from ${rotAngle}deg, transparent 0%, rgba(199, 243, 107, 0.7) 25%, transparent 50%, rgba(163, 230, 53, 0.7) 75%, transparent 100%)`,
                opacity: 0.85,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 3,
                borderRadius: 20,
                backgroundColor: '#111310',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="#c7f36b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="#c7f36b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="#c7f36b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* GitEx Wordmark */}
          <h1
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
              fontSize: 78,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: '#ffffff',
              margin: '0 0 8px 0',
              lineHeight: 1,
            }}
          >
            GitEx
          </h1>

          {/* Tagline */}
          <h2
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
              fontSize: 34,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: '#f1f2ea',
              margin: '0 0 32px 0',
            }}
          >
            Every Repository, <span style={{ color: '#c7f36b' }}>Explained</span>.
          </h2>

          {/* CTA Box */}
          <div
            style={{
              opacity: ctaSpring,
              transform: `translateY(${(1 - ctaSpring) * 15}px)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 34px',
                borderRadius: 9999,
                backgroundColor: '#c7f36b',
                color: '#171916',
                fontFamily: '-apple-system, Inter, sans-serif',
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                boxShadow: '0 0 35px rgba(199, 243, 107, 0.5)',
              }}
            >
              <span>Explore GitEx Today</span>
              <span>→</span>
            </div>

            <div
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 14,
                color: '#a8aea2',
                display: 'flex',
                gap: 16,
              }}
            >
              <span>🌐 http://localhost:3001</span>
              <span>•</span>
              <span>Open Source Developer Tool</span>
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
