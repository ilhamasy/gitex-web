import React from 'react';
import { Composition } from 'remotion';
import { GitExPromo } from './Composition';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="GitExPromo"
        component={GitExPromo}
        durationInFrames={1950}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          bgm: true,
        }}
      />
    </>
  );
};

