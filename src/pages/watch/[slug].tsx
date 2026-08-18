import { useEffect, useState, useCallback } from "react";
import { updateMetadata } from "../../utils/metadata";
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
  Maximize, Monitor, Volume2, Settings, Video as VideoIcon
} from "lucide-react";
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
  }, [stopStream]);

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
      updateMetadata({
        title: video.title,
        description: video.description || "",
        imageUrl: video.thumbnailUrl || "",
        type: "video.other",
        path: window.location.pathname
      });
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

  const handleShare = async () => {
    if (!video) return;
    const res = await shareContent({
      title: video.title,
      type: "video",
      id: video.id || id,
      imageUrl: video.thumbnailUrl
    });
    if (res.success && !res.native) {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1000px] mx-auto p-4 py-12 animate-pulse font-sans">
        <div className="space-y-8">
          <div className="aspect-video w-full bg-slate-100 rounded-[2.5rem]"></div>
          <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100">
             <div className="h-10 bg-slate-100 w-3/4 rounded-2xl mb-6"></div>
             <div className="h-4 bg-slate-100 w-full rounded mb-2"></div>
             <div className="h-4 bg-slate-100 w-5/6 rounded mb-8"></div>
             <div className="grid grid-cols-2 gap-4">
                <div className="h-14 bg-slate-100 rounded-2xl"></div>
                <div className="h-14 bg-slate-100 rounded-2xl"></div>
             </div>
          </div>
        </div>
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

  return (
    <div className="min-h-screen bg-white font-sans rtl select-none" dir="rtl">
      
      {/* 1. Pro Player Section (Full Width Top) */}
      <div className="relative aspect-video w-full bg-black overflow-hidden group">
        {isPlaying ? (
          <iframe 
            src={getEmbedUrl(video.url, true)} 
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
          ></iframe>
        ) : (
          <div 
            onClick={handlePlayVideo}
            className="relative w-full h-full cursor-pointer flex items-center justify-center bg-stone-900 group"
          >
            {video.thumbnailUrl ? (
              <img 
                src={video.thumbnailUrl} 
                alt={video.title} 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-stone-900 to-black flex items-center justify-center">
                <VideoIcon className="w-16 h-16 text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 border border-white/20 transform group-hover:scale-110 transition-all duration-300">
                <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 fill-current" />
              </div>
            </div>
          </div>
        )}
        
        {/* Immersive Overlay UI (Top controls) */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
          <button 
            onClick={handleShare}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 hover:bg-red-600 transition-all active:scale-90"
            title="مشاركة"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button 
            onClick={toggleBookmark}
            className={`w-8 h-8 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/10 transition-all active:scale-90 ${isFavorited ? 'text-red-500 bg-white/20' : 'text-white hover:text-red-400'}`}
            title="حفظ"
          >
            <Bookmark className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Unified Content Section (Directly after player) */}
      <div className="max-w-[800px] mx-auto">
        <div className="px-5 sm:px-8 pb-6 pt-6 border-b border-stone-100 dark:border-stone-800">
          {/* Back Button Above Title */}
          <button 
            onClick={() => navigate(-1)}
            className="mb-4 text-red-600 flex items-center gap-1.5 text-xs font-black hover:gap-2 transition-all font-cairo cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" /> العودة لقسم ميديا
          </button>
          
          <span className="inline-block px-2 py-0.5 bg-red-600 text-white font-bold text-[10px] sm:text-xs rounded mb-2 font-cairo">
            عرض مرئي
          </span>
          
          <h1 className="font-bold text-stone-900 dark:text-white leading-normal mb-3 font-cairo text-xl sm:text-2xl">
            {video.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[10px] sm:text-xs text-stone-400 font-normal font-ibm">
            <span>{format(video.createdAt, "dd MMMM yyyy", { locale: ar })}</span>
            <span className="text-stone-200 dark:text-stone-700">|</span>
            <span className="text-red-500 flex items-center gap-1 font-semibold animate-pulse">
              <Eye className="w-3 h-3 text-red-600 shrink-0" />
              <span>{(video.views || 2568).toLocaleString('ar-EG')} مشاهدة</span>
            </span>
          </div>
        </div>

        <div className="px-5 sm:px-8 py-8">
          {/* Description Block - Only show if exists */}
          {video.description && (
            <div className="bg-stone-50 dark:bg-stone-800/30 p-6 rounded-2xl border border-stone-100 dark:border-stone-800/40 mb-6">
              <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed font-bold font-ibm whitespace-pre-line">
                {video.description}
              </p>
            </div>
          )}
          
          <div className="flex gap-3">
            <button 
              onClick={handleShare}
              className="flex-1 bg-red-600 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-bold text-xs shadow-lg shadow-red-600/20 font-ibm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة المحتوى</span>
            </button>
            <button 
              onClick={toggleBookmark}
              className={`flex-1 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-bold text-xs font-ibm ${isFavorited ? 'text-red-600 border-red-100 bg-red-50/50' : ''}`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
              <span>حفظ</span>
            </button>
          </div>
        </div>
        
        {/* 3. Horizontal Carousel: "See Also" */}
        <div className="pb-12">
          <div className="flex gap-3 mb-6 px-5 sm:px-8">
            <h2 className="text-lg font-black text-slate-900 font-ibm">شاهد أيضاً</h2>
            <div className="w-1 bg-red-600 rounded-full h-5 mt-1.5"></div>
          </div>
          
          {/* Horizontal Scroll Container */}
          <div 
            className="flex gap-4 overflow-x-auto px-5 sm:px-8 pb-4 no-scrollbar scroll-smooth"
            style={{ 
              scrollbarWidth: "none", 
              msOverflowStyle: "none",
              direction: "rtl",
              WebkitOverflowScrolling: "touch"
            }}
          >
            <AnimatePresence>
              {recentVideos.map((vid) => (
                <Link 
                  key={vid.id}
                  to={routes.watchItem(generateSlug(vid.title || "", vid.id))} 
                  className="flex-shrink-0 w-[75vw] sm:w-[320px] group block"
                >
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 mb-3.5">
                    {vid.thumbnailUrl ? (
                      <img 
                        src={vid.thumbnailUrl} 
                        alt={vid.title} 
                        className="w-full h-full object-cover transition duration-500 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                        <VideoIcon className="w-8 h-8 text-white/20" />
                      </div>
                    )}
                    
                    {/* Centered Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                         <Play className="w-5 h-5 fill-blue-600 text-red-600 translate-x-[-1px]" />
                      </div>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-2 py-1 rounded-lg border border-white/10">
                      {vid.duration || "2:45"}
                    </div>
                  </div>
                  
                  <div className="text-right px-1">
                    <h3 className="font-black text-slate-800 text-sm leading-snug mb-2 line-clamp-2 font-cairo">
                      {vid.title}
                    </h3>
                    <div className="text-slate-400 text-[10px] font-bold font-cairo">
                      {format(vid.createdAt || Date.now(), "dd MMMM yyyy", { locale: ar })}
                    </div>
                  </div>
                </Link>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
