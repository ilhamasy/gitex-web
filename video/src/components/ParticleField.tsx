import React from 'react';
import { useCurrentFrame } from 'remotion';

// Deterministic pseudo-random generator
function pseudoRand(seed: number) {
  const x = Math.sin(seed * 9999.123) * 10000;
  return x - Math.floor(x);
}

export const ParticleField: React.FC<{
  count?: number;
  color?: string;
  speed?: number;
}> = ({ count = 35, color = 'rgba(199, 243, 107, 0.45)', speed = 0.5 }) => {
  const frame = useCurrentFrame();

  const particles = Array.from({ length: count }, (_, i) => {
    const seedX = pseudoRand(i * 1.7 + 1);
    const seedY = pseudoRand(i * 2.3 + 4);
    const seedSize = pseudoRand(i * 3.1 + 7);
    const seedSpeed = pseudoRand(i * 4.7 + 2);

    // Drifting coordinates
    const initialX = seedX * 1920;
    const initialY = seedY * 1080;
    const curY = (initialY - frame * speed * (0.4 + seedSpeed * 0.8) + 1080) % 1080;
    const curX = initialX + Math.sin(frame * 0.02 + i) * 15;
    const size = 1.5 + seedSize * 2.5;
    const opacity = 0.2 + 0.55 * Math.sin(frame * 0.03 + i * 1.5);

    return { id: i, x: curX, y: curY, size, opacity };
  });

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            backgroundColor: color,
            opacity: p.opacity,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      ))}
    </div>
  );
};
