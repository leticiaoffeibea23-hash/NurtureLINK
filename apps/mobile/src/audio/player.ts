import { Audio } from 'expo-av';
import * as Sharing from 'expo-sharing';

let currentSound: Audio.Sound | null = null;

/**
 * Plays a sequence of audio clips back-to-back (simulating a complete plan audio).
 */
export async function playPlanAudio(audioPaths: string[]): Promise<void> {
  await stopPlayback();

  for (const path of audioPaths) {
    const { sound } = await Audio.Sound.createAsync({ uri: path });
    currentSound = sound;
    await sound.playAsync();
    await waitForPlayback(sound);
    await sound.unloadAsync();
  }

  currentSound = null;
}

export async function stopPlayback(): Promise<void> {
  if (currentSound) {
    await currentSound.stopAsync();
    await currentSound.unloadAsync();
    currentSound = null;
  }
}

/**
 * Shares the assembled plan audio file via the OS share sheet.
 * The caregiver can save it to WhatsApp, Files, or another app.
 */
export async function sharePlanAudio(filePath: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }
  await Sharing.shareAsync(filePath, { mimeType: 'audio/aac', dialogTitle: 'Share nutrition plan' });
}

function waitForPlayback(sound: Audio.Sound): Promise<void> {
  return new Promise((resolve) => {
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) resolve();
    });
  });
}
