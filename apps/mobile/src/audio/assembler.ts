// expo-file-system v19 (SDK 54) moved documentDirectory to the legacy sub-path.
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Assembles a sequence of pre-recorded audio clips into a single plan audio file.
 *
 * Audio assets are stored in the voice pack bundle directory:
 *   FileSystem.documentDirectory + 'voice_packs/<language>/<phrase_key>.aac'
 *
 * For MVP: plays clips sequentially rather than concatenating audio files.
 * Post-MVP: concatenate with FFmpeg or a native module for smoother playback.
 */

export interface PlanAudioSpec {
  language: string;
  foods: Array<{ id: string; localName: string }>;
  clientType: 'pregnant' | 'child';
  supplementReminder: boolean;
}

export interface AssembledAudio {
  phraseKeys: string[];
  audioPaths: string[];
}

export async function assemblePlanAudio(spec: PlanAudioSpec): Promise<AssembledAudio> {
  const packDir = `${FileSystem.documentDirectory}voice_packs/${spec.language}/`;

  const phraseKeys: string[] = [
    'greeting',
    `counselling_intro_${spec.clientType}`,
    ...spec.foods.map((f) => `food_name_${f.id}`),
    'eat_these_foods',
    ...(spec.supplementReminder ? ['supplement_reminder'] : []),
    'closing',
  ];

  const audioPaths: string[] = [];
  for (const key of phraseKeys) {
    const path = `${packDir}${key}.aac`;
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) {
      audioPaths.push(path);
    } else {
      console.warn(`[Audio] Missing phrase: ${key}`);
    }
  }

  return { phraseKeys, audioPaths };
}
