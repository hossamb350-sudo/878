import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import { LeaderContent } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  ArrowRight, 
  Eye, 
  Calendar, 
  Quote, 
  ZoomIn, 
  ZoomOut, 
  Copy, 
  Check, 
  PlayCircle,
  FileText,
  Share2, Bookmark, 
  BookOpen, 
  Type,
  Sun,
  Moon,
  Plus,
  Minus,
  Clock,
  Play,
  Video as VideoIcon
} from "lucide-react";
import { motion } from "motion/react";
import { getShareableUrl } from "../config/apiConfig";
import { useLiveStream } from "../context/LiveStreamContext";

// Helper function to translate standard video links into embeddable URLs
const getEmbedUrl = (url: string, autoPlay: boolean = false) => {
  if (!url) return undefined;
  const cleanUrl = url.trim();

  // Youtube match
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

  // Google Drive match
  if (cleanUrl.includes("drive.google.com") && cleanUrl.includes("/file/d/")) {
    if (cleanUrl.includes("/view")) {
      return cleanUrl.replace("/view", "/preview");
    }
    if (!cleanUrl.includes("/preview")) {
      return cleanUrl.endsWith("/") ? `${cleanUrl}preview` : `${cleanUrl}/preview`;
    }
  }

  // Telegram post match
  if (cleanUrl.includes("t.me/") && !cleanUrl.includes("?embed=1")) {
    if (cleanUrl.includes("?")) {
      return `${cleanUrl}&embed=1`;
    } else {
      return `${cleanUrl}?embed=1`;
    }
  }

  // Almasirah standard video player
  if (cleanUrl.includes("almasirah.net.ye/video?id=")) {
    return cleanUrl.replace("/video?id=", "/player?id=");
  }

  // Almasirah or clean Peertube watch link
  if (cleanUrl.includes("/w/") || cleanUrl.includes("/videos/watch/")) {
    const embedUrl = cleanUrl.replace("/w/", "/videos/embed/").replace("/videos/watch/", "/videos/embed/");
    return autoPlay ? `${embedUrl}?autoplay=1` : embedUrl;
  }

  return cleanUrl;
};

export function LeaderItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { stopStream } = useLiveStream();
  const [content, setContent] = useState<LeaderContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const handlePlayVideo = useCallback(() => {
    setIsVideoPlaying(true);
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
  
  // Custom reading preferences
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem("leader_font_size");
    return saved ? parseInt(saved, 10) : 18;
  });
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  const [copied, setCopied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (content) {
      const saved = localStorage.getItem("favorite_items");
      if (saved) {
        try {
          const favs = JSON.parse(saved);
          setIsFavorited(favs.some((item: any) => item.id === content.id));
        } catch(e) {}
      }
    }
  }, [content]);

  const toggleDarkMode = () => {
    const current = document.documentElement.classList.contains("dark");
    if (current) {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
      localStorage.setItem("theme", "dark");
    }
  };

  const toggleBookmark = () => {
    if (!content) return;
    const saved = localStorage.getItem("favorite_items");
    let favs: any[] = saved ? JSON.parse(saved) : [];
    
    if (isFavorited) {
      favs = favs.filter((item: any) => item.id !== content.id);
      setIsFavorited(false);
    } else {
      favs.push({
        id: content.id,
        type: "leader",
        title: content.title,
        imageUrl: content.thumbnailUrl,
        savedAt: Date.now()
      });
      setIsFavorited(true);
    }
    localStorage.setItem("favorite_items", JSON.stringify(favs));
  };

  useEffect(() => {
    localStorage.setItem("leader_font_size", fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    if (!id) return;
    
    const fetchLeaderContent = async () => {
      try {
        const docRef = doc(db, "leader", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const itemData = { id: docSnap.id, ...docSnap.data() } as LeaderContent;
          setContent(itemData);
          
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
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderContent();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCopyText = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content.title + "\n\n" + content.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const shareText = () => {
    if (!content) return;
    const shareableUrl = getShareableUrl(`/leader/${id || content.id}`);
    if (navigator.share) {
      navigator.share({
        title: content.title,
        text: `بشأن: ${content.title}\nمن السيد القائد حفظه الله`,
        url: shareableUrl,
      }).catch(err => console.debug("Share failed", err));
    } else {
      handleCopyText();
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4 pt-10 space-y-6 animate-pulse">
        <div className="h-4 bg-surface-card rounded-lg w-1/4"></div>
        <div className="h-10 bg-surface-card rounded-xl w-full"></div>
        <div className="h-64 sm:h-96 bg-surface-card rounded-3xl w-full shadow-soft"></div>
        <div className="space-y-4">
           <div className="h-4 bg-surface-card rounded-lg w-full"></div>
           <div className="h-4 bg-surface-card rounded-lg w-full"></div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="max-w-3xl mx-auto p-4 py-20 text-center font-ibm rtl" dir="rtl">
        <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Quote className="w-10 h-10 text-stone-300" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-stone-900 dark:text-white font-cairo">المادة غير موجودة</h2>
        <button 
          onClick={() => navigate(-1)}
          className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition mt-4 font-cairo"
        >
          العودة لقسم السيد القائد
        </button>
      </div>
    );
  }

  const formatPublishInfo = (timestamp: number) => {
    const d = new Date(timestamp);
    const mDate = format(d, "dd MMMM yyyy'م'", { locale: ar });
    const mTime = format(d, "hh:mm a", { locale: ar });
    
    let hDate = "";
    try {
      const formatted = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(d).trim();
      hDate = formatted.endsWith("هـ") ? formatted : `${formatted} هـ`;
    } catch (e) {
      hDate = "";
    }
    
    return { mDate, mTime, hDate };
  };

  const { mDate, mTime, hDate } = formatPublishInfo(content.createdAt);

  const renderParagraph = (text: string, idx: number) => {
    if (!text.trim()) return null;

    const isSubHeader = text.startsWith("###") || text.startsWith("##") || text.split(" ").slice(0, 3).join(" ").includes("المحور") || text.startsWith("-");
    if (isSubHeader) {
      const cleanText = text.replace(/^[#-\s]+/, "");
      return (
        <h3 key={idx} className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4 border-r-4 border-red-600 pr-3 leading-relaxed font-cairo">
          {cleanText}
        </h3>
      );
    }

    const quranRegex = /﴿([^﴾]+)﴾/g;
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = quranRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(text.slice(lastIndex, matchIndex));
      }
      parts.push(
        <span 
          key={`q-${idx}-${matchIndex}`} 
          className="text-[#B8860B] font-serif font-black bg-[#DAA520]/[0.05] px-1.5 py-0.5 rounded inline-block leading-loose text-center mx-1"
          style={{ fontSize: `${fontSize + 2}px` }}
        >
          ﴿ {match[1]} ﴾
        </span>
      );
      lastIndex = quranRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return (
      <p 
        key={idx} 
        className="mb-4 leading-relaxed text-justify font-ibm"
        style={{ fontSize: `${fontSize}px` }}
      >
        {parts.length > 0 ? parts : text}
      </p>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-3xl mx-auto w-full bg-white dark:bg-stone-900 min-h-screen font-ibm transition-colors duration-300 relative"
      dir="rtl"
    >
      {/* Reading Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100/10 dark:bg-stone-800/20 z-50">
        <div 
          className="h-full bg-taiz-sky transition-all duration-75 shadow-sm" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <article className="w-full">
        {/* Edge-to-Edge Header */}
        {content.type === "video" ? (
          <div className="w-full relative aspect-video bg-black overflow-hidden group">
            {isVideoPlaying ? (
              <iframe 
                src={getEmbedUrl(content.content, true)} 
                className="w-full h-full border-0"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
              ></iframe>
            ) : (
              <div 
                onClick={handlePlayVideo}
                className="relative w-full h-full cursor-pointer flex items-center justify-center bg-stone-900 group"
              >
                {content.thumbnailUrl ? (
                  <img 
                    src={content.thumbnailUrl} 
                    alt={content.title} 
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
            
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
              <button 
                onClick={shareText}
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
        ) : (
          <div className="w-full relative aspect-[4/3] sm:aspect-video md:aspect-[16/9] max-h-[500px] bg-stone-950 overflow-hidden">
            {content.thumbnailUrl ? (
              <img 
                src={content.thumbnailUrl} 
                alt={content.title} 
                className="w-full h-full object-cover select-none" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-stone-950 via-slate-900 to-stone-900 flex items-center justify-center">
                <Quote className="w-32 h-32 text-white/10" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-0 pointer-events-none" />
            
            <div className="absolute inset-0 pointer-events-none p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-end gap-2 pointer-events-auto">
                <button 
                  onClick={shareText}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-red-600 transition-all active:scale-90"
                  title="مشاركة"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={toggleBookmark}
                  className={`w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 transition-all active:scale-90 ${isFavorited ? 'text-red-500 bg-white/20' : 'text-white hover:text-red-400'}`}
                  title="حفظ"
                >
                  <Bookmark className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Title area & Content */}
        {content.type === "video" ? (
          <div className="max-w-[800px] mx-auto">
            <div className="px-5 sm:px-8 pb-6 pt-6 border-b border-stone-100 dark:border-stone-800">
              {/* Back Button Above Title */}
              <button 
                onClick={() => navigate(-1)}
                className="mb-4 text-red-600 flex items-center gap-1.5 text-xs font-black hover:gap-2 transition-all font-cairo cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" /> العودة لقسم السيد القائد
              </button>
              
              <span className="inline-block px-2 py-0.5 bg-red-600 text-white font-bold text-[10px] sm:text-xs rounded mb-2 font-cairo">
                عرض مرئي
              </span>
              
              <h1 className="font-bold text-stone-900 dark:text-white leading-normal mb-3 font-cairo text-xl sm:text-2xl">
                {content.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[10px] sm:text-xs text-stone-400 font-normal font-ibm">
                <span>{mDate}</span>
                {hDate && (
                  <>
                    <span className="text-stone-200 dark:text-stone-700">|</span>
                    <span>{hDate}</span>
                  </>
                )}
                <span className="text-stone-200 dark:text-stone-700">|</span>
                <span className="text-red-500 flex items-center gap-1 font-semibold animate-pulse">
                  <Eye className="w-3 h-3 text-red-600 shrink-0" />
                  <span>{((content.views || 0) + 1).toLocaleString('ar-EG')} مشاهدة</span>
                </span>
              </div>
            </div>

            <div className="px-5 sm:px-8 py-8">
              {/* Description Block - Only show if exists */}
              {content.description && (
                <div className="bg-stone-50 dark:bg-stone-800/30 p-6 rounded-2xl border border-stone-100 dark:border-stone-800/40 mb-6">
                  <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed font-bold font-ibm whitespace-pre-line">
                    {content.description}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button 
                  onClick={shareText}
                  className="flex-1 bg-red-600 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-bold text-xs shadow-lg shadow-red-600/20 font-ibm cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>مشاركة المحتوى</span>
                </button>
                <button 
                  onClick={toggleBookmark}
                  className={`flex-1 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-bold text-xs font-ibm cursor-pointer ${isFavorited ? 'text-red-600 border-red-100 bg-red-50/50' : ''}`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
                  <span>حفظ</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 sm:px-8 pt-6">
              <button 
                onClick={() => navigate(-1)}
                className="mb-6 text-red-600 flex items-center gap-1.5 text-xs font-black hover:gap-2 transition-all font-ibm cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" /> العودة لقسم السيد القائد
              </button>
            </div>

            <div className="px-6 sm:px-8 pb-6 border-b border-stone-100 dark:border-stone-800">
               <span className="inline-block px-2 py-0.5 bg-red-600 text-white font-bold text-[10px] sm:text-xs rounded mb-2 font-cairo">
                  محاضرات ودروس
               </span>
               <h1 
                  className="font-bold text-stone-900 dark:text-white leading-normal mb-3 font-cairo"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {content.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[10px] sm:text-xs text-stone-400 font-normal font-ibm">
                  <span>{mDate}</span>
                  <span className="text-stone-200 dark:text-stone-700">|</span>
                  <span>{hDate}</span>
                  <span className="text-stone-200 dark:text-stone-700">|</span>
                  <span className="text-red-500 flex items-center gap-1 font-semibold animate-pulse">
                    <Eye className="w-3 h-3 text-red-600 shrink-0" />
                    <span>{(content.views || 0) + 1} مشاهدة</span>
                  </span>
                </div>
            </div>

            {/* Reading Options toolbar */}
            <div className="flex items-center justify-between py-4 px-6 sm:px-8 bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800/80 transition-colors duration-300">
              <div className="flex items-center gap-4">
                <button 
                  onClick={toggleDarkMode}
                  className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-stone-300 hover:opacity-80 transition cursor-pointer select-none font-ibm"
                >
                  <span>{isDarkMode ? "ليلي" : "نهاري"}</span>
                  {isDarkMode ? (
                    <Moon className="w-5 h-5 text-red-600 fill-indigo-400/20" />
                  ) : (
                    <Sun className="w-5 h-5 text-amber-500 fill-amber-500" />
                  )}
                </button>
              </div>

              <div className="flex items-center border border-gray-200 dark:border-stone-800 rounded-lg px-3 py-1 bg-white dark:bg-stone-900 shadow-sm text-sm font-bold text-gray-700 dark:text-stone-300 select-none font-ibm">
                <button 
                  onClick={() => setFontSize(prev => Math.min(prev + 1, 26))} 
                  className="p-1 text-gray-500 hover:text-gray-950 dark:hover:text-white transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" strokeWidth={3} />
                </button>
                <span className="mx-4 text-sm font-bold min-w-[36px] text-center">
                  {fontSize}px
                </span>
                <button 
                  onClick={() => setFontSize(prev => Math.max(prev - 1, 14))} 
                  className="p-1 text-gray-500 hover:text-gray-950 dark:hover:text-white transition cursor-pointer"
                >
                  <Minus className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="bg-white dark:bg-stone-900 transition-colors duration-300 pt-8 pb-16">
              <div className="px-6 sm:px-8">
                <div className="mb-12">
                  <div className="space-y-4">
                    <div 
                      className="prose prose-stone dark:prose-invert max-w-none text-gray-800 dark:text-stone-100 text-justify font-ibm [&_p]:mb-4 [&_p]:mt-0 [&_p]:leading-relaxed"
                      style={{ 
                        fontSize: `${fontSize}px`, 
                        lineHeight: 1.8,
                      }}
                    >
                      {content.content.split("\n").map((para, pIdx) => renderParagraph(para, pIdx))}
                    </div>

                    <div className="flex gap-3 pt-8 border-t border-stone-100 dark:border-stone-800 mt-12">
                      <button 
                        onClick={shareText}
                        className="flex-1 bg-red-600 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-bold text-xs font-cairo shadow-lg shadow-red-600/20 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>مشاركة النص</span>
                      </button>
                      <button 
                        onClick={handleCopyText}
                        className="flex-1 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-bold text-xs font-cairo cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-red-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? "تم النسخ" : "نسخ النص"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Slogan Footer */}
                <div className="mt-16 pt-8 border-t border-stone-100 dark:border-stone-800 text-center">
                  <Quote className="w-8 h-8 mx-auto text-red-600/20 mb-3" />
                  <p className="text-sm font-bold text-red-600 font-ibm">انتهى خطاب السيد القائد</p>
                </div>
              </div>
            </div>
          </>
        )}
      </article>
    </motion.div>
  );
}
