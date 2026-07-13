import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import { SyncService } from "../services/SyncService";
import { VideoItem } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  ArrowRight, Eye, Calendar, Play, Share2, Clock, Bookmark, 
  Maximize, Monitor, Volume2, Settings, Video as VideoIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function WatchItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoItem | null>(null);
  const [recentVideos, setRecentVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

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

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    let videoId = "";
    
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        videoId = match[2];
        return `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=0`;
      }
    }
    
    if (url.includes("/w/") || url.includes("/videos/watch/")) {
      return url.replace("/w/", "/videos/embed/").replace("/videos/watch/", "/videos/embed/");
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

  const handleShare = () => {
    if (!video) return;
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: `شاهد: ${video.title}\nعبر منصة تغذية شاهد الإعلامية`,
        url: window.location.href
      }).catch(err => console.debug("Share failed", err));
    } else {
      navigator.clipboard.writeText(window.location.href);
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
        <h2 className="text-2xl font-black mb-2 text-slate-900 font-cairo">المحتوى غير موجود</h2>
        <p className="text-slate-500 mb-6 font-bold">ربما قد تم إزالته من قبل الإدارة أو تم كتابته بشكل غير دقيق.</p>
        <button 
          onClick={() => navigate(-1)}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-blue-600/20 hover:scale-105 transition"
        >
          عودة لقسم شاهد
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans rtl select-none" dir="rtl">
      
      {/* 1. Pro Player Section (Full Width Top) */}
      <div className="relative aspect-video w-full bg-black overflow-hidden group">
        <iframe 
          src={getEmbedUrl(video.url)} 
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture"
        ></iframe>
        
        {/* Immersive Overlay UI (Top controls only as requested) */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-start p-4 sm:p-5 opacity-100 bg-gradient-to-b from-black/40 via-transparent to-transparent">
          {/* Top Control Bar */}
          <div className="flex items-center justify-between pointer-events-auto">
            <button 
              onClick={() => navigate(-1)}
              className="bg-black/30 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-black border border-white/10 font-cairo"
            >
              <ArrowRight className="w-3.5 h-3.5" /> عودة لقسم شاهد مرئي
            </button>
            <div className="flex items-center gap-2.5">
              <button className="w-9 h-9 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-md text-white border border-white/10">
                <Monitor className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-md text-white border border-white/10">
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Unified Content Section (Directly after player) */}
      <div className="max-w-[800px] mx-auto">
        <div className="px-5 py-8 sm:px-8">
          {/* Title with Vertical Blue Line */}
          <div className="flex gap-4 mb-5">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-[1.3] font-cairo flex-1">
              {video.title}
            </h1>
            <div className="w-1.5 bg-blue-600 rounded-full shrink-0 h-6 mt-1.5"></div>
          </div>
          
          {/* Description Block - Only show if exists */}
          {video.description && (
            <p className="text-slate-400 text-[13px] sm:text-sm leading-[1.8] font-bold mb-8 text-right font-cairo opacity-80 line-clamp-3">
              {video.description}
            </p>
          )}
          
          {/* Separator Line */}
          <div className="h-px bg-slate-100 w-full mb-6"></div>
          
          {/* Metadata Row: Date (Right), Views (Left) */}
          <div className="flex items-center justify-between text-slate-400 font-bold text-[10px] sm:text-[11px] font-cairo mb-8">
            <div className="flex items-center gap-2">
               <Eye className="w-3.5 h-3.5 opacity-60" />
               <span>{(video.views || 2568).toLocaleString('ar-EG')} مشاهدة</span>
            </div>
            <div className="flex items-center gap-2">
               <span>{format(video.createdAt, "dd MMMM yyyy", { locale: ar })}</span>
               <Calendar className="w-3.5 h-3.5 opacity-60" />
            </div>
          </div>
          
          {/* Action Buttons Row */}
          <div className="flex gap-3 mb-12">
            <button 
              onClick={handleShare}
              className="flex-[1.5] bg-blue-600 text-white rounded-xl py-3.5 px-6 flex items-center justify-center gap-2 font-black text-xs shadow-lg shadow-blue-600/20 active:scale-95 transition-transform font-cairo"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة المحتوى</span>
            </button>
            <button 
              onClick={toggleBookmark}
              className={`flex-1 bg-white text-slate-600 border border-slate-200 rounded-xl py-3.5 px-6 flex items-center justify-center gap-2 font-black text-xs active:scale-95 transition-transform font-cairo ${isFavorited ? 'text-blue-600 border-blue-100 bg-blue-50/50' : ''}`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
              <span>حفظ</span>
            </button>
          </div>
        </div>

        {/* 3. Horizontal Carousel: "See Also" */}
        <div className="pb-12">
          <div className="flex gap-3 mb-6 px-5 sm:px-8">
            <h2 className="text-lg font-black text-slate-900 font-cairo">شاهد أيضاً</h2>
            <div className="w-1 bg-blue-600 rounded-full h-5 mt-1.5"></div>
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
                  to={`/watch/${vid.id}`} 
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
                         <Play className="w-5 h-5 fill-blue-600 text-blue-600 translate-x-[-1px]" />
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
