import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { LiveStream } from "../types";
import { 
  isTimedRadioStream, 
  isStreamInBroadcastWindow, 
  getRadioScheduleInfo 
} from "../utils/yemenTime";
import { Media3 } from "../services/Media3";


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
  
  const retryCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Check schedule info whenever activeStream changes or on clock tick
  const checkSchedule = useCallback((stream: LiveStream | null) => {
    if (!stream) {
      setIsOutsideBroadcastHours(false);
      return;
    }
    const src = stream.streamUrl || stream.url;
    if (stream.type === "radio" && isTimedRadioStream(src)) {
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
  }, [streamError]);

  const playStream = (stream: LiveStream) => {
    window.dispatchEvent(new CustomEvent("stop-quran-audio"));
    setActiveStream(stream);
    setStreamError(null);
    retryCountRef.current = 0;

    const src = stream.streamUrl || stream.url;
    if (stream.type === "radio" && isTimedRadioStream(src)) {
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
    
    if (Capacitor.getPlatform() === 'android') {
      Media3.stop({ mediaType: 'radio' }).catch(() => {});
    }
    
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
        const src = activeStream.streamUrl || activeStream.url;
        if (activeStream.type === "radio" && isTimedRadioStream(src)) {
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
        if (Capacitor.getPlatform() === 'android' && activeStream.type === 'radio') {
          Media3.pause({ mediaType: 'radio' }).catch(() => {});
        }
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
      if (activeStream.type === "radio") {
        let src = activeStream.streamUrl || activeStream.url;
        
        // Check Yemen timezone broadcast schedule for timed radio
        if (isTimedRadioStream(src) && !isStreamInBroadcastWindow(src)) {
          setIsOutsideBroadcastHours(true);
          setStreamError("البث متوقف حالياً • يبدأ البث الإذاعي لإذاعة تعز يوميًا من الساعة الثامنة صباحًا وحتى الساعة العاشرة مساءً.");
          setIsLoading(false);
          setIsPlaying(false);
          audio.pause();
          return;
        }

        setIsOutsideBroadcastHours(false);
        setIsLoading(true);

        // Proxy HTTP radio streams on web to prevent Mixed Content / CORS blocking
        // On Native Android/iOS, connect directly to stream URL (supported via networkSecurityConfig)
        if (src && !src.startsWith('/api/proxy') && !Capacitor.isNativePlatform()) {
          src = `/api/proxy/stream?url=${encodeURIComponent(src)}`;
        }

        if (src) {
          const absoluteSrc = src.startsWith("http") ? src : new URL(src, window.location.origin).href;
          
          if (Capacitor.getPlatform() === 'android') {
            Media3.play({
              url: absoluteSrc,
              title: activeStream.name || "إذاعة تعز",
              artist: "منصة تعز الإعلامية",
              artwork: activeStream.iconUrl || "",
              mediaType: "radio"
            }).catch(e => console.warn("Native Media3 play error:", e));
            setIsLoading(false); // Native player handles its own loading state implicitly for UI
          } else {
            if (audio.src !== absoluteSrc) {
              audio.src = absoluteSrc;
              audio.load();
            }
            
            if ('mediaSession' in navigator) {
              navigator.mediaSession.metadata = new MediaMetadata({
                title: activeStream.name || "إذاعة تعز",
                artist: "منصة تعز الإعلامية",
                artwork: activeStream.iconUrl ? [{ src: activeStream.iconUrl }] : []
              });
              navigator.mediaSession.setActionHandler('play', () => { togglePlay(); });
              navigator.mediaSession.setActionHandler('pause', () => { togglePlay(); });
            }

            audio.play().catch(e => {
              console.warn("Live stream playback notice:", e.message || e);
            });
          }
        }
      } else {
        // TV stream plays video inside Watch page iframe; pause background audio element
        if (Capacitor.getPlatform() === 'android') {
          Media3.pause({ mediaType: 'radio' }).catch(() => {});
        } else {
          audio.pause();
        }
      }
    } else {
      if (Capacitor.getPlatform() === 'android' && activeStream?.type === 'radio') {
        Media3.pause({ mediaType: 'radio' }).catch(() => {});
      } else {
        audio.pause();
      }
    }
  }, [isPlaying, activeStream]);

  // Listen to Native Media3 events to sync state
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;
    
    let listener: any = null;
    Media3.addListener('onPlaybackStateChanged', (state) => {
      if (state.mediaType === 'radio') {
        setIsPlaying(state.isPlaying);
        if (state.isPlaying) {
          setIsLoading(false);
          setStreamError(null);
        }
      } else if (state.mediaType === 'quran' && state.isPlaying) {
        setIsPlaying(false);
      }
    }).then(l => listener = l);

    return () => {
      if (listener) listener.remove();
    };
  }, []);

  const handleAudioError = () => {
    setIsLoading(false);
    if (!activeStream) return;

    const src = activeStream.streamUrl || activeStream.url;
    if (activeStream.type === "radio" && isTimedRadioStream(src)) {
      if (!isStreamInBroadcastWindow(src)) {
        setIsOutsideBroadcastHours(true);
        setStreamError("البث متوقف حالياً • يبدأ البث الإذاعي لإذاعة تعز يوميًا من الساعة الثامنة صباحًا وحتى الساعة العاشرة مساءً.");
        setIsPlaying(false);
        return;
      }
    }

    // Inside broadcast window or 24/7 stream - retry once or show error
    if (retryCountRef.current < 3 && isPlaying) {
      retryCountRef.current += 1;
      const rawSrc = activeStream.streamUrl || activeStream.url;
      // On web, if initial attempt failed and audio isn't already using proxy, switch to proxy stream
      if (!Capacitor.isNativePlatform() && rawSrc && audioRef.current && !audioRef.current.src.includes('/api/proxy/stream')) {
        const proxyUrl = `/api/proxy/stream?url=${encodeURIComponent(rawSrc)}`;
        const absoluteProxySrc = new URL(proxyUrl, window.location.origin).href;
        audioRef.current.src = absoluteProxySrc;
        audioRef.current.load();
        audioRef.current.play().catch(() => {});
        return;
      }
      setTimeout(() => {
        if (audioRef.current && isPlaying) {
          audioRef.current.load();
          audioRef.current.play().catch(() => {});
        }
      }, 2000);
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
