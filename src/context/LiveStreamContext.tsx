import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { LiveStream } from "../types";
import { 
  isTimedRadioStream, 
  isStreamInBroadcastWindow, 
  getRadioScheduleInfo 
} from "../utils/yemenTime";
import { API_BASE } from "../config/apiConfig";

interface LiveStreamContextType {
  activeStream: LiveStream | null;
  isPlaying: boolean;
  isLoading: boolean;
  isMuted: boolean;
  volume: number;
  isPlayingInHero: boolean;
  setIsPlayingInHero: (val: boolean) => void;
  isTopBarPinned: boolean;
  setTopBarPinned: (pinned: boolean) => void;
  playStream: (stream: LiveStream) => void;
  stopStream: () => void;
  togglePlay: () => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  streamError: string | null;
  isOutsideBroadcastHours: boolean;
}

const LiveStreamContext = createContext<LiveStreamContextType | undefined>(undefined);

export function LiveStreamProvider({ children }: { children: React.ReactNode }) {
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [isPlayingInHero, setIsPlayingInHero] = useState(false);
  const [isTopBarPinned, setIsTopBarPinned] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isOutsideBroadcastHours, setIsOutsideBroadcastHours] = useState(false);
  const [detectedTypeMap, setDetectedTypeMap] = useState<Record<string, "tv" | "radio">>({});
  
  const retryCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Helper to dynamically detect if a stream is audio (radio) or video (tv) via content-type header from backend
  const detectStreamType = useCallback(async (url: string) => {
    if (detectedTypeMap[url]) return detectedTypeMap[url];
    try {
      const response = await fetch(`${API_BASE}/api/stream/detect-type?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        const detected: "tv" | "radio" = data.isAudio ? "radio" : "tv";
        setDetectedTypeMap(prev => ({ ...prev, [url]: detected }));
        return detected;
      }
    } catch (e) {
      console.warn("Dynamic stream type detection failed:", e);
    }
    // Fallback detection logic if offline or blocked
    const isLikelyAudio = url.includes("proxy") || url.includes("stream") || url.includes("radio") || url.includes("168.119.10.136");
    const fallbackType = isLikelyAudio ? "radio" : "tv";
    return fallbackType;
  }, [detectedTypeMap]);

  const isRadioType = (stream: LiveStream) => {
    const src = stream.streamUrl || stream.url || "";
    if (detectedTypeMap[src]) {
      return detectedTypeMap[src] === "radio";
    }
    return stream.type === "radio" || src.includes("proxy") || src.includes("stream") || src.includes("radio") || src.includes("168.119.10.136");
  };

  // Check schedule info whenever activeStream changes or on clock tick
  const checkSchedule = useCallback((stream: LiveStream | null) => {
    if (!stream) {
      setIsOutsideBroadcastHours(false);
      return;
    }
    const src = stream.streamUrl || stream.url;
    if (isRadioType(stream) && src && isTimedRadioStream(src)) {
      const schedule = getRadioScheduleInfo(src);
      setIsOutsideBroadcastHours(!schedule.isOpen);
      if (!schedule.isOpen) {
        setStreamError(schedule.statusText);
      } else if (streamError && streamError.includes("يبدأ البث")) {
        setStreamError(null);
      }
    } else {
      setIsOutsideBroadcastHours(false);
    }
  }, [streamError, detectedTypeMap]);

  const playStream = (stream: LiveStream) => {
    window.dispatchEvent(new CustomEvent("stop-quran-audio"));
    setActiveStream(stream);
    setStreamError(null);
    retryCountRef.current = 0;

    const src = stream.streamUrl || stream.url || "";
    
    // Trigger lazy content-type discovery
    if (src) {
      detectStreamType(src).catch(() => {});
    }

    if (isRadioType(stream) && src && isTimedRadioStream(src)) {
      const schedule = getRadioScheduleInfo(src);
      if (!schedule.isOpen) {
        setIsOutsideBroadcastHours(true);
        setStreamError(schedule.statusText);
        setIsPlaying(false);
        setIsLoading(false);
        return;
      }
    }

    setIsOutsideBroadcastHours(false);
    setIsPlaying(true);
  };

  const stopStream = () => {
    setIsPlaying(false);
    setIsLoading(false);
    setActiveStream(null);
    setIsPlayingInHero(false);
    setIsTopBarPinned(false);
    setStreamError(null);
    retryCountRef.current = 0;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
    }
  };

  const togglePlay = () => {
    if (activeStream) {
      if (!isPlaying) {
        window.dispatchEvent(new CustomEvent("stop-quran-audio"));
        const src = activeStream.streamUrl || activeStream.url || "";
        if (isRadioType(activeStream) && src && isTimedRadioStream(src)) {
          const schedule = getRadioScheduleInfo(src);
          if (!schedule.isOpen) {
            setIsOutsideBroadcastHours(true);
            setStreamError(schedule.statusText);
            setIsPlaying(false);
            return;
          }
        }
        setStreamError(null);
        retryCountRef.current = 0;
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
    }
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  useEffect(() => {
    const handleStopLiveStream = () => {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };

    window.addEventListener("stop-live-stream", handleStopLiveStream);
    return () => window.removeEventListener("stop-live-stream", handleStopLiveStream);
  }, []);

  // Periodic Yemen Time check every 30 seconds for broadcast schedules
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeStream) {
        checkSchedule(activeStream);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [activeStream, checkSchedule]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying && activeStream) {
      window.dispatchEvent(new CustomEvent("stop-quran-audio"));
      const isRadio = isRadioType(activeStream);

      if (isRadio) {
        let src = activeStream.streamUrl || activeStream.url;
        
        // Check Yemen timezone broadcast schedule for timed radio
        if (src && isTimedRadioStream(src) && !isStreamInBroadcastWindow(src)) {
          setIsOutsideBroadcastHours(true);
          setStreamError("البث متوقف حالياً • يبدأ البث الإذاعي لإذاعة تعز يوميًا من الساعة الثامنة صباحًا وحتى الساعة العاشرة مساءً.");
          setIsLoading(false);
          setIsPlaying(false);
          audio.pause();
          return;
        }

        setIsOutsideBroadcastHours(false);
        setIsLoading(true);

        // Proxy HTTP radio streams on Web and Android to prevent Mixed Content blocking & resolve ExoPlayer direct streaming limits
        if (src && src.startsWith("http://") && !src.startsWith("/api/proxy")) {
          src = `${API_BASE}/api/proxy/stream?url=${encodeURIComponent(src)}`;
        }

        if (src) {
          const absoluteSrc = src.startsWith("http") ? src : new URL(src, window.location.origin).href;
          if (audio.src !== absoluteSrc) {
            audio.src = absoluteSrc;
            audio.load();
          }
        }
        
        audio.play().catch(e => {
          console.warn("Live stream playback notice:", e.message || e);
        });
      } else {
        // TV stream plays video inside Watch page iframe; pause background audio element
        audio.pause();
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, activeStream, detectedTypeMap]);

  const handleAudioError = () => {
    setIsLoading(false);
    if (!activeStream) return;

    const src = activeStream.streamUrl || activeStream.url;
    if (isRadioType(activeStream) && src && isTimedRadioStream(src)) {
      if (!isStreamInBroadcastWindow(src)) {
        setIsOutsideBroadcastHours(true);
        setStreamError("البث متوقف حالياً • يبدأ البث الإذاعي لإذاعة تعز يوميًا من الساعة الثامنة صباحًا وحتى الساعة العاشرة مساءً.");
        setIsPlaying(false);
        return;
      }
    }

    // Inside broadcast window or 24/7 stream - retry once or show error
    if (retryCountRef.current < 2 && isPlaying) {
      retryCountRef.current += 1;
      setTimeout(() => {
        if (audioRef.current && isPlaying) {
          audioRef.current.load();
          audioRef.current.play().catch(() => {});
        }
      }, 2500);
    } else {
      setIsPlaying(false);
      setStreamError("تعذر الاتصال بالبث المباشر حالياً");
    }
  };

  return (
    <LiveStreamContext.Provider
      value={{
        activeStream,
        isPlaying,
        isLoading,
        isMuted,
        volume,
        isPlayingInHero,
        setIsPlayingInHero,
        isTopBarPinned,
        setTopBarPinned: setIsTopBarPinned,
        playStream,
        stopStream,
        togglePlay,
        setVolume,
        toggleMute,
        audioRef,
        streamError,
        isOutsideBroadcastHours
      }}
    >
      {children}
      {/* Hidden global audio element */}
      <audio 
        ref={audioRef} 
        className="hidden" 
        preload="none"
        onPlay={() => {
          setIsPlaying(true);
          setIsLoading(false);
          setStreamError(null);
          retryCountRef.current = 0;
        }}
        onPause={() => {
          setIsPlaying(false);
          setIsLoading(false);
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setStreamError(null);
        }}
        onStalled={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onError={handleAudioError}
      />
    </LiveStreamContext.Provider>
  );
}

export function useLiveStream() {
  const context = useContext(LiveStreamContext);
  if (context === undefined) {
    throw new Error("useLiveStream must be used within a LiveStreamProvider");
  }
  return context;
}
