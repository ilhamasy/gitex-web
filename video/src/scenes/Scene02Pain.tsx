import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { TechGrid } from '../components/TechGrid';
import { ParticleField } from '../components/ParticleField';

export const Scene02Pain: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Staggered card entries
  const card1Spring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  const card2Spring = spring({
    frame: Math.max(0, frame - 45),
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  const card3Spring = spring({
    frame: Math.max(0, frame - 80),
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  // Climax question: "Where do you even begin?" (frame >= 140)
  const questionSpring = spring({
    frame: Math.max(0, frame - 145),
    fps,
    config: { damping: 14, stiffness: 140 },
  });

  const cardsDim = interpolate(frame, [140, 175], [1, 0.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0c0e0c', overflow: 'hidden' }}>
      <TechGrid opacity={0.4} glowColor="rgba(239, 68, 68, 0.12)" />
      <ParticleField count={25} color="rgba(248, 113, 113, 0.3)" />

      {/* 3 Pain Cards */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 28,
          opacity: cardsDim,
          transform: `scale(${interpolate(frame, [0, 200], [0.98, 1.02])})`,
        }}
      >
        {/* Card 1: Hundreds of files */}
        <div
          style={{
            width: 320,
            padding: '24px 22px',
            background: 'rgba(32, 35, 31, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
            opacity: card1Spring,
            transform: `translateY(${(1 - card1Spring) * 35}px) rotate(-2deg)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 22 }}>📁</span>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: '#a8aea2' }}>
              FILESYSTEM CHAOS
            </div>
          </div>
          <div
            style={{
              fontFamily: '-apple-system, Inter, sans-serif',
              fontSize: 24,
              fontWeight: 700,
              color: '#f8fafc',
              marginBottom: 12,
            }}
          >
            Hundreds of Files
          </div>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 12,
              color: '#686d63',
              lineHeight: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              paddingTop: 12,
            }}
          >
            <div>├── src/core/engine (42 files)</div>
            <div>├── lib/adapters (18 files)</div>
            <div>├── utils/parsers (31 files)</div>
            <div style={{ color: '#ef4444' }}>└── 84 unmapped modules...</div>
          </div>
        </div>

        {/* Card 2: Complex dependencies */}
        <div
          style={{
            width: 320,
            padding: '24px 22px',
            background: 'rgba(32, 35, 31, 0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
            opacity: card2Spring,
            transform: `translateY(${(1 - card2Spring) * 35}px) scale(1.04)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 22 }}>🕸️</span>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: '#e6b15e' }}>
              DEPENDENCY WEB
            </div>
          </div>
          <div
            style={{
              fontFamily: '-apple-system, Inter, sans-serif',
              fontSize: 24,
              fontWeight: 700,
              color: '#f8fafc',
              marginBottom: 12,
            }}
          >
            Complex Graph
          </div>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 12,
              color: '#686d63',
              lineHeight: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              paddingTop: 12,
            }}
          >
            <div>⚡ 48 direct dependencies</div>
            <div>⚠️ 3 circular reference warnings</div>
            <div style={{ color: '#e6b15e' }}>📦 1,290 nested transitive pkgs</div>
          </div>
        </div>

        {/* Card 3: Endless documentation */}
        <div
          style={{
            width: 320,
            padding: '24px 22px',
            background: 'rgba(32, 35, 31, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
            opacity: card3Spring,
            transform: `translateY(${(1 - card3Spring) * 35}px) rotate(2deg)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 22 }}>📄</span>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: '#a8aea2' }}>
              DOCS OVERLOAD
            </div>
          </div>
          <div
            style={{
              fontFamily: '-apple-system, Inter, sans-serif',
              fontSize: 24,
              fontWeight: 700,
              color: '#f8fafc',
              marginBottom: 12,
            }}
          >
            Endless Docs
          </div>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 12,
              color: '#686d63',
              lineHeight: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              paddingTop: 12,
            }}
          >
            <div>📜 14,000-word README</div>
            <div>❌ Outdated setup steps</div>
            <div style={{ color: '#ef4444' }}>❓ Missing environment vars</div>
          </div>
        </div>
      </div>

      {/* Climax question center stage */}
      {frame >= 140 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: questionSpring,
            transform: `scale(${0.9 + questionSpring * 0.1})`,
          }}
        >
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '0.2em',
              color: '#f87171',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            The Critical Question
          </div>
          <h2
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: '#ffffff',
              textAlign: 'center',
              textShadow: '0 0 40px rgba(239, 68, 68, 0.4)',
              margin: 0,
            }}
          >
            Where do you even begin?
          </h2>
        </div>
      )}
    </AbsoluteFill>
  );
};
