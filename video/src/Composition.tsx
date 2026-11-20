import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  interpolate,
  useCurrentFrame,
} from 'remotion';

import { Scene01Problem } from './scenes/Scene01Problem';
import { Scene02Pain } from './scenes/Scene02Pain';
import { Scene03Reveal } from './scenes/Scene03Reveal';
import { Scene04HowItWorks } from './scenes/Scene04HowItWorks';
import { Scene05BehindTheMagic } from './scenes/Scene05BehindTheMagic';
import { Scene06TheResult } from './scenes/Scene06TheResult';
import { Scene07Closing } from './scenes/Scene07Closing';
import { FlashCut } from './components/FlashCut';

export const GitExPromo: React.FC<{ bgm?: boolean }> = ({ bgm = true }) => {
  const frame = useCurrentFrame();

  // BGM volume automation with ducking when VO is prominent
  const bgmVolume = interpolate(
    frame,
    [0, 30, 1850, 1950],
    [0, 0.38, 0.38, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#0c0e0c' }}>
      {/* -------------------- VISUAL SCENES -------------------- */}

      {/* Scene 01: The Problem (0 - 8s / f0 - 240) */}
      <Sequence from={0} durationInFrames={240} name="Scene 01 - The Problem">
        <Scene01Problem />
      </Sequence>

      {/* Scene 02: The Pain (8 - 16s / f240 - 480) */}
      <Sequence from={240} durationInFrames={240} name="Scene 02 - The Pain">
        <Scene02Pain />
      </Sequence>

      {/* Scene 03: The Reveal (16 - 23s / f480 - 690) */}
      <Sequence from={480} durationInFrames={210} name="Scene 03 - The Reveal">
        <Scene03Reveal />
      </Sequence>

      {/* Scene 04: How It Works (23 - 32s / f690 - 960) */}
      <Sequence from={690} durationInFrames={270} name="Scene 04 - How It Works">
        <Scene04HowItWorks />
      </Sequence>

      {/* Scene 05: Behind The Magic (32 - 43s / f960 - 1290) */}
      <Sequence from={960} durationInFrames={330} name="Scene 05 - Behind The Magic">
        <Scene05BehindTheMagic />
      </Sequence>

      {/* Scene 06: The Result (43 - 57s / f1290 - 1710) */}
      <Sequence from={1290} durationInFrames={420} name="Scene 06 - The Result">
        <Scene06TheResult />
      </Sequence>

      {/* Scene 07: Closing & CTA (57 - 65s / f1710 - 1950) */}
      <Sequence from={1710} durationInFrames={240} name="Scene 07 - Closing & CTA">
        <Scene07Closing />
      </Sequence>

      {/* -------------------- FLASH TRANSITIONS -------------------- */}
      <Sequence from={235} durationInFrames={12} name="FlashCut 1-2">
        <FlashCut duration={12} color="rgba(239, 68, 68, 0.3)" />
      </Sequence>
      <Sequence from={475} durationInFrames={16} name="FlashCut 2-3">
        <FlashCut duration={16} color="rgba(199, 243, 107, 0.55)" />
      </Sequence>
      <Sequence from={685} durationInFrames={12} name="FlashCut 3-4">
        <FlashCut duration={12} color="rgba(199, 243, 107, 0.45)" />
      </Sequence>
      <Sequence from={955} durationInFrames={12} name="FlashCut 4-5">
        <FlashCut duration={12} color="rgba(199, 243, 107, 0.45)" />
      </Sequence>
      <Sequence from={1285} durationInFrames={12} name="FlashCut 5-6">
        <FlashCut duration={12} color="rgba(199, 243, 107, 0.45)" />
      </Sequence>
      <Sequence from={1705} durationInFrames={14} name="FlashCut 6-7">
        <FlashCut duration={14} color="rgba(199, 243, 107, 0.55)" />
      </Sequence>
      <Sequence from={1785} durationInFrames={14} name="FlashCut 7-Impact">
        <FlashCut duration={14} color="rgba(255, 255, 255, 0.7)" />
      </Sequence>

      {/* -------------------- AUDIO: BGM -------------------- */}
      {bgm && (
        <Audio
          src={staticFile('audio/bgm-cinematic.wav')}
          volume={bgmVolume}
        />
      )}

      {/* -------------------- AUDIO: VOICE-OVER (VO) -------------------- */}
      {/* Scene 01 VO */}
      <Sequence from={10} durationInFrames={200} name="VO 01">
        <Audio src={staticFile('audio/vo/scene01.wav')} volume={1.0} />
      </Sequence>

      {/* Scene 02 VO */}
      <Sequence from={250} durationInFrames={210} name="VO 02">
        <Audio src={staticFile('audio/vo/scene02.wav')} volume={1.0} />
      </Sequence>

      {/* Scene 03 VO */}
      <Sequence from={490} durationInFrames={150} name="VO 03">
        <Audio src={staticFile('audio/vo/scene03.wav')} volume={1.0} />
      </Sequence>

      {/* Scene 04 VO */}
      <Sequence from={700} durationInFrames={190} name="VO 04">
        <Audio src={staticFile('audio/vo/scene04.wav')} volume={1.0} />
      </Sequence>

      {/* Scene 05 VO */}
      <Sequence from={970} durationInFrames={320} name="VO 05">
        <Audio src={staticFile('audio/vo/scene05.wav')} volume={1.0} />
      </Sequence>

      {/* Scene 06 VO */}
      <Sequence from={1300} durationInFrames={300} name="VO 06">
        <Audio src={staticFile('audio/vo/scene06.wav')} volume={1.0} />
      </Sequence>

      {/* Scene 07 VO */}
      <Sequence from={1720} durationInFrames={220} name="VO 07">
        <Audio src={staticFile('audio/vo/scene07.wav')} volume={1.0} />
      </Sequence>

      {/* -------------------- AUDIO: SFX NAILS -------------------- */}
      {/* Scene 01 Intro Whoosh */}
      <Sequence from={5} durationInFrames={40} name="SFX - Whoosh 01">
        <Audio src={staticFile('audio/sfx/whoosh-fast.mp3')} volume={0.65} />
      </Sequence>

      {/* Scene 02 Cards & Riser */}
      <Sequence from={250} durationInFrames={40} name="SFX - Card 1">
        <Audio src={staticFile('audio/sfx/whoosh-fast.mp3')} volume={0.5} />
      </Sequence>
      <Sequence from={285} durationInFrames={40} name="SFX - Card 2">
        <Audio src={staticFile('audio/sfx/whoosh-fast.mp3')} volume={0.5} />
      </Sequence>
      <Sequence from={320} durationInFrames={40} name="SFX - Card 3">
        <Audio src={staticFile('audio/sfx/whoosh-fast.mp3')} volume={0.5} />
      </Sequence>
      <Sequence from={380} durationInFrames={100} name="SFX - Riser 02">
        <Audio src={staticFile('audio/sfx/riser-cine.mp3')} volume={0.7} />
      </Sequence>

      {/* Scene 03 GitEx Reveal Impact */}
      <Sequence from={480} durationInFrames={90} name="SFX - Impact 03">
        <Audio src={staticFile('audio/sfx/impact-cine.mp3')} volume={0.9} />
      </Sequence>
      <Sequence from={530} durationInFrames={60} name="SFX - Sparkle 03">
        <Audio src={staticFile('audio/sfx/sparkle.mp3')} volume={0.7} />
      </Sequence>

      {/* Scene 04 Typing & Click */}
      <Sequence from={690} durationInFrames={40} name="SFX - Whoosh 04">
        <Audio src={staticFile('audio/sfx/whoosh-fast.mp3')} volume={0.6} />
      </Sequence>
      <Sequence from={720} durationInFrames={50} name="SFX - Keyboard Typing">
        <Audio src={staticFile('audio/sfx/keyboard.mp3')} volume={0.55} />
      </Sequence>
      <Sequence from={860} durationInFrames={30} name="SFX - Button Click">
        <Audio src={staticFile('audio/sfx/click-camera.mp3')} volume={0.7} />
      </Sequence>

      {/* Scene 05 Stepper Pops */}
      <Sequence from={965} durationInFrames={25} name="SFX - Stage 1">
        <Audio src={staticFile('audio/sfx/pop.mp3')} volume={0.6} />
      </Sequence>
      <Sequence from={1010} durationInFrames={25} name="SFX - Stage 2">
        <Audio src={staticFile('audio/sfx/pop.mp3')} volume={0.6} />
      </Sequence>
      <Sequence from={1065} durationInFrames={25} name="SFX - Stage 3">
        <Audio src={staticFile('audio/sfx/pop.mp3')} volume={0.65} />
      </Sequence>
      <Sequence from={1125} durationInFrames={25} name="SFX - Stage 4">
        <Audio src={staticFile('audio/sfx/pop.mp3')} volume={0.65} />
      </Sequence>
      <Sequence from={1185} durationInFrames={60} name="SFX - Whoosh Big 05">
        <Audio src={staticFile('audio/sfx/whoosh-big.mp3')} volume={0.7} />
      </Sequence>

      {/* Scene 06 Transitions */}
      <Sequence from={1290} durationInFrames={40} name="SFX - Whoosh 06">
        <Audio src={staticFile('audio/sfx/whoosh-fast.mp3')} volume={0.6} />
      </Sequence>
      <Sequence from={1395} durationInFrames={35} name="SFX - Snap 1">
        <Audio src={staticFile('audio/sfx/transition-snap.mp3')} volume={0.5} />
      </Sequence>
      <Sequence from={1500} durationInFrames={35} name="SFX - Snap 2">
        <Audio src={staticFile('audio/sfx/transition-snap.mp3')} volume={0.5} />
      </Sequence>
      <Sequence from={1605} durationInFrames={35} name="SFX - Soft 3">
        <Audio src={staticFile('audio/sfx/transition-soft.mp3')} volume={0.5} />
      </Sequence>

      {/* Scene 07 Grand Outro Riser -> Impact -> Sparkle */}
      <Sequence from={1710} durationInFrames={50} name="SFX - Outro Swoosh">
        <Audio src={staticFile('audio/sfx/swoosh-quick.mp3')} volume={0.6} />
      </Sequence>
      <Sequence from={1740} durationInFrames={90} name="SFX - Grand Riser">
        <Audio src={staticFile('audio/sfx/riser-cine.mp3')} volume={0.8} />
      </Sequence>
      <Sequence from={1790} durationInFrames={100} name="SFX - Grand Impact">
        <Audio src={staticFile('audio/sfx/impact-cine.mp3')} volume={0.95} />
      </Sequence>
      <Sequence from={1820} durationInFrames={80} name="SFX - Final Sparkle">
        <Audio src={staticFile('audio/sfx/sparkle.mp3')} volume={0.8} />
      </Sequence>
    </AbsoluteFill>
  );
};
