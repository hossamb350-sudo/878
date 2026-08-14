/**
 * Utility for Yemen Time (Asia/Aden, UTC+3) and Radio Broadcast Scheduling
 */

export interface YemenTime {
  hour: number;
  minute: number;
  second: number;
  formattedTime: string;
}

/**
 * Get the current time in Yemen (Asia/Aden timezone)
 * Strictly independent of the user's device local timezone.
 */
export function getYemenTime(): YemenTime {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Aden",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    const second = parseInt(parts.find((p) => p.type === "second")?.value || "0", 10);

    const formattedTime = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;

    return { hour, minute, second, formattedTime };
  } catch (e) {
    // Fallback: Yemen is UTC+3 with no Daylight Saving Time
    const now = new Date();
    const utcHours = now.getUTCHours();
    const hour = (utcHours + 3) % 24;
    const minute = now.getUTCMinutes();
    const second = now.getUTCSeconds();
    const formattedTime = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
    return { hour, minute, second, formattedTime };
  }
}

/**
 * Checks if a stream URL belongs to the timed radio station (e.g. Taiz Radio 2: 168.119.10.136)
 */
export function isTimedRadioStream(url?: string | null): boolean {
  if (!url) return false;
  return (
    url.includes("168.119.10.136") ||
    url.includes("taizradio")
  );
}

/**
 * Check if the radio is currently in its broadcast window
 * For Stream 2: 08:00 AM to 22:00 PM (10:00 PM) Yemen Time (Asia/Aden).
 * For 24/7 streams (like Stream 1): always true.
 */
export function isStreamInBroadcastWindow(url?: string | null): boolean {
  if (!url) return false;
  if (!isTimedRadioStream(url)) {
    return true; // 24/7 stream
  }

  const { hour } = getYemenTime();
  // 08:00 to 22:00 (i.e. hour >= 8 and hour < 22)
  return hour >= 8 && hour < 22;
}

/**
 * Get descriptive status message for radio stream based on Yemen timezone
 */
export function getRadioScheduleInfo(url?: string | null): {
  isTimed: boolean;
  isOpen: boolean;
  statusText: string;
} {
  const isTimed = isTimedRadioStream(url);
  if (!isTimed) {
    return {
      isTimed: false,
      isOpen: true,
      statusText: "بث مباشر مستمر",
    };
  }

  const isOpen = isStreamInBroadcastWindow(url);
  if (isOpen) {
    return {
      isTimed: true,
      isOpen: true,
      statusText: "البث متاح حالياً (08:00 ص - 10:00 م بتوقيت اليمن)",
    };
  }

  return {
    isTimed: true,
    isOpen: false,
    statusText: "البث متوقف حالياً • يبدأ البث الإذاعي لإذاعة تعز يوميًا من الساعة الثامنة صباحًا وحتى الساعة العاشرة مساءً.",
  };
}
