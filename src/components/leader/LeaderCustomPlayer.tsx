import React, { useState } from "react";
import { Play } from "lucide-react";
import { IslamicGeometricPattern } from "./LeaderIslamicOrnaments";

interface LeaderCustomPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
  onPlay?: () => void;
  className?: string;
  isEmbedded?: boolean;
}

export const LeaderCustomPlayer: React.FC<LeaderCustomPlayerProps> = ({
  videoUrl,
  thumbnailUrl,
  title,
  onPlay,
  className = "",
  isEmbedded = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // URL parsing helper
  const getEmbedUrl = (url: string, autoPlay: boolean = false) => {
    if (!url) return "";
    const cleanUrl = url.trim();

    // YouTube parser
    if (cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be")) {
      if (cleanUrl.includes("/embed/")) {
        const base = cleanUrl.includes("?") ? cleanUrl : `${cleanUrl}?rel=0`;
        return `${base}&enablejsapi=1&autoplay=${autoPlay ? 1 : 0}`;
      }
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
      const match = cleanUrl.match(regExp);
      if (match && match[2].length === 11) {
        const videoId = match[2];
        return `https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}&rel=0&enablejsapi=1`;
      }
    }

    // Google Drive parser
    if (cleanUrl.includes("drive.google.com") && cleanUrl.includes("/file/d/")) {
      if (cleanUrl.includes("/view")) {
        return cleanUrl.replace("/view", "/preview");
      }
      if (!cleanUrl.includes("/preview")) {
        return cleanUrl.endsWith("/") ? `${cleanUrl}preview` : `${cleanUrl}/preview`;
      }
    }

    // Telegram parser
    if (cleanUrl.includes("t.me/") && !cleanUrl.includes("?embed=1")) {
      return cleanUrl.includes("?") ? `${cleanUrl}&embed=1` : `${cleanUrl}?embed=1`;
    }

    // Almasirah video player
    if (cleanUrl.includes("almasirah.net.ye/video?id=")) {
      return cleanUrl.replace("/video?id=", "/player?id=");
    }

    // Peertube / clean player
    if (cleanUrl.includes("/w/") || cleanUrl.includes("/videos/watch/")) {
      const embedUrl = cleanUrl.replace("/w/", "/videos/embed/").replace("/videos/watch/", "/videos/embed/");
      return autoPlay ? `${embedUrl}?autoplay=1` : embedUrl;
    }

    return cleanUrl;
  };

  const handleStartPlay = () => {
    setIsPlaying(true);
    if (onPlay) {
      onPlay();
    }
  };

  const embedSrc = getEmbedUrl(videoUrl, true);
  const isDirectVideo = videoUrl?.endsWith(".mp4") || videoUrl?.endsWith(".webm");

  return (
    <div
      className={`relative w-full overflow-hidden bg-black ${
        isEmbedded
          ? "rounded-t-[18px] sm:rounded-t-[22px]"
          : "rounded-[18px] sm:rounded-[24px] border border-slate-200/80 shadow-medium"
      } ${className}`}
      dir="rtl"
    >
      {/* Video Content Container */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {isPlaying ? (
          isDirectVideo ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : (
            <iframe
              src={embedSrc}
              title={title}
              className="w-full h-full border-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            />
          )
        ) : (
          /* Custom Video Poster & Play Trigger */
          <div
            onClick={handleStartPlay}
            className="group relative w-full h-full cursor-pointer select-none"
          >
            {/* Background Thumbnail */}
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-95 group-hover:brightness-100"
                loading="eager"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-taiz-navy via-taiz-royal to-taiz-sky flex items-center justify-center p-6">
                <img
                  src="/splash_first.png"
                  alt="السيد القائد"
                  className="w-full h-full object-contain opacity-85 group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Geometric ornament overlay */}
            <IslamicGeometricPattern opacity={0.06} className="text-white z-10" />

            {/* Dark & Brand Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none z-10" />

            {/* Prominent Centered Play Button (100% dead center) */}
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="relative flex items-center justify-center">
                {/* Subtle outer pulse wave */}
                <div className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 animate-ping opacity-30 pointer-events-none" />
                
                {/* Play Button Icon */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/30 backdrop-blur-md border-2 border-white/80 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-white/45 group-hover:border-white transition-all duration-300">
                  <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-white text-white ml-0.5 drop-shadow-md" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
