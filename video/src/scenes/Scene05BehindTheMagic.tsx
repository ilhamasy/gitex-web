import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { TechGrid } from '../components/TechGrid';
import { ParticleField } from '../components/ParticleField';
import { Caption } from '../components/Caption';

export const Scene05BehindTheMagic: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Modal entrance
  const modalSpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 100 },
  });

  const stages = [
    {
      num: 1,
      title: 'Validating repository & provider',
      desc: 'Verify public status, access limits, and Git provider endpoints',
      start: 15,
      done: 50,
    },
    {
      num: 2,
      title: 'Fetching metadata, tree & README',
      desc: 'Recursively parse branch tree, license, tags, and documentation',
      start: 50,
      done: 105,
    },
    {
      num: 3,
      title: 'Processing code context with Repomix',
      desc: 'Compress and pack code AST context for deep token efficiency',
      start: 105,
      done: 165,
    },
    {
      num: 4,
      title: 'Analyzing architecture & dependencies',
      desc: 'Extract entrypoints, core runtime layers, and package relations',
      start: 165,
      done: 225,
    },
    {
      num: 5,
      title: 'Generating technical guide',
      desc: 'Synthesize architecture breakdown, prerequisites, install & usage',
      start: 225,
      done: 330,
    },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: '#0c0e0c', overflow: 'hidden' }}>
      <TechGrid opacity={0.4} glowColor="rgba(199, 243, 107, 0.18)" />
      <ParticleField count={30} color="rgba(199, 243, 107, 0.4)" speed={0.5} />

      {/* Main Glass Pipeline Card */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: modalSpring,
          transform: `scale(${0.94 + modalSpring * 0.06})`,
        }}
      >
        <div
          style={{
            width: 820,
            background: 'rgba(23, 26, 22, 0.94)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(199, 243, 107, 0.25)',
            borderRadius: 24,
            padding: '36px 40px',
            boxShadow:
              '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(199, 243, 107, 0.15)',
            position: 'relative',
          }}
        >
          {/* Card Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: 22,
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: 24,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span>Analyzing Repository</span>
                <span
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: 'rgba(199, 243, 107, 0.15)',
                    color: '#c7f36b',
                    border: '1px solid rgba(199, 243, 107, 0.3)',
                  }}
                >
                  deepseek-ai/chat-demo
                </span>
              </div>
            </div>

            <div
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 12,
                color: '#a8aea2',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#c7f36b',
                  boxShadow: '0 0 10px #c7f36b',
                }}
              />
              AUTONOMOUS PIPELINE
            </div>
          </div>

          {/* Stepper list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {stages.map((stage) => {
              const isPast = frame >= stage.done;
              const isActive = frame >= stage.start && frame < stage.done;

              let iconBg = 'rgba(255, 255, 255, 0.05)';
              let iconBorder = 'rgba(255, 255, 255, 0.12)';
              let textColor = '#686d63';
              let titleColor = '#a8aea2';

              if (isPast) {
                iconBg = 'rgba(199, 243, 107, 0.2)';
                iconBorder = '#c7f36b';
                textColor = '#c7f36b';
                titleColor = '#f8fafc';
              } else if (isActive) {
                iconBg = 'rgba(199, 243, 107, 0.28)';
                iconBorder = '#c7f36b';
                textColor = '#c7f36b';
                titleColor = '#ffffff';
              }

              return (
                <div
                  key={stage.num}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 18,
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: isActive ? 'rgba(199, 243, 107, 0.08)' : 'transparent',
                    border: isActive
                      ? '1px solid rgba(199, 243, 107, 0.3)'
                      : '1px solid transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Step circle */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: iconBg,
                      border: `1.5px solid ${iconBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 13,
                      fontWeight: 700,
                      color: textColor,
                      boxShadow: isActive ? '0 0 14px rgba(199, 243, 107, 0.6)' : 'none',
                    }}
                  >
                    {isPast ? '✓' : stage.num}
                  </div>

                  {/* Step text */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: '-apple-system, Inter, sans-serif',
                        fontSize: 16,
                        fontWeight: 600,
                        color: titleColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      {stage.title}
                      {isActive && (
                        <span
                          style={{
                            fontFamily: 'ui-monospace, monospace',
                            fontSize: 11,
                            color: '#c7f36b',
                            fontWeight: 700,
                          }}
                        >
                          [PROCESSING...]
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontFamily: '-apple-system, Inter, sans-serif',
                        fontSize: 13,
                        color: '#686d63',
                        marginTop: 2,
                      }}
                    >
                      {stage.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Caption at bottom */}
      <Caption
        text="Repomix packing · AST parsing · Multi-stage architecture analysis"
        duration={330}
        badge="Engine Core"
        accent="#c7f36b"
      />
    </AbsoluteFill>
  );
};
