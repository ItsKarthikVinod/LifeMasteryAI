import { useCallback, useEffect, useState } from "react";
import {
  addPendingAction,
  getPendingActions,
  markActionSynced,
  deletePendingAction,
} from "../utils/offlineStorage";

/**
 * Hook to manage offline-queued actions
 * Automatically syncs queued actions when back online
 */
export function usePendingActions() {
  const [pendingActions, setPendingActions] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Load pending actions on mount
  useEffect(() => {
    const loadPendingActions = async () => {
      try {
        const actions = await getPendingActions();
        setPendingActions(actions);
        console.log(
          `[PendingActions] Loaded ${actions.length} pending actions`,
        );
      } catch (error) {
        console.error("[PendingActions] Error loading pending actions:", error);
      }
    };

    loadPendingActions();
  }, []);

  // Add an action to the queue
  const queueAction = useCallback(async (type, data) => {
    try {
      console.log(`[PendingActions] Queueing action: ${type}`, data);
      const id = await addPendingAction(type, data);
      const newAction = {
        id,
        type,
        data,
        createdAt: Date.now(),
        synced: false,
      };
      setPendingActions((prev) => [...prev, newAction]);
      return id;
    } catch (error) {
      console.error("[PendingActions] Error queueing action:", error);
      throw error;
    }
  }, []);

  // Sync pending actions with backend
  const syncActions = useCallback(
    async (syncFn) => {
      if (pendingActions.length === 0) {
        console.log("[PendingActions] No pending actions to sync");
        return { synced: 0, failed: 0 };
      }

      setSyncing(true);
      setSyncError(null);

      let synced = 0;
      let failed = 0;

      for (const action of pendingActions) {
        try {
          console.log(
            `[PendingActions] Syncing action ${action.id}: ${action.type}`,
          );

          // Call the sync function (provided by component) to sync this action
          await syncFn(action.type, action.data, action.id);

          // Mark as synced
          await markActionSynced(action.id);
          synced++;

          // Update state
          setPendingActions((prev) =>
            prev.map((a) => (a.id === action.id ? { ...a, synced: true } : a)),
          );
        } catch (error) {
          console.error(
            `[PendingActions] Failed to sync action ${action.id}:`,
            error,
          );
          failed++;
          setSyncError(error.message);

          // Don't throw, continue with other actions
        }
      }

      setSyncing(false);

      console.log(
        `[PendingActions] Sync complete: ${synced} synced, ${failed} failed`,
      );

      return { synced, failed };
    },
    [pendingActions],
  );

  // Remove action from queue manually
  const removeAction = useCallback(async (actionId) => {
    try {
      await deletePendingAction(actionId);
      setPendingActions((prev) => prev.filter((a) => a.id !== actionId));
      console.log(`[PendingActions] Removed action: ${actionId}`);
    } catch (error) {
      console.error("[PendingActions] Error removing action:", error);
    }
  }, []);

  // Get count of pending actions
  const pendingCount = pendingActions.filter((a) => !a.synced).length;

  return {
    pendingActions: pendingActions.filter((a) => !a.synced),
    pendingCount,
    syncing,
    syncError,
    queueAction,
    syncActions,
    removeAction,
  };
}

export default usePendingActions;
