import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PageCam, CamKey } from '../components/PageCam';
import { Caption } from '../components/Caption';

export const Scene04HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // PageCam pan keys over real GitEx dashboard screenshot
  const camKeys: CamKey[] = [
    { frame: 0, cx: 960, cy: 380, zoom: 0.95, rotX: 10, rotY: -3, persp: 1200 },
    { frame: 120, cx: 960, cy: 400, zoom: 1.05, rotX: 5, rotY: 0, persp: 1200 },
    { frame: 270, cx: 960, cy: 430, zoom: 1.15, rotX: 0, rotY: 0, persp: 1200 },
  ];

  // URL typing simulation
  const targetUrl = 'https://github.com/deepseek-ai/chat-demo';
  const typingStart = 30;
  const charsCount = Math.min(
    targetUrl.length,
    Math.max(0, Math.floor((frame - typingStart) * 0.95))
  );
  const typedText = targetUrl.substring(0, charsCount);

  // Button click trigger at frame 170
  const isClicked = frame >= 170;
  const clickRipple = spring({
    frame: Math.max(0, frame - 170),
    fps,
    config: { damping: 12, stiffness: 200 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0c0e0c', overflow: 'hidden' }}>
      {/* 2.5D Page Background */}
      <PageCam src="images/02-app-dashboard.png" pageH={1080} keys={camKeys}>
        {/* Floating animated URL Input Overlay matching real GitEx layout */}
        <div
          style={{
            position: 'absolute',
            left: 480,
            top: 340,
            width: 960,
            padding: '8px',
            borderRadius: 16,
            background: 'rgba(23, 26, 22, 0.94)',
            backdropFilter: 'blur(20px)',
            border: isClicked
              ? '2px solid #c7f36b'
              : '2px solid rgba(199, 243, 107, 0.45)',
            boxShadow: isClicked
              ? '0 0 35px rgba(199, 243, 107, 0.55)'
              : '0 0 25px rgba(199, 243, 107, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            transition: 'all 0.2s ease',
          }}
        >
          {/* URL text display */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 18,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              fontSize: 18,
              color: '#f8fafc',
            }}
          >
            <span>{typedText}</span>
            {frame < 170 && frame % 16 < 8 && (
              <span style={{ color: '#c7f36b', fontWeight: 'bold' }}>|</span>
            )}
          </div>

          {/* Provider Badge */}
          {charsCount > 18 && (
            <div
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                background: 'rgba(199, 243, 107, 0.18)',
                border: '1px solid rgba(199, 243, 107, 0.4)',
                color: '#c7f36b',
                fontFamily: 'ui-monospace, monospace',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
              }}
            >
              GITHUB
            </div>
          )}

          {/* Explain repository button */}
          <div
            style={{
              padding: '12px 24px',
              borderRadius: 10,
              backgroundColor: '#c7f36b',
              color: '#171916',
              fontFamily: '-apple-system, Inter, sans-serif',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transform: isClicked
                ? `scale(${1 - clickRipple * 0.08})`
                : 'scale(1)',
              boxShadow: isClicked
                ? '0 0 25px rgba(199, 243, 107, 0.9)'
                : '0 0 15px rgba(199, 243, 107, 0.3)',
              cursor: 'pointer',
            }}
          >
            {isClicked ? 'Analyzing...' : 'Explain repository'}
          </div>
        </div>

        {/* Cursor indicator moving to click button */}
        {frame >= 140 && frame <= 200 && (
          <div
            style={{
              position: 'absolute',
              left: interpolate(frame, [140, 168], [700, 1370], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
              top: interpolate(frame, [140, 168], [480, 370], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
              width: 24,
              height: 24,
              pointerEvents: 'none',
              zIndex: 999,
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#c7f36b">
              <path d="M4 2L18 16L12 17L16 23L13 24L9 18L4 21V2Z" />
            </svg>
          </div>
        )}
      </PageCam>

      {/* Bottom context caption */}
      <Caption
        text="Works with any public GitHub or GitLab repository URL"
        duration={270}
        badge="Zero Config"
        accent="#c7f36b"
      />
    </AbsoluteFill>
  );
};
