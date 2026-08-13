import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { LiveStream } from "../types";
import { API_BASE } from "../config/apiConfig";
import { radioPlayer } from "../services/radioPlayer";

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
  const audioRef = useRef<HTMLAudioElement>(null);

  const playStream = (stream: LiveStream) => {
    window.dispatchEvent(new CustomEvent("stop-quran-audio"));
    setActiveStream(stream);
    setIsPlaying(true);
  };

  const stopStream = () => {
    setIsPlaying(false);
    setActiveStream(null);
    setIsPlayingInHero(false);
    setIsTopBarPinned(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    radioPlayer.stop();
  };

  const togglePlay = () => {
    if (activeStream) {
      if (!isPlaying) {
        window.dispatchEvent(new CustomEvent("stop-quran-audio"));
      }
      setIsPlaying(!isPlaying);
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
      radioPlayer.pause();
    };
    window.addEventListener("stop-live-stream", handleStopLiveStream);
    return () => window.removeEventListener("stop-live-stream", handleStopLiveStream);
  }, []);

  // Sync Native Radio Events
  useEffect(() => {
    if (radioPlayer.isNativeMode) {
      const unsubPlaying = radioPlayer.on('playing', () => { setIsPlaying(true); setIsLoading(false); });
      const unsubPaused = radioPlayer.on('paused', () => setIsPlaying(false));
      const unsubBuffering = radioPlayer.on('buffering', () => setIsLoading(true));
      const unsubStopped = radioPlayer.on('stopped', () => { setIsPlaying(false); setActiveStream(null); });
      const unsubError = radioPlayer.on('error', (err) => { console.error("Native Radio Error:", err); setIsLoading(false); });
      
      return () => {
        unsubPlaying();
        unsubPaused();
        unsubBuffering();
        unsubStopped();
        unsubError();
      };
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    
    if (isPlaying && activeStream) {
      window.dispatchEvent(new CustomEvent("stop-quran-audio"));
      if (activeStream.type === "radio") {
        let src = activeStream.streamUrl || activeStream.url;
        
        if (radioPlayer.isNativeMode) {
          // Native Android ExoPlayer connects directly to streams! No proxy/CORS needed.
          if (src) {
             radioPlayer.play(src, activeStream.name || "Live Radio", activeStream.iconUrl || "");
          }
          if (audio) { audio.pause(); audio.removeAttribute("src"); audio.load(); } // Definitive stop for HTML5
        } else {
          // Web needs proxy to solve CORS and Mixed Content Limitations
          if (src && !src.startsWith('/api/proxy') && !src.includes('/api/proxy')) {
            src = `/api/proxy/stream?url=${encodeURIComponent(src)}`;
          }

          if (src) {
            let base = API_BASE || window.location.origin;
            
            if (!base || base.startsWith("capacitor://") || base.includes("localhost")) {
              base = "https://ais-pre-oci535fuagpr75jdwcw57v-955809935515.europe-west2.run.app";
            }
            
            const absoluteSrc = src.startsWith("http") ? src : `${base}${src}`;

            if (audio) {
              if (audio.src !== absoluteSrc) {
                audio.src = absoluteSrc;
                audio.load();
              }
              audio.play().catch(e => console.warn("Live stream playback failed:", e));
            }
          }
        }
      } else {
        // TV stream plays video/audio inside Watch page iframe; pause background audio element
        if (audio) audio.pause();
        if (radioPlayer.isNativeMode) radioPlayer.pause();
      }
    } else {
      if (audio) audio.pause();
      // Don't call stop(), just pause() to keep notification in paused state
      if (radioPlayer.isNativeMode) radioPlayer.pause();
    }
  }, [isPlaying, activeStream]);

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
        audioRef
      }}
    >
      {children}
      {/* Hidden global audio element for Web only */}
      <audio 
        ref={audioRef} 
        className="hidden" 
        preload="none"
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onStalled={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onError={() => {
          console.error("Audio error:", audioRef.current?.error);
          setIsLoading(false);
        }}
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
