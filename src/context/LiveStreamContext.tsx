import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { LiveStream } from "../types";

interface LiveStreamContextType {
  activeStream: LiveStream | null;
  isPlaying: boolean;
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
    };

    window.addEventListener("stop-live-stream", handleStopLiveStream);
    return () => window.removeEventListener("stop-live-stream", handleStopLiveStream);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying && activeStream) {
      window.dispatchEvent(new CustomEvent("stop-quran-audio"));
      if (activeStream.type === "radio") {
        const src = activeStream.streamUrl || activeStream.url;
        if (src && audio.src !== src) {
          audio.src = src;
        }
        audio.play().catch(e => console.warn("Live stream playback failed:", e));
      } else {
        // TV stream plays video/audio inside Watch page iframe; pause background audio element
        audio.pause();
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, activeStream]);

  return (
    <LiveStreamContext.Provider
      value={{
        activeStream,
        isPlaying,
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
      {/* Hidden global audio element */}
      <audio 
        ref={audioRef} 
        className="hidden" 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
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
