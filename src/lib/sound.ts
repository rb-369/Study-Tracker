// Web Audio API and Browser Notification Engine for Background Timer

/**
 * Plays a pleasant resonant 2-tone melodic harmonic bell chime using Web Audio API.
 * 100% reliable, zero network latency, no external MP3 dependencies, works offline.
 */
export function playPomodoroCompleteChime() {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Helper to play a chime harmonic note
    const playHarmonicTone = (freq: number, startTime: number, duration: number, gainValue = 0.25) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      // Smooth attack & exponential decay
      gainNode.gain.setValueAtTime(0.001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Chime Note 1: C5 (523.25 Hz) with harmonic E5 (659.25 Hz)
    playHarmonicTone(523.25, now, 1.2, 0.3);
    playHarmonicTone(1046.5, now, 0.8, 0.1);

    // Chime Note 2: G5 (783.99 Hz) with high C6 (1046.5 Hz) 250ms later
    playHarmonicTone(783.99, now + 0.25, 1.5, 0.35);
    playHarmonicTone(1567.98, now + 0.25, 1.0, 0.12);

    // Chime Note 3: High C6 (1046.5 Hz) 500ms later
    playHarmonicTone(1046.5, now + 0.5, 2.0, 0.4);
    playHarmonicTone(2093.0, now + 0.5, 1.2, 0.08);

    // Cleanup audio context after notes finish
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 3000);
  } catch (err) {
    console.warn("Could not play timer chime:", err);
  }
}

/**
 * Checks current notification permission state
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Requests browser permission for desktop notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return "default";
  }
}

/**
 * Sends a native desktop notification if permission has been granted
 */
export function sendStudyNotification(title: string, options?: NotificationOptions) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      const notif = new Notification(title, {
        icon: "/Study_flow_logo.png",
        badge: "/Study_flow_logo.png",
        ...options,
      });

      // Automatically focus window when clicking notification
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (err) {
      console.warn("Failed to dispatch study notification:", err);
    }
  }
}

/**
 * Updates document.title live countdown for background tabs
 */
export function updateLiveTimerTitle({
  topic,
  formattedTime,
  isRunning,
  isPomodoro,
  isComplete,
}: {
  topic: string;
  formattedTime: string;
  isRunning: boolean;
  isPomodoro: boolean;
  isComplete?: boolean;
}) {
  if (typeof document === "undefined") return;

  const cleanTopic = topic.length > 20 ? `${topic.substring(0, 18)}...` : topic;

  if (isComplete) {
    document.title = `🎉 Time's Up! (${formattedTime}) • ${cleanTopic} | StudyFlow`;
  } else if (!isRunning) {
    document.title = `⏸️ [PAUSED] ${formattedTime} • ${cleanTopic} | StudyFlow`;
  } else if (isPomodoro) {
    document.title = `🍅 ${formattedTime} • ${cleanTopic} | StudyFlow`;
  } else {
    document.title = `⏱️ ${formattedTime} • ${cleanTopic} | StudyFlow`;
  }
}

/**
 * Resets document.title to default app name
 */
export function resetTabTitle() {
  if (typeof document === "undefined") return;
  document.title = "StudyFlow | Advanced Study & Deep Focus Tracker";
}
