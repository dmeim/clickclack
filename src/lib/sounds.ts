export type SoundManifest = {
  [category: string]: {
    [pack: string]: string[];
  };
};

export const getRandomSoundUrl = (
  manifest: SoundManifest | null,
  category: string,
  pack: string
): string | null => {
  if (!manifest) return null;

  const categoryData = manifest[category];
  if (!categoryData) return null;

  const files = categoryData[pack];
  if (!files || !Array.isArray(files) || files.length === 0) {
    return null;
  }

  const randomFile = files[Math.floor(Math.random() * files.length)];
  return `/sounds/${category}/${pack}/${randomFile}`;
};

// Static sound manifest - no need for API call
export const SOUND_MANIFEST: SoundManifest = {
  typing: {
    bubbles: ["bubbles_01.wav", "bubbles_02.wav", "bubbles_03.wav"],
    creamy: [
      "creamy_01.wav",
      "creamy_02.wav",
      "creamy_03.wav",
      "creamy_04.wav",
      "creamy_05.wav",
      "creamy_06.wav",
      "creamy_07.wav",
      "creamy_08.wav",
      "creamy_09.wav",
      "creamy_10.wav",
      "creamy_11.wav",
      "creamy_12.wav",
    ],
    hitmarker: [
      "hitmarker_01.wav",
      "hitmarker_02.wav",
      "hitmarker_03.wav",
      "hitmarker_04.wav",
      "hitmarker_05.wav",
      "hitmarker_06.wav",
    ],
    plink: ["plink_01.wav", "plink_02.wav", "plink_03.wav"],
    punch: [
      "punch_01.wav",
      "punch_02.wav",
      "punch_03.wav",
      "punch_04.wav",
      "punch_05.wav",
      "punch_06.wav",
      "punch_07.wav",
      "punch_08.wav",
    ],
    robo: ["robo_01.wav", "robo_02.wav", "robo_03.wav"],
    typewriter: [
      "typewriter_01.wav",
      "typewriter_02.wav",
      "typewriter_03.wav",
      "typewriter_04.wav",
      "typewriter_05.wav",
      "typewriter_06.wav",
      "typewriter_07.wav",
      "typewriter_08.wav",
      "typewriter_09.wav",
      "typewriter_10.wav",
      "typewriter_11.wav",
      "typewriter_12.wav",
    ],
  },
  warning: {
    clock: ["clock.wav"],
  },
  error: {},
};

// Backwards compat for any code using the old INITIAL_SOUND_MANIFEST
export const INITIAL_SOUND_MANIFEST = SOUND_MANIFEST;
