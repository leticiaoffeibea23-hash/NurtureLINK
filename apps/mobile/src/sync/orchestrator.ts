/**
 * Sync orchestrator — coordinates push, pull, and reference bundle downloads.
 *
 * Trigger conditions (call syncNow):
 *   - App comes to foreground after ≥ 5 min in background
 *   - Network state changes to connected
 *   - Background task fires (every 15 min when connected)
 *   - Immediately after issuing a referral (emergency push)
 *
 * Heavy downloads (voice packs, full bundle) only when battery > 30% or charging.
 */

import { pushMutations } from './push';
import { pullChanges } from './pull';
import { checkAndDownloadBundle } from './bundle-sync';
import { useAppStore } from '../store';

export type SyncTrigger = 'foreground' | 'network_change' | 'background' | 'referral_emergency';

let isSyncing = false;

export async function syncNow(trigger: SyncTrigger): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;

  try {
    console.log(`[Sync] Starting (trigger: ${trigger})`);

    // Push first — referral emergencies are lightweight and always safe
    await pushMutations();

    if (trigger !== 'referral_emergency') {
      // Check for a new reference bundle before pulling data changes
      const bundleUpdated = await checkAndDownloadBundle().catch((err) => {
        console.warn('[Sync] Bundle check failed (non-fatal):', err);
        return false;
      });
      if (bundleUpdated) {
        // Reload the bundle into the Zustand store so the engine picks it up
        await useAppStore.getState().loadBundle();
      }

      await pullChanges();
    }

    console.log('[Sync] Complete');
  } catch (err) {
    console.error('[Sync] Error', err);
  } finally {
    isSyncing = false;
  }
}
