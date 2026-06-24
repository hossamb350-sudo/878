import { useEffect, useState, useRef } from "react";
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
  Share2, 
  BookOpen, 
  Type
} from "lucide-react";
import { motion } from "motion/react";

// Helper function to translate standard video links into embeddable URLs
const getEmbedUrl = (url: string) => {
  if (!url) return "";
  const cleanUrl = url.trim();

  // Youtube match (including watch, shorts, share, embed, mobile, play lists)
  if (cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be")) {
    if (cleanUrl.includes("/embed/")) {
      return cleanUrl;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = cleanUrl.match(regExp);
    if (match && match[2].length === 11) {
      const videoId = match[2];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
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
    return cleanUrl.replace("/w/", "/videos/embed/").replace("/videos/watch/", "/videos/embed/");
  }

  return cleanUrl;
};

export function LeaderItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState<LeaderContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Custom reading preferences (persistent via localStorage)
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem("leader_font_size");
    return saved ? parseInt(saved, 10) : 18;
  });
  
  const [readingTheme, setReadingTheme] = useState<"default" | "sepia" | "night">(() => {
    const saved = localStorage.getItem("leader_reading_theme");
    return (saved as any) || "default";
  });

  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem("leader_font_size", fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("leader_reading_theme", readingTheme);
  }, [readingTheme]);

  // Fetch document & Views Incrementation
  useEffect(() => {
    if (!id) return;
    
    const fetchLeaderContent = async () => {
      try {
        const docRef = doc(db, "leader", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const itemData = { id: docSnap.id, ...docSnap.data() } as LeaderContent;
          setContent(itemData);
          
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
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderContent();
  }, [id]);

  // Track scrolling progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(currentProgress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
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
    if (navigator.share) {
      navigator.share({
        title: content.title,
        text: `بشأن: ${content.title}\nمن السيد القائد حفظه الله`,
        url: window.location.href,
      }).catch(err => console.debug("Share failed", err));
    } else {
      handleCopyText();
      alert("تم نسخ رابط وتفاصيل المادة لمشاركتها!");
    }
  };

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto p-4 py-12 animate-pulse font-sans">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 w-16 rounded mb-8"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-800 w-4/5 rounded-xl mb-6"></div>
        <div className="h-6 bg-gray-100 dark:bg-gray-800/60 w-1/3 rounded mb-10"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 w-full rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 w-11/12 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 w-10/12 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 w-full rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="max-w-[800px] mx-auto p-4 py-20 text-center font-sans">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Quote className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-black mb-2 text-stone-900 dark:text-white">المادة غير موجودة</h2>
        <p className="text-gray-500 mb-6 font-bold">قد يكون تم سحبها أو أن الرابط غير دقيق.</p>
        <button 
          onClick={() => navigate(-1)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold transition duration-300 inline-flex items-center gap-2 shadow-lg"
        >
          <ArrowRight className="w-4 h-4" /> العودة لقسم السيد القائد
        </button>
      </div>
    );
  }

  // Calculate stats
  const wordCount = content.content.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 170); // Estimating 170 words per minute for Arabic

  // Render paragraph function highlighting Quranic quotes ﴿﴾ with golden style
  const renderParagraph = (text: string, idx: number) => {
    if (!text.trim()) return null;

    // Detect if statement is a block quote or section header
    const isSubHeader = text.startsWith("###") || text.startsWith("##") || text.split(" ").slice(0, 3).join(" ").includes("المحور") || text.startsWith("-");
    if (isSubHeader) {
      const cleanText = text.replace(/^[#-\s]+/, "");
      return (
        <h3 key={idx} className="text-xl md:text-2xl font-black text-emerald-800 dark:text-emerald-400 mt-8 mb-4 border-r-4 border-emerald-600 pr-3 leading-relaxed">
          {cleanText}
        </h3>
      );
    }

    const quranRegex = /﴿([^﴾]+)﴾/g;
    const parts = [];
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
          className="text-amber-700 dark:text-amber-500 font-serif font-black bg-amber-500/[0.04] px-1.5 py-0.5 rounded border border-amber-500/10 inline-block leading-loose text-center mx-1 shadow-sm"
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
        className="leading-extra-relaxed md:leading-loose text-justify pb-5 tracking-wide antialiased"
        style={{ fontSize: `${fontSize}px` }}
      >
        {parts.length > 0 ? parts : text}
      </p>
    );
  };

  // Determine paper background color theme
  const getThemeClass = () => {
    switch (readingTheme) {
      case "sepia":
        return "bg-[#FAF5EB] text-[#2E251E] border-[#EADFCB] dark:bg-[#FAF5EB] dark:text-[#2E251E]";
      case "night":
        return "bg-[#0B0F19] text-[#CBD5E1] border-slate-900";
      default:
        return "bg-white dark:bg-gray-950 text-stone-900 dark:text-gray-100 border-gray-150 dark:border-gray-900";
    }
  };

  return (
    <div className="max-w-[840px] mx-auto p-4 py-8 font-sans transition-colors relative">
      
      {/* Sticky Scroll Progress bar at the top */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-gray-100 dark:bg-zinc-900 z-50">
        <div 
          className="h-full bg-gradient-to-l from-emerald-600 to-amber-500 transition-all duration-100" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <button 
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 font-black text-sm text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition"
      >
        <ArrowRight className="w-4 h-4" /> عودة لقسم السيد القائد
      </button>

      {/* Hero Showcase Article Card */}
      <div className={`rounded-3xl border shadow-xl p-5 md:p-10 transition-colors duration-300 relative overflow-hidden ${getThemeClass()}`} ref={cardRef}>
        
        {/* Decorative Quote Mark in background */}
        <div className="absolute left-6 top-6 opacity-5 pointer-events-none select-none">
          <Quote className="w-32 h-32 rotate-180" />
        </div>

        {/* Article Header info */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/10">
              {content.type === "video" ? <PlayCircle className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
              {content.type === "video" ? "عرض مرئي" : "خطابات ودروس"}
            </span>
          </div>

          <h1 className="text-2xl md:text-3.5xl font-extrabold leading-snug tracking-tight drop-shadow-sm mt-2">
            {content.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-bold text-stone-400 dark:text-zinc-500 pb-5 border-b border-light-gray-50 dark:border-zinc-800/60">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{format(content.createdAt, "dd MMMM yyyy", { locale: ar })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-sky-500 dark:text-sky-400" />
              <span>{(content.views || 0) + 1} مشاهدة مستمرة</span>
            </div>
          </div>
        </div>

        {content.thumbnailUrl && (
          <div className="w-full aspect-video md:max-h-[380px] rounded-3xl overflow-hidden bg-stone-100 dark:bg-zinc-900/40 border border-stone-200/50 dark:border-zinc-800/50 relative shadow-md my-6 z-10">
            <img 
              src={content.thumbnailUrl} 
              alt={content.title} 
              className="w-full h-full object-cover"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Elegant Reader Controller Box (Font Adjustment and Color Theme Selector) */}
        {content.type !== "video" && (
          <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-stone-200/50 dark:border-zinc-800/60 p-3.5 sm:p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between my-6 relative z-10 shadow-inner">
            <div className="flex items-center gap-3.5">
              <span className="text-[11px] font-black text-stone-400 dark:text-zinc-500 flex items-center gap-1">
                <Type className="w-3.5 h-3.5" />
                حجم الخط:
              </span>
              <div className="flex items-center gap-1 bg-stone-100 dark:bg-zinc-800/50 p-1.5 rounded-xl border dark:border-zinc-700/30">
                <button 
                  onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
                  className="p-1 px-2.5 hover:bg-white dark:hover:bg-zinc-700 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                  disabled={fontSize <= 14}
                  title="تصغير الخط"
                >
                  <ZoomOut className="w-3.5 h-3.5 inline" />
                </button>
                <span className="text-xs font-black min-w-[24px] text-center">{fontSize}</span>
                <button 
                  onClick={() => setFontSize(prev => Math.min(28, prev + 2))}
                  className="p-1 px-2.5 hover:bg-white dark:hover:bg-zinc-700 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                  disabled={fontSize >= 28}
                  title="تكبير الخط"
                >
                  <ZoomIn className="w-3.5 h-3.5 inline" />
                </button>
              </div>
            </div>

            {/* Reading Background Themes */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setReadingTheme("default")}
                className={`w-6 h-6 rounded-full bg-white border border-gray-300 dark:border-gray-800 flex items-center justify-center transition ${readingTheme === "default" ? "ring-2 ring-emerald-500 ring-offset-1" : ""}`}
                title="الوضع الافتراضي"
              />
              <button 
                onClick={() => setReadingTheme("sepia")}
                className={`w-6 h-6 rounded-full bg-[#FAF5EB] border border-[#EADFCB] flex items-center justify-center transition ${readingTheme === "sepia" ? "ring-2 ring-[#7F6E5D] ring-offset-1" : ""}`}
                title="الوضع الصحفي الورقي"
              />
              <button 
                onClick={() => setReadingTheme("night")}
                className={`w-6 h-6 rounded-full bg-[#0B0F19] border border-black flex items-center justify-center transition ${readingTheme === "night" ? "ring-2 ring-emerald-500 ring-offset-1" : ""}`}
                title="القراءة الليلية المريحة"
              />
            </div>

            {/* Actions: Copy & Share */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyText}
                className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${copied ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-white dark:bg-zinc-800 hover:bg-gray-50 border-stone-200/50 dark:border-zinc-700/50 text-stone-700 dark:text-zinc-200"}`}
                title="نسخ الخطاب"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "تم النسخ" : "نسخ الخطاب"}</span>
              </button>
              <button
                onClick={shareText}
                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-sm"
                title="مشاركة"
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Presentation Body */}
        <div className="relative z-10 font-serif leading-loose mt-8 select-text">
          {content.type === "video" ? (
            <div className="space-y-6">
              {/* Theater Mode Video Frame Container */}
              <div className="aspect-video w-full bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-stone-100 dark:border-zinc-900 relative">
                <iframe 
                   src={getEmbedUrl(content.content)} 
                   className="w-full h-full border-0 absolute inset-0" 
                   allowFullScreen
                   allow="autoplay; encrypted-media; picture-in-picture"
                ></iframe>
              </div>
              
              {/* Secondary details on the video under player */}
              <div className="bg-stone-50 dark:bg-zinc-900/30 p-5 rounded-2xl border border-stone-100 dark:border-zinc-800/50 space-y-3 font-sans">
                <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
                  ملاحظات ومحاور المقطع المعروض:
                </h4>
                <p className="text-sm text-stone-600 dark:text-zinc-300 leading-relaxed text-justify whitespace-pre-line">
                  {content.description || `يمكنكم متابعة المحاضرة بالكامل من خلال المشغل أعلاه. هذا المقطع يركز على الدروس والعِبَر الروحية المستمدة من آيات الله والوقائع المعاصرة لبناء المجتمع القرآني المتمسك بهويته الدينية في مواجهة الطغيان.`}
                </p>
                <div className="pt-2 flex justify-end gap-2">
                  <button 
                    onClick={shareText}
                    className="px-4 py-2 bg-zinc-100 hover:bg-stone-200 text-stone-800 dark:bg-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    مشاركة رابط المادة
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Formatted paragraph reading mode
            <div className="space-y-1">
              {content.content.split("\n").map((para, pIdx) => renderParagraph(para, pIdx))}
            </div>
          )}
        </div>

        {/* Calligraphic/Slogan Footer block for the Speech */}
        {content.type !== "video" && (
          <div className="mt-12 pt-8 border-t border-stone-200/50 dark:border-zinc-800/50 text-center font-sans">
            <Quote className="w-8 h-8 mx-auto text-emerald-600/30 dark:text-emerald-400/30 mb-3" />
            <p className="text-sm font-black text-emerald-800 dark:text-emerald-400">انتهى خطاب السيد القائد</p>
          </div>
        )}
      </div>
    </div>
  );
}
