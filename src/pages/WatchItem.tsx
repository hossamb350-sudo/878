import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, updateDoc, increment, collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "../firebase";
import { SyncService } from "../services/SyncService";
import { VideoItem } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ArrowRight, Eye, Calendar, Video as VideoIcon, Play, Share2, Award, Clock } from "lucide-react";
import { motion } from "motion/react";

export function WatchItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoItem | null>(null);
  const [recentVideos, setRecentVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Parse embed URL from standard watch strings (to ensure autoplay and correct iframe rendering)
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    let videoId = "";
    
    // Youtube match
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        videoId = match[2];
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      }
    }
    
    // Almasirah or clean Peertube watch link
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

        // Suggestions from cached list
        const list = cachedVideos.filter(v => v.id !== id);
        list.sort((a, b) => {
          const aOrder = a.order !== undefined && a.order !== null ? Number(a.order) : Infinity;
          const bOrder = b.order !== undefined && b.order !== null ? Number(b.order) : Infinity;
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          return b.createdAt - a.createdAt;
        });
        setRecentVideos(list.slice(0, 8));

        // Background update for incrementing views
        if (foundVideo) {
          try {
            await updateDoc(doc(db, "videos", id), {
              views: increment(1)
            });
          } catch(e) {
            console.warn("Could not increment views", e);
          }
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideoAndSuggestions();
  }, [id]);

  const handleShare = () => {
    if (!video) return;
    const shareUrl = "https://taiz-media-platform-ye.vercel.app" + window.location.pathname;
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: `شاهد: ${video.title}\nعبر منصة تغذية شاهد الإعلامية`,
        url: shareUrl
      }).catch(err => console.debug("Share failed", err));
    } else {
      navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto p-4 py-12 animate-pulse font-sans">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video w-full bg-surface-card rounded-3xl"></div>
            <div className="h-8 bg-surface-card w-3/4 rounded-xl"></div>
            <div className="h-4 bg-surface-card w-1/4 rounded"></div>
          </div>
          <div className="space-y-4">
            <div className="h-6 bg-surface-card w-1/2 rounded mb-4"></div>
            <div className="h-20 bg-surface-card rounded-xl"></div>
            <div className="h-20 bg-surface-card rounded-xl"></div>
            <div className="h-20 bg-surface-card rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="max-w-4xl mx-auto p-4 py-20 text-center font-sans">
        <div className="w-20 h-20 bg-surface-card rounded-full flex items-center justify-center mx-auto mb-6">
          <VideoIcon className="w-10 h-10 text-text-muted" />
        </div>
        <h2 className="text-2xl font-black mb-2 text-text-primary">المحتوى غير موجود</h2>
        <p className="text-text-secondary mb-6 font-bold">ربما قد تم إزالته من قبل الإدارة أو تم كتابته بشكل غير دقيق.</p>
        <button 
          onClick={() => navigate(-1)}
          className="btn btn-primary rounded-2xl inline-flex items-center gap-2 shadow-strong"
        >
          <ArrowRight className="w-4 h-4" /> عودة لقسم شاهد
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1240px] mx-auto p-3 sm:p-5 py-6 font-sans">
      
      {/* Return line */}
      <button 
        onClick={() => navigate(-1)}
        className="mb-5 flex items-center gap-2 font-[900] text-sm text-text-secondary hover:text-text-primary transition"
      >
        <ArrowRight className="w-5 h-5" /> عودة لقسم شاهد المرئي
      </button>

      {/* Cinematic grid: Main Player on Right (Ar-RTL), Recent Suggestions on Left */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* RIGHT COLUMN: Video Player & Meta details */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Cinema Frame Wrapper with Reflection Glow */}
          <div className="bg-black rounded-3xl overflow-hidden shadow-strong border border-border-light relative group transition-all duration-500">
            <div className="aspect-video w-full">
              <iframe 
                src={getEmbedUrl(video.url)} 
                className="w-full h-full border-0"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
              ></iframe>
            </div>
          </div>

          {/* Metadata details Card */}
          <div className="bg-surface-card rounded-3xl p-6 sm:p-8 shadow-soft border border-border-light">
            
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              {video.duration && (
                <span className="bg-surface-main text-text-secondary text-[10px] font-black px-3 py-1.5 rounded-xl border border-border-light flex items-center gap-1.5 shadow-sm">
                  <Clock className="w-3.5 h-3.5" />
                  {video.duration}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-text-primary leading-[1.4] mb-6">
              {video.title}
            </h1>

            {/* Interaction Area */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-border-light">
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-text-secondary">
                <div className="flex items-center gap-1.5 bg-surface-main px-4 py-2 rounded-xl border border-border-light shadow-sm">
                  <Calendar className="w-4 h-4 text-taiz-royal" />
                  <span>{format(video.createdAt, "dd MMMM yyyy", { locale: ar })}</span>
                </div>
                
                <div className="flex items-center gap-1.5 bg-surface-main px-4 py-2 rounded-xl border border-border-light shadow-sm">
                  <Eye className="w-4 h-4 text-taiz-sky" />
                  <span>{(video.views || 0) + 1} مشاهدة</span>
                </div>
              </div>

              {/* Share button */}
              <button
                onClick={handleShare}
                className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md ${shareSuccess ? "bg-taiz-sky text-white" : "btn-primary hover:scale-105"}`}
              >
                <Share2 className="w-4 h-4" />
                <span>{shareSuccess ? "تم نسخ الرابط للنسخ" : "مشاركة المحتوى"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* LEFT COLUMN: Suggested videos sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-black text-base text-text-primary flex items-center gap-2">
              <Play className="w-5 h-5 text-taiz-sky fill-taiz-sky/20" />
              تقارير مرئية أخرى
            </h3>
            <span className="text-[10px] bg-surface-main border border-taiz-sky/20 text-taiz-sky font-black px-3 py-1 rounded-xl shadow-sm">
              الجديد أولاً
            </span>
          </div>

          <div className="space-y-3.5 max-h-[700px] overflow-y-auto no-scrollbar pr-1">
            {recentVideos.length === 0 ? (
              <p className="text-text-muted text-xs text-center py-8">لا توجد توصيات أخرى حالياً</p>
            ) : (
              recentVideos.map((vid) => (
                <Link 
                  to={`/watch/${vid.id}`} 
                  key={vid.id} 
                  className="card card-hover flex gap-3 p-3 transition-all duration-300 group shadow-sm hover:translate-x-[-2px] text-right"
                >
                  {/* Miniature Thumbnail */}
                  <div className="relative w-28 sm:w-32 aspect-video rounded-xl overflow-hidden bg-taiz-navy shrink-0 border border-border-light">
                    {vid.thumbnailUrl ? (
                      <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-surface-main flex items-center justify-center">
                        <VideoIcon className="w-4 h-4 text-text-muted" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/15 flex items-center justify-center group-hover:bg-black/25 transition duration-300">
                      <Play className="w-5 h-5 text-white/90 drop-shadow-md shrink-0 fill-white" />
                    </div>
                  </div>

                  {/* MINI INFO */}
                  <div className="flex flex-col justify-between py-0.5 overflow-hidden">
                    <h4 className="text-xs font-bold leading-snug text-text-primary line-clamp-2 group-hover:text-taiz-sky transition-colors">
                      {vid.title}
                    </h4>
                    
                    <div className="text-[10px] text-text-muted font-bold flex items-center gap-1.5 mt-2">
                      <span>{format(vid.createdAt || Date.now(), "d MMM yyyy", { locale: ar })}</span>
                      <span>•</span>
                      <span>{vid.views || 0} مشاهدة</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
