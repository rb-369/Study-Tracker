'use client';

import { useState, useEffect, useCallback } from 'react';

export function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [wakeLockSentinel, setWakeLockSentinel] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      setIsSupported(true);
    }
  }, []);

  const requestLock = useCallback(async () => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) return false;
    try {
      const sentinel = await (navigator as any).wakeLock.request('screen');
      sentinel.addEventListener('release', () => {
        setIsLocked(false);
        setWakeLockSentinel(null);
      });
      setWakeLockSentinel(sentinel);
      setIsLocked(true);
      return true;
    } catch (err) {
      console.warn('Screen WakeLock request failed:', err);
      setIsLocked(false);
      return false;
    }
  }, []);

  const releaseLock = useCallback(() => {
    if (wakeLockSentinel) {
      wakeLockSentinel.release().catch(() => {});
      setWakeLockSentinel(null);
      setIsLocked(false);
    }
  }, [wakeLockSentinel]);

  // Re-acquire lock if visibility changes back to visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isLocked && !wakeLockSentinel) {
        await requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLocked, wakeLockSentinel, requestLock]);

  return {
    isSupported,
    isLocked,
    requestLock,
    releaseLock,
  };
}
