import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { TechGrid } from '../components/TechGrid';
import { ParticleField } from '../components/ParticleField';

export const Scene03Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring for logo & title
  const logoSpring = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.8 },
  });

  // Tagline spring
  const taglineSpring = spring({
    frame: Math.max(0, frame - 35),
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  // Badges entrance
  const badgesSpring = spring({
    frame: Math.max(0, frame - 65),
    fps,
    config: { damping: 18, stiffness: 110 },
  });

  // Conic rotation for glowing green beam
  const rotAngle = frame * 1.8;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0c0e0c', overflow: 'hidden' }}>
      <TechGrid opacity={0.4} glowColor="rgba(199, 243, 107, 0.2)" />
      <ParticleField count={40} color="rgba(199, 243, 107, 0.45)" speed={0.4} />

      {/* Center hero reveal */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `scale(${0.92 + logoSpring * 0.08})`,
        }}
      >
        {/* Glowing landing page green aura */}
        <div
          style={{
            position: 'absolute',
            width: 520,
            height: 260,
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse, rgba(199, 243, 107, 0.28) 0%, rgba(163, 230, 53, 0.16) 50%, transparent 75%)',
            filter: 'blur(55px)',
            pointerEvents: 'none',
          }}
        />

        {/* Category eyebrow */}
        <div
          style={{
            opacity: logoSpring,
            transform: `translateY(${(1 - logoSpring) * 15}px)`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 9999,
            background: 'rgba(32, 35, 31, 0.9)',
            border: '1px solid rgba(199, 243, 107, 0.35)',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 13,
            fontWeight: 700,
            color: '#c7f36b',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#c7f36b',
              boxShadow: '0 0 8px #c7f36b',
            }}
          />
          Introducing
        </div>

        {/* GitEx Logo + Wordmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            opacity: logoSpring,
            transform: `scale(${0.9 + logoSpring * 0.1})`,
            marginBottom: 16,
          }}
        >
          {/* Logo emblem */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #171916 0%, #20231f 100%)',
              border: '2px solid rgba(199, 243, 107, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 35px rgba(199, 243, 107, 0.45)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Inner glowing green beam */}
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
                borderRadius: 16,
                backgroundColor: '#111310',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
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

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <h1
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
                fontSize: 84,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: '#ffffff',
                margin: 0,
                lineHeight: 1,
              }}
            >
              GitEx
            </h1>
            <span
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.12em',
                padding: '4px 10px',
                borderRadius: 6,
                background: 'rgba(32, 35, 31, 0.8)',
                color: '#c7f36b',
                border: '1px solid rgba(199, 243, 107, 0.3)',
                textTransform: 'uppercase',
              }}
            >
              FIELD NOTEBOOK
            </span>
          </div>
        </div>

        {/* Tagline */}
        <h2
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
            fontSize: 44,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: '#f1f2ea',
            opacity: taglineSpring,
            transform: `translateY(${(1 - taglineSpring) * 15}px)`,
            margin: '0 0 32px 0',
            textAlign: 'center',
          }}
        >
          Every Repository, <span style={{ color: '#c7f36b' }}>Explained</span>.
        </h2>

        {/* 3 Capabilities Pills */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            opacity: badgesSpring,
            transform: `translateY(${(1 - badgesSpring) * 18}px)`,
          }}
        >
          <div
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              background: 'rgba(32, 35, 31, 0.85)',
              border: '1px solid rgba(199, 243, 107, 0.25)',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 13,
              color: '#f1f2ea',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ color: '#c7f36b' }}>⚡</span> Architecture Breakdown
          </div>

          <div
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              background: 'rgba(32, 35, 31, 0.85)',
              border: '1px solid rgba(199, 243, 107, 0.25)',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 13,
              color: '#f1f2ea',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ color: '#c7f36b' }}>🔍</span> Repomix Context Engine
          </div>

          <div
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              background: 'rgba(32, 35, 31, 0.85)',
              border: '1px solid rgba(199, 243, 107, 0.25)',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 13,
              color: '#f1f2ea',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ color: '#c7f36b' }}>📋</span> Zero to Running in Minutes
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
