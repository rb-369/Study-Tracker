import { ActiveTimerState, StudySession, Thought } from '@/types';

const ACTIVE_SESSION_KEY = 'studyflow_active_session_backup_v1';
const OFFLINE_PINGS_KEY = 'studyflow_offline_pings_v1';

export interface LocalSessionBackup {
  session: StudySession;
  timerState: ActiveTimerState;
  thoughts: Thought[];
  lastSavedAt: number; // Unix timestamp in ms
}

/**
 * Saves running session state locally to prevent data loss on browser crash/refresh
 */
export function saveActiveSessionLocal(
  session: StudySession,
  timerState: ActiveTimerState,
  thoughts: Thought[]
): void {
  if (typeof window === 'undefined') return;
  try {
    const backup: LocalSessionBackup = {
      session,
      timerState,
      thoughts,
      lastSavedAt: Date.now(),
    };
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(backup));
  } catch (err) {
    console.warn('Failed to save session backup to localStorage:', err);
  }
}

/**
 * Loads the active session backup if present
 */
export function loadActiveSessionLocal(): LocalSessionBackup | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!data) return null;
    const backup: LocalSessionBackup = JSON.parse(data);
    return backup;
  } catch (err) {
    console.warn('Failed to parse local session backup:', err);
    return null;
  }
}

/**
 * Clears the local session backup when a session is completed or abandoned
 */
export function clearActiveSessionLocal(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch (err) {
    console.warn('Failed to clear local session backup:', err);
  }
}

/**
 * Re-synchronizes elapsed timer seconds after a reload or background tab throttling
 */
export function calculateRecoveredElapsedSeconds(backup: LocalSessionBackup): number {
  if (!backup.timerState.isRunning || !backup.timerState.lastStartedAt) {
    return backup.timerState.elapsedSeconds;
  }

  const now = Date.now();
  const additionalSeconds = Math.max(0, Math.floor((now - backup.timerState.lastStartedAt) / 1000));
  return backup.timerState.accumulatedSeconds + additionalSeconds;
}

/**
 * Stores mind pings logged while offline for sync when reconnecting
 */
export function saveOfflinePing(ping: Thought): void {
  if (typeof window === 'undefined') return;
  try {
    const existing: Thought[] = JSON.parse(localStorage.getItem(OFFLINE_PINGS_KEY) || '[]');
    existing.push(ping);
    localStorage.setItem(OFFLINE_PINGS_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('Failed to cache offline ping:', err);
  }
}

export function getOfflinePings(): Thought[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_PINGS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearOfflinePings(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(OFFLINE_PINGS_KEY);
  } catch (err) {
    console.warn('Failed to clear offline pings:', err);
  }
}
