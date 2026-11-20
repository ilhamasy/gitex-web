import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PageCam, CamKey } from '../components/PageCam';
import { Caption } from '../components/Caption';

export const Scene06TheResult: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Dynamic 2.5D Camera Keyframes scrolling smoothly down the real analysis page
  const camKeys: CamKey[] = [
    // Sub-shot 1: Architecture Overview
    { frame: 0, cx: 960, cy: 320, zoom: 1.05, rotX: 8, rotY: -2, persp: 1200 },
    { frame: 105, cx: 960, cy: 460, zoom: 1.12, rotX: 5, rotY: 0, persp: 1200 },

    // Sub-shot 2: Prerequisites
    { frame: 210, cx: 960, cy: 580, zoom: 1.15, rotX: 6, rotY: 1, persp: 1200 },

    // Sub-shot 3: Installation Commands
    { frame: 315, cx: 960, cy: 720, zoom: 1.18, rotX: 4, rotY: -1, persp: 1200 },

    // Sub-shot 4: Full Technical Guide summary
    { frame: 420, cx: 960, cy: 850, zoom: 1.08, rotX: 0, rotY: 0, persp: 1200 },
  ];

  // Active feature badge based on frame window with GitEx green accents
  let activeCard = {
    title: 'Architecture Breakdown',
    desc: 'Component flow, layers, and system data flows mapped',
    icon: '🏛️',
    color: '#c7f36b',
  };

  if (frame >= 105 && frame < 210) {
    activeCard = {
      title: 'Prerequisites & Environment',
      desc: 'Runtime versions, system tools, and API tokens identified',
      icon: '⚙️',
      color: '#c7f36b',
    };
  } else if (frame >= 210 && frame < 315) {
    activeCard = {
      title: 'Installation Commands',
      desc: 'Tested, copy-ready setup commands with dependency resolution',
      icon: '💻',
      color: '#c7f36b',
    };
  } else if (frame >= 315) {
    activeCard = {
      title: 'Usage Guide & Execution',
      desc: 'Quickstart tutorials, code examples, and configuration tips',
      icon: '🚀',
      color: '#c7f36b',
    };
  }

  // Floating highlight badge spring
  const badgeSpring = spring({
    frame: frame % 105,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0c0e0c', overflow: 'hidden' }}>
      {/* 2.5D PageCam over real analysis screenshot */}
      <PageCam src="images/03-analysis-deepseek.png" pageH={1400} keys={camKeys} />

      {/* Floating Glass Showcase Pill overlay */}
      <div
        style={{
          position: 'absolute',
          top: 50,
          right: 60,
          width: 380,
          padding: '20px 24px',
          borderRadius: 20,
          background: 'rgba(23, 26, 22, 0.94)',
          backdropFilter: 'blur(20px)',
          border: `1.5px solid rgba(199, 243, 107, 0.45)`,
          boxShadow: `0 20px 50px rgba(0, 0, 0, 0.6), 0 0 25px rgba(199, 243, 107, 0.25)`,
          opacity: badgeSpring,
          transform: `translateY(${(1 - badgeSpring) * 15}px)`,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 24 }}>{activeCard.icon}</span>
          <div
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
              fontSize: 18,
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            {activeCard.title}
          </div>
        </div>
        <div
          style={{
            fontFamily: '-apple-system, Inter, sans-serif',
            fontSize: 13,
            color: '#a8aea2',
            lineHeight: '18px',
          }}
        >
          {activeCard.desc}
        </div>
      </div>

      {/* Bottom context caption */}
      <Caption
        text="Everything transformed into a clean, searchable, interactive guide"
        duration={420}
        badge="Unified Results"
        accent="#c7f36b"
      />
    </AbsoluteFill>
  );
};
