import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, updateDoc, increment, collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "../firebase";
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
        const docRef = doc(db, "videos", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const videoData = { id: docSnap.id, ...docSnap.data() } as VideoItem;
          setVideo(videoData);
          
          // Increment views
          try {
            await updateDoc(docRef, {
              views: increment(1)
            });
          } catch(e) {
            console.warn("Could not increment views", e);
          }
        } else {
          setError(true);
        }

        // Fetch other suggestions (excluding current one)
        const snap = await getDocs(collection(db, "videos"));
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as VideoItem))
          .filter(v => v.id !== id);
        list.sort((a, b) => {
          const aOrder = a.order !== undefined && a.order !== null ? Number(a.order) : Infinity;
          const bOrder = b.order !== undefined && b.order !== null ? Number(b.order) : Infinity;
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          return b.createdAt - a.createdAt;
        });
        setRecentVideos(list.slice(0, 8));

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
      <div className="max-w-[1200px] mx-auto p-4 py-12 animate-pulse font-sans">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video w-full bg-gray-200 dark:bg-zinc-800 rounded-3xl"></div>
            <div className="h-8 bg-gray-200 dark:bg-zinc-800 w-3/4 rounded-xl"></div>
            <div className="h-4 bg-gray-150 dark:bg-zinc-800/60 w-1/4 rounded"></div>
          </div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-zinc-800 w-1/2 rounded mb-4"></div>
            <div className="h-20 bg-gray-150 dark:bg-zinc-800/60 rounded-xl"></div>
            <div className="h-20 bg-gray-150 dark:bg-zinc-800/60 rounded-xl"></div>
            <div className="h-20 bg-gray-150 dark:bg-zinc-800/60 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="max-w-4xl mx-auto p-4 py-20 text-center font-sans">
        <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <VideoIcon className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-black mb-2 text-stone-900 dark:text-white">التقرير المقرون غير موجود</h2>
        <p className="text-gray-500 mb-6 font-bold">ربما قد تم إزالته من قبل الإدارة أو تم كتابته بشكل غير دقيق.</p>
        <button 
          onClick={() => navigate(-1)}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-bold transition inline-flex items-center gap-2 shadow-lg"
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
        className="mb-5 flex items-center gap-2 font-black text-sm text-gray-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition"
      >
        <ArrowRight className="w-4 h-4" /> عودة لقسم شاهد المرئي
      </button>

      {/* Cinematic grid: Main Player on Right (Ar-RTL), Recent Suggestions on Left */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* RIGHT COLUMN: Video Player & Meta details */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Cinema Frame Wrapper with Reflection Glow */}
          <div className="bg-black dark:bg-[#090b11] rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-zinc-800 relative group transition-all duration-500">
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
          <div className="bg-white dark:bg-zinc-950 rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-100 dark:border-zinc-900/60">
            
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="bg-red-100/70 text-red-700 dark:bg-red-950/30 dark:text-red-400 text-[10px] font-black tracking-wider px-3 py-1 rounded-full border border-red-500/10 flex items-center gap-1 uppercase">
                <Award className="w-3.5 h-3.5" />
                شاهد الإعلامي
              </span>
              {video.duration && (
                <span className="bg-stone-50 dark:bg-zinc-900 text-stone-500 dark:text-zinc-400 text-[10px] font-black px-2.5 py-1 rounded-md border border-stone-150 dark:border-zinc-800/30 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {video.duration}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2.5xl font-extrabold text-[#111827] dark:text-white leading-snug mb-5">
              {video.title}
            </h1>

            {/* Interaction Area */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-stone-150/40 dark:border-zinc-900">
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-stone-400 dark:text-zinc-500">
                <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-stone-100 dark:border-zinc-800">
                  <Calendar className="w-4 h-4 text-red-600 dark:text-red-500" />
                  <span>{format(video.createdAt, "dd MMMM yyyy", { locale: ar })}</span>
                </div>
                
                <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-stone-100 dark:border-zinc-800">
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                  <span>{(video.views || 0) + 1} مشاهدة</span>
                </div>
              </div>

              {/* Share button */}
              <button
                onClick={handleShare}
                className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm ${shareSuccess ? "bg-emerald-500 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
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
            <h3 className="font-extrabold text-base text-[#111827] dark:text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-red-600 fill-red-600/20" />
              تفارير مرئية أخرى
            </h3>
            <span className="text-[10px] bg-red-50 dark:bg-red-950/20 border border-red-500/10 text-red-700 dark:text-red-400 font-extrabold px-2 py-0.5 rounded-md">
              الجديد أولاً
            </span>
          </div>

          <div className="space-y-3.5 max-h-[700px] overflow-y-auto no-scrollbar pr-1">
            {recentVideos.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-8">لا توجد توصيات أخرى حالياً</p>
            ) : (
              recentVideos.map((vid) => (
                <Link 
                  to={`/watch/${vid.id}`} 
                  key={vid.id} 
                  className="flex gap-3 bg-white dark:bg-zinc-950 hover:bg-stone-50 dark:hover:bg-zinc-900/70 p-2.5 rounded-2xl border border-stone-100/60 dark:border-zinc-900 transition-all duration-300 group shadow-sm hover:shadow-md hover:translate-x-[-2px] text-right"
                >
                  {/* Miniature Thumbnail */}
                  <div className="relative w-28 sm:w-32 aspect-video rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-stone-150 dark:border-zinc-800">
                    {vid.thumbnailUrl ? (
                      <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover group-hover:scale-103 transitionduration-500" />
                    ) : (
                      <div className="w-full h-full bg-stone-900 flex items-center justify-center">
                        <VideoIcon className="w-4 h-4 text-zinc-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/15 flex items-center justify-center group-hover:bg-black/25 transition duration-300">
                      <Play className="w-5 h-5 text-white/90 drop-shadow-md shrink-0 fill-white" />
                    </div>
                  </div>

                  {/* MINI INFO */}
                  <div className="flex flex-col justify-between py-0.5 overflow-hidden">
                    <h4 className="text-xs font-bold leading-snug text-[#111827] dark:text-zinc-100 line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {vid.title}
                    </h4>
                    
                    <div className="text-[10px] text-stone-400 dark:text-zinc-500 font-semibold flex items-center gap-1.5 mt-2">
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
