// src/domain/sync/useSyncOnForeground.ts
// Hook to trigger sync when app comes to foreground

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { runFullSync } from './syncEngine';
import { useAuth } from '../../data/auth';

const MIN_SYNC_INTERVAL_MS = 60 * 1000; // Don't sync more than once per minute

/**
 * Hook that triggers sync:
 * 1. On initial mount (if authenticated)
 * 2. When app comes to foreground (if authenticated and enough time has passed)
 */
export function useSyncOnForeground() {
  const { session, initialized } = useAuth();
  const lastSyncRef = useRef<number>(0);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!initialized || !session) return;

    const trySync = async () => {
      const now = Date.now();
      if (now - lastSyncRef.current < MIN_SYNC_INTERVAL_MS) {
        return; // Too soon since last sync
      }

      lastSyncRef.current = now;
      try {
        const result = await runFullSync();
        if (result.success) {
          console.log('[Sync] Background sync complete:', {
            pulled: result.totalPulled,
            pushed: result.totalPushed,
          });
        } else {
          console.warn('[Sync] Background sync failed:', result.errors);
        }
      } catch (err) {
        console.error('[Sync] Background sync error:', err);
      }
    };

    // Sync on mount
    trySync();

    // Sync when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        trySync();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [initialized, session]);
}
