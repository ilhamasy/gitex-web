import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { TechGrid } from '../components/TechGrid';
import { ParticleField } from '../components/ParticleField';

export const Scene01Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Part 1: "Every repository has a story." (Frames 0-110)
  const part1Spring = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 90, mass: 0.9 },
  });
  const part1Fade = interpolate(frame, [85, 110], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Part 2: "But understanding someone else's codebase can take hours." (Frames 95-240)
  const part2Progress = interpolate(frame, [100, 140], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Code drift background lines in green
  const codeLines = [
    'import { RepomixEngine } from "@core/repomix";',
    'interface CodebaseArchitecture { layers: ModuleLayer[]; }',
    'const context = await parseAST(sourceTree);',
    'export async function analyzeDependencies(graph: DepGraph) {',
    '  const resolved = await resolveModuleGraph(graph.root);',
    '  return computeDependencyTensors(resolved);',
    '}',
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: '#0c0e0c', overflow: 'hidden' }}>
      <TechGrid opacity={0.35} glowColor="rgba(199, 243, 107, 0.16)" />
      <ParticleField count={30} color="rgba(199, 243, 107, 0.4)" />

      {/* 3D Tilted floating code background */}
      <div
        style={{
          position: 'absolute',
          right: '5%',
          top: '15%',
          width: '580px',
          opacity: 0.18 + Math.sin(frame * 0.03) * 0.05,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 14,
          lineHeight: '26px',
          color: '#c7f36b',
          transform: `perspective(1000px) rotateY(-18deg) rotateX(10deg) translateY(${frame * -0.5}px)`,
          filter: 'blur(0.5px)',
          userSelect: 'none',
        }}
      >
        {codeLines.map((line, idx) => (
          <div key={idx} style={{ opacity: 1 - idx * 0.12 }}>
            <span style={{ color: '#4d554a', marginRight: 14 }}>{idx + 1}</span>
            {line}
          </div>
        ))}
      </div>

      {/* Center typography: Part 1 */}
      {frame < 115 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: part1Spring * part1Fade,
            transform: `scale(${0.92 + part1Spring * 0.08})`,
          }}
        >
          <div
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.24em',
              color: '#c7f36b',
              textTransform: 'uppercase',
              marginBottom: 18,
            }}
          >
            The Developer Reality
          </div>
          <h1
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: '#f8fafc',
              textAlign: 'center',
              maxWidth: 900,
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            Every repository has a <span style={{ color: '#c7f36b' }}>story</span>.
          </h1>
        </div>
      )}

      {/* Center typography: Part 2 */}
      {frame >= 95 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: part2Progress,
            transform: `scale(${0.95 + part2Progress * 0.05}) translateY(${(1 - part2Progress) * 20}px)`,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 9999,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 13,
              fontWeight: 600,
              color: '#f87171',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
            Time Lost In Context
          </div>

          <h2
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
              fontSize: 56,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: '#f1f5f9',
              textAlign: 'center',
              maxWidth: 980,
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Understanding someone else's codebase{' '}
            <span
              style={{
                color: '#f87171',
                textDecoration: 'underline',
                textDecorationColor: 'rgba(239, 68, 68, 0.4)',
                textUnderlineOffset: 8,
              }}
            >
              can take hours
            </span>
            .
          </h2>

          <div
            style={{
              marginTop: 36,
              display: 'flex',
              gap: 16,
              fontFamily: 'ui-monospace, monospace',
              fontSize: 14,
              color: '#94a3b8',
            }}
          >
            <div
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                background: 'rgba(32, 35, 31, 0.8)',
                border: '1px solid rgba(199, 243, 107, 0.15)',
              }}
            >
              ⏱️ Average ramp-up: 4.5 hrs
            </div>
            <div
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                background: 'rgba(32, 35, 31, 0.8)',
                border: '1px solid rgba(199, 243, 107, 0.15)',
              }}
            >
              📁 Untangling 100+ files
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
