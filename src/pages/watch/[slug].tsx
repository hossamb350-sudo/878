import { useEffect, useState, useCallback } from "react";
import { SEO } from "../../components/SEO";
import { extractIdFromSlug, generateSlug, routes } from "../../utils/routes";
import { shareContent } from "../../utils/share";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../../firebase";
import { SyncService } from "../../services/SyncService";
import { VideoItem } from "../../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  ArrowRight, Eye, Calendar, Play, Share2, Clock, Bookmark, 
  Maximize, Monitor, Volume2, Settings, Video as VideoIcon,
  Facebook, MessageCircle, Send, Check
} from "lucide-react";
import { LeaderCustomPlayer } from "../../components/leader/LeaderCustomPlayer";
import { motion, AnimatePresence } from "motion/react";
import { getShareableUrl } from "../../config/apiConfig";
import { useLiveStream } from "../../context/LiveStreamContext";

export function WatchItem() {
  const { slug } = useParams();
  const id = extractIdFromSlug(slug || "");
  const navigate = useNavigate();
  const { stopStream } = useLiveStream();
  const [video, setVideo] = useState<VideoItem | null>(null);
  const [recentVideos, setRecentVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayVideo = useCallback(() => {
    setIsPlaying(true);
    stopStream();
    window.dispatchEvent(new CustomEvent("stop-quran-audio"));

    if (video && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: video.title || "فيديو",
        artist: "منصة تعز الإعلامية",
        artwork: video.thumbnailUrl ? [{ src: video.thumbnailUrl }] : []
      });
    }
  }, [stopStream, video]);

  // Handle postMessage from YouTube iframe if played directly inside iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data === 'string' && event.data.includes("infoDelivery")) {
          const data = JSON.parse(event.data);
          if (data.event === 'infoDelivery' && data.info && data.info.playerState === 1) {
            handlePlayVideo();
          }
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handlePlayVideo]);

  useEffect(() => {
    if (video) {
    }
  }, [video]);

  useEffect(() => {
    if (video) {
      const saved = localStorage.getItem("favorite_items");
      if (saved) {
        try {
          const favs = JSON.parse(saved);
          setIsFavorited(favs.some((item: any) => item.id === video.id));
        } catch(e) {}
      }
    }
  }, [video]);

  const toggleBookmark = () => {
    if (!video) return;
    const saved = localStorage.getItem("favorite_items");
    let favs: any[] = saved ? JSON.parse(saved) : [];
    
    if (isFavorited) {
      favs = favs.filter((item: any) => item.id !== video.id);
      setIsFavorited(false);
    } else {
      favs.push({
        id: video.id,
        type: "watch",
        title: video.title,
        imageUrl: video.thumbnailUrl,
        savedAt: Date.now()
      });
      setIsFavorited(true);
    }
    localStorage.setItem("favorite_items", JSON.stringify(favs));
  };

  const getEmbedUrl = (url: string, autoPlay: boolean = false) => {
    if (!url) return undefined;
    let videoId = "";
    
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        videoId = match[2];
        return `https://www.youtube.com/embed/${videoId}?rel=0&enablejsapi=1&autoplay=${autoPlay ? 1 : 0}`;
      }
    }
    
    if (url.includes("/w/") || url.includes("/videos/watch/")) {
      const embedUrl = url.replace("/w/", "/videos/embed/").replace("/videos/watch/", "/videos/embed/");
      return autoPlay ? `${embedUrl}?autoplay=1` : embedUrl;
    }
    
    return url;
  };

  useEffect(() => {
    if (!id) return;
    
    const fetchVideoAndSuggestions = async () => {
      try {
        setLoading(true);
        const cachedVideos = await SyncService.getCache<VideoItem>("videos");
        
        let foundVideo = cachedVideos.find(v => v.id === id) || null;
        if (foundVideo) {
          setVideo(foundVideo);
        } else {
          const docRef = doc(db, "videos", id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            foundVideo = { id: docSnap.id, ...docSnap.data() } as VideoItem;
            setVideo(foundVideo);
          } else {
            setError(true);
          }
        }

        const list = cachedVideos.filter(v => v.id !== id);
        list.sort((a, b) => {
          const aOrder = a.order !== undefined && a.order !== null ? Number(a.order) : Infinity;
          const bOrder = b.order !== undefined && b.order !== null ? Number(b.order) : Infinity;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return b.createdAt - a.createdAt;
        });
        setRecentVideos(list.slice(0, 6));

        if (foundVideo) {
          try {
            await updateDoc(doc(db, "videos", id), {
              views: increment(1)
            });
          } catch(e) {}
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideoAndSuggestions();
  }, [id]);

  const handleShare = async (platform: string) => {
    if (!video) return;
    if (typeof navigator.share !== "undefined") {
      const res = await shareContent({
        title: video.title,
        type: "video",
        id: video.id || id,
        imageUrl: video.thumbnailUrl
      });
      if (res.native) {
        return;
      }
    }
    const url = getShareableUrl(`/watch/${video.id || id}`);
    const text = video.title || "";
    if (platform === "copy") {
      await navigator.clipboard.writeText(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
      return;
    }
    let shareUrl = "";
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      default:
        return;
    }
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=500,noopener,noreferrer");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] w-full flex flex-col items-center justify-center space-y-3.5 font-cairo" dir="rtl">
        <div className="w-10 h-10 border-3 border-slate-200 dark:border-stone-700 border-t-taiz-royal dark:border-t-taiz-sky rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 font-cairo">
          جاري التحميل...
        </p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="max-w-4xl mx-auto p-4 py-20 text-center font-sans rtl" dir="rtl">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <VideoIcon className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-black mb-2 text-slate-900 font-ibm">المحتوى غير موجود</h2>
        <p className="text-slate-500 mb-6 font-bold">ربما قد تم إزالته من قبل الإدارة أو تم كتابته بشكل غير دقيق.</p>
        <button 
          onClick={() => navigate(-1)}
          className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-red-600/20 hover:scale-105 transition"
        >
          عودة لقسم ميديا
        </button>
      </div>
    );
  }


  // Date Formatter
  const formatPublishInfo = (timestamp: number) => {
    const d = new Date(timestamp || Date.now());
    const mDate = format(d, "dd MMMM yyyy", { locale: ar });
    let hDate = "";
    try {
      const formatted = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(d).trim();
      hDate = formatted.endsWith("هـ") ? formatted : `${formatted} هـ`;
    } catch {
      hDate = "";
    }
    return { mDate, hDate };
  };
  const { mDate, hDate } = formatPublishInfo(video?.createdAt || Date.now());
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="min-h-screen bg-surface-main text-text-primary py-3 sm:py-5 px-3 sm:px-4 md:px-6 font-cairo pb-20 transition-colors duration-300 relative select-none"
      dir="rtl"
    >
      <SEO 
        title={video.title}
        description={video.description || video.title}
        imageUrl={video.thumbnailUrl || ""}
        type="video.other"
        path={window.location.pathname}
      />

      <div className="max-w-4xl mx-auto w-full space-y-3.5">
        
        {/* Navigation Breadcrumb Bar */}
        <div className="flex items-center justify-between bg-surface-card rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-border-light shadow-soft text-xs">
          <Link
            to={routes.watch()}
            className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white hover:text-taiz-sky dark:hover:text-sky-300 transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 text-taiz-sky dark:text-white" />
            <span className="text-slate-800 dark:text-white">قسم ميديا</span>
            <span className="text-slate-400 dark:text-slate-300">/</span>
            <span className="text-slate-800 dark:text-white font-bold truncate max-w-[200px] sm:max-w-xs">
              عرض مرئي
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleBookmark}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isFavorited
                  ? "bg-taiz-sky text-white"
                  : "bg-surface-hover hover:bg-surface-hover/80 text-text-muted hover:text-text-primary"
              }`}
              title="حفظ"
            >
              <Bookmark className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 1. VIDEO VIEW COMPONENT (Single Unified Card) */}
        {/* ============================================================== */}
        <div className="relative rounded-[20px] sm:rounded-[24px] bg-surface-card border border-border-light overflow-hidden shadow-soft mb-6 sm:mb-8">
          {/* Embedded Custom Video Player */}
          <LeaderCustomPlayer
            videoUrl={video.url}
            thumbnailUrl={video.thumbnailUrl}
            title={video.title}
            onPlay={handlePlayVideo}
            isEmbedded={true}
          />

          {/* Video Metadata & Details inside same card */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-light pb-2.5">
              <div className="flex items-center gap-3 text-xs text-text-muted font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{mDate}</span>
                </span>
                {hDate && <span className="text-slate-500">{hDate}</span>}
              </div>
              <div className="flex items-center gap-1 text-xs text-text-muted font-medium">
                <Eye className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                <span>{(video.views || 0).toLocaleString("ar-EG")} مشاهدة</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-base sm:text-xl font-bold leading-snug text-text-primary font-cairo">
              {video.title}
            </h1>

            {/* Description */}
            {video.description && (
              <div className="p-3 sm:p-3.5 rounded-xl bg-surface-hover border border-border-light text-text-secondary text-xs sm:text-sm font-tajawal leading-relaxed whitespace-pre-line">
                {video.description}
              </div>
            )}
            
            {/* Social Sharing Bar */}
            <div className="bg-[#fafafa]/90 dark:bg-[#070F1E] border border-slate-200/70 dark:border-[#1E355B] rounded-full px-3.5 sm:px-5 py-2 sm:py-2.5 shadow-xs flex items-center justify-between max-w-full mx-auto backdrop-blur-sm mt-4">
              <button 
                onClick={toggleBookmark}
                className={`p-2 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${isFavorited ? 'text-taiz-sky' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                title="حفظ"
              >
                <Bookmark className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>

              <div className="flex items-center gap-2" dir="ltr">
                <button 
                  onClick={() => handleShare("telegram")} 
                  className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-slate-200 dark:border-[#1E355B] bg-white dark:bg-[#0D1A33] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#14274B] hover:text-sky-400 transition-all duration-200 cursor-pointer shadow-2xs"
                  title="مشاركة عبر تليجرام"
                >
                  <Send className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleShare("facebook")} 
                  className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-slate-200 dark:border-[#1E355B] bg-white dark:bg-[#0D1A33] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#14274B] hover:text-blue-600 transition-all duration-200 cursor-pointer shadow-2xs"
                  title="مشاركة عبر فيسبوك"
                >
                  <Facebook className="w-4.5 h-4.5" />
                </button>
                <button 
                  onClick={() => handleShare("twitter")} 
                  className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-slate-200 dark:border-[#1E355B] bg-white dark:bg-[#0D1A33] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#14274B] hover:text-black dark:hover:text-white transition-all duration-200 cursor-pointer shadow-2xs"
                  title="مشاركة عبر إكس"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                <button 
                  onClick={() => handleShare("whatsapp")} 
                  className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-slate-200 dark:border-[#1E355B] bg-white dark:bg-[#0D1A33] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#14274B] hover:text-emerald-500 transition-all duration-200 cursor-pointer shadow-2xs"
                  title="مشاركة عبر واتساب"
                >
                  <MessageCircle className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
