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
  Share2, Bookmark, 
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
  const [isFavorited, setIsFavorited] = useState(false);

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
        <div className="h-4 bg-surface-card w-16 rounded mb-8"></div>
        <div className="h-10 bg-surface-card w-4/5 rounded-xl mb-6"></div>
        <div className="h-6 bg-surface-card w-1/3 rounded mb-10"></div>
        <div className="space-y-4">
          <div className="h-4 bg-surface-card w-full rounded"></div>
          <div className="h-4 bg-surface-card w-11/12 rounded"></div>
          <div className="h-4 bg-surface-card w-10/12 rounded"></div>
          <div className="h-4 bg-surface-card w-full rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="max-w-[800px] mx-auto p-4 py-20 text-center font-sans">
        <div className="w-20 h-20 bg-surface-card rounded-full flex items-center justify-center mx-auto mb-6">
          <Quote className="w-10 h-10 text-text-muted" />
        </div>
        <h2 className="text-2xl font-black mb-2 text-text-primary">المادة غير موجودة</h2>
        <p className="text-text-secondary mb-6 font-bold">قد يكون تم سحبها أو أن الرابط غير دقيق.</p>
        <button 
          onClick={() => navigate(-1)}
          className="btn btn-primary rounded-2xl inline-flex items-center gap-2 shadow-strong"
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
        <h3 key={idx} className="text-xl md:text-2xl font-black text-taiz-royal mt-8 mb-4 border-r-4 border-taiz-royal pr-3 leading-relaxed">
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
          className="text-[#B8860B] dark:text-[#DAA520] font-serif font-black bg-[#DAA520]/[0.05] px-1.5 py-0.5 rounded border border-[#DAA520]/20 inline-block leading-loose text-center mx-1 shadow-sm"
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
        return "bg-surface-main text-text-primary border-border-light";
    }
  };

  return (
    <div className="max-w-[840px] mx-auto p-4 py-8 font-sans transition-colors relative">
      
      {/* Sticky Scroll Progress bar at the top */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-surface-main z-50">
        <div 
          className="h-full bg-gradient-to-l from-taiz-navy to-taiz-sky transition-all duration-100" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <button 
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 font-black text-sm text-text-secondary hover:text-text-primary transition"
      >
        <ArrowRight className="w-4 h-4" /> عودة لقسم السيد القائد
      </button>

      {/* Hero Showcase Article Card */}
      <div className={`rounded-3xl border shadow-soft p-5 md:p-10 transition-colors duration-300 relative overflow-hidden ${getThemeClass()}`} ref={cardRef}>
        
        {/* Decorative Quote Mark in background */}
        <div className="absolute left-6 top-6 opacity-5 pointer-events-none select-none">
          <Quote className="w-32 h-32 rotate-180" />
        </div>

        {/* Article Header info */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider bg-taiz-royal/10 text-taiz-royal px-3 py-1 rounded-full border border-taiz-royal/20">
              {content.type === "video" ? <PlayCircle className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
              {content.type === "video" ? "عرض مرئي" : "خطابات ودروس"}
            </span>
          </div>

          <h1 className="text-2xl md:text-3.5xl font-extrabold leading-snug tracking-tight drop-shadow-sm mt-2">
            {content.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-bold text-text-secondary pb-5 border-b border-border-light">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-taiz-royal" />
              <span>{format(content.createdAt, "dd MMMM yyyy", { locale: ar })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-taiz-sky" />
              <span>{(content.views || 0) + 1} مشاهدة مستمرة</span>
            </div>
          </div>
        </div>

        {content.thumbnailUrl && (
          <div className="w-full aspect-video md:max-h-[380px] rounded-3xl overflow-hidden bg-surface-card border border-border-light relative shadow-md my-6 z-10">
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
          <div className="bg-surface-card border border-border-light p-3.5 sm:p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between my-6 relative z-10 shadow-inner">
            <div className="flex items-center gap-3.5">
              <span className="text-[11px] font-black text-text-secondary flex items-center gap-1">
                <Type className="w-3.5 h-3.5" />
                حجم الخط:
              </span>
              <div className="flex items-center gap-1 bg-surface-main p-1.5 rounded-xl border border-border-light">
                <button 
                  onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
                  className="p-1 px-2.5 hover:bg-surface-hover rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                  disabled={fontSize <= 14}
                  title="تصغير الخط"
                >
                  <ZoomOut className="w-3.5 h-3.5 inline" />
                </button>
                <span className="text-xs font-black min-w-[24px] text-center">{fontSize}</span>
                <button 
                  onClick={() => setFontSize(prev => Math.min(28, prev + 2))}
                  className="p-1 px-2.5 hover:bg-surface-hover rounded-lg text-xs font-bold transition-all disabled:opacity-40"
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
                className={`w-6 h-6 rounded-full bg-white border border-border-light flex items-center justify-center transition ${readingTheme === "default" ? "ring-2 ring-taiz-royal ring-offset-1" : ""}`}
                title="الوضع الافتراضي"
              />
              <button 
                onClick={() => setReadingTheme("sepia")}
                className={`w-6 h-6 rounded-full bg-[#FAF5EB] border border-[#EADFCB] flex items-center justify-center transition ${readingTheme === "sepia" ? "ring-2 ring-[#7F6E5D] ring-offset-1" : ""}`}
                title="الوضع الصحفي الورقي"
              />
              <button 
                onClick={() => setReadingTheme("night")}
                className={`w-6 h-6 rounded-full bg-[#0B0F19] border border-black flex items-center justify-center transition ${readingTheme === "night" ? "ring-2 ring-taiz-royal ring-offset-1" : ""}`}
                title="القراءة الليلية المريحة"
              />
            </div>

            {/* Actions: Copy & Share */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyText}
                className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${copied ? "bg-status-success/10 text-status-success border-status-success/20" : "bg-surface-main hover:bg-surface-hover border-border-light text-text-primary"}`}
                title="نسخ الخطاب"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "تم النسخ" : "نسخ الخطاب"}</span>
              </button>
              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${isFavorited ? "bg-taiz-sky/10 text-taiz-sky border-taiz-sky/20" : "bg-surface-main hover:bg-surface-hover border-border-light text-text-primary"}`}
                title="حفظ"
              >
                <Bookmark className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
                <span>حفظ</span>
              </button>
              <button
                onClick={shareText}
                className="btn btn-primary p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-sm"
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
              <div className="aspect-video w-full bg-black rounded-3xl overflow-hidden shadow-strong border-4 border-surface-main relative">
                <iframe 
                   src={getEmbedUrl(content.content)} 
                   className="w-full h-full border-0 absolute inset-0" 
                   allowFullScreen
                   allow="autoplay; encrypted-media; picture-in-picture"
                ></iframe>
              </div>
              
              {/* Secondary details on the video under player */}
              <div className="bg-surface-card p-5 rounded-2xl border border-border-light space-y-3 font-sans">
                <h4 className="text-sm font-black text-taiz-royal flex items-center gap-2">
                  <span className="w-2 h-2 bg-taiz-royal rounded-full animate-pulse" />
                  ملاحظات ومحاور المقطع المعروض:
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed text-justify whitespace-pre-line">
                  {content.description || `يمكنكم متابعة المحاضرة بالكامل من خلال المشغل أعلاه. هذا المقطع يركز على الدروس والعِبَر الروحية المستمدة من آيات الله والوقائع المعاصرة لبناء المجتمع القرآني المتمسك بهويته الدينية في مواجهة الطغيان.`}
                </p>
                <div className="pt-2 flex justify-end gap-2">
                  <button 
                    onClick={shareText}
                    className="px-4 py-2 bg-surface-main hover:bg-surface-hover text-text-primary rounded-xl text-xs font-bold transition flex items-center gap-1 border border-border-light"
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
          <div className="mt-12 pt-8 border-t border-border-light text-center font-sans">
            <Quote className="w-8 h-8 mx-auto text-taiz-royal/30 mb-3" />
            <p className="text-sm font-black text-taiz-royal">انتهى خطاب السيد القائد</p>
          </div>
        )}
      </div>
    </div>
  );
}
