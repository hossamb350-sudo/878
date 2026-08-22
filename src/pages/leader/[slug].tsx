import React, { useEffect, useState, useCallback } from "react";
import { updateMetadata } from "../../utils/metadata";
import { extractIdFromSlug, generateSlug, routes } from "../../utils/routes";
import { shareContent } from "../../utils/share";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, updateDoc, increment, collection, query, limit, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { LeaderContent } from "../../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { getShareableUrl } from "../../config/apiConfig";
import { 
  ArrowRight, 
  Eye, 
  Calendar, 
  Quote, 
  Share2, 
  Bookmark, 
  BookOpen, 
  Clock, 
  Sparkles,
  ChevronLeft,
  Layers,
  Facebook,
  MessageCircle,
  Send
} from "lucide-react";
import { motion } from "motion/react";
import { useLiveStream } from "../../context/LiveStreamContext";
import { 
  IslamicDivider, 
  IslamicStarMedallion 
} from "../../components/leader/LeaderIslamicOrnaments";
import { LeaderCustomPlayer } from "../../components/leader/LeaderCustomPlayer";
import { LeaderReaderToolbar, ReaderThemeMode } from "../../components/leader/LeaderReaderToolbar";
import { LeaderVideoCard } from "../../components/leader/LeaderVideoCard";
import { LeaderTextCard } from "../../components/leader/LeaderTextCard";

export function LeaderItem() {
  const { slug } = useParams();
  const id = extractIdFromSlug(slug || "");
  const { stopStream } = useLiveStream();

  const [content, setContent] = useState<LeaderContent | null>(null);
  const [relatedContent, setRelatedContent] = useState<LeaderContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Reading preferences
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem("leader_font_size");
    return saved ? parseInt(saved, 10) : 18;
  });

  const [readerTheme, setReaderTheme] = useState<ReaderThemeMode>(() => {
    const saved = localStorage.getItem("leader_reader_theme");
    return (saved as ReaderThemeMode) || "light";
  });

  const [copied, setCopied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Save font size
  useEffect(() => {
    localStorage.setItem("leader_font_size", fontSize.toString());
  }, [fontSize]);

  // Save reader theme
  useEffect(() => {
    localStorage.setItem("leader_reader_theme", readerTheme);
  }, [readerTheme]);

  // Check favorites
  useEffect(() => {
    if (content) {
      const saved = localStorage.getItem("favorite_items");
      if (saved) {
        try {
          const favs = JSON.parse(saved);
          setIsFavorited(favs.some((item: any) => item.id === content.id));
        } catch {
          // ignore
        }
      }
    }
  }, [content]);

  // Track scroll progress
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

  // Fetch single leader document & increment views
  useEffect(() => {
    if (!id) return;
    window.scrollTo({ top: 0, behavior: "smooth" });

    const fetchLeaderContent = async () => {
      try {
        setLoading(true);
        setError(false);
        const docRef = doc(db, "leader", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const itemData = { id: docSnap.id, ...docSnap.data() } as LeaderContent;
          setContent(itemData);

          // Update SEO / social metadata
          updateMetadata({
            title: itemData.title,
            description: itemData.description || (itemData.content ? itemData.content.slice(0, 150) : ""),
            imageUrl: itemData.thumbnailUrl || "",
            type: "article",
            path: window.location.pathname,
          });

          // Increment view count safely
          try {
            await updateDoc(docRef, {
              views: increment(1),
            });
          } catch (e) {
            console.warn("Could not increment views:", e);
          }

          // Fetch related items from leader collection
          try {
            const q = query(collection(db, "leader"), limit(6));
            const snap = await getDocs(q);
            const related = snap.docs
              .map((d) => ({ id: d.id, ...d.data() } as LeaderContent))
              .filter((d) => d.id !== id)
              .slice(0, 4);
            setRelatedContent(related);
          } catch {
            // ignore
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching leader content:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderContent();
  }, [id]);

  const handlePlayVideo = useCallback(() => {
    stopStream();
    window.dispatchEvent(new CustomEvent("stop-quran-audio"));
  }, [stopStream]);

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
        imageUrl: content.thumbnailUrl || "",
        savedAt: Date.now(),
      });
      setIsFavorited(true);
    }
    localStorage.setItem("favorite_items", JSON.stringify(favs));
  };

  const handleCopyText = async () => {
    if (!content) return;
    try {
      const fullText = `${content.title}\n\n${content.content || content.description || ""}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleShare = async (platform: string = "copy") => {
    if (!content) return;
    
    if (typeof navigator.share !== "undefined") {
      const res = await shareContent({
        title: content.title,
        type: "leader",
        id: content.id || id,
        imageUrl: content.thumbnailUrl,
      });
      if (res.native) {
        return;
      }
    }
    
    const url = getShareableUrl(`/leader/${content.id || id}`);
    const text = content.title || "";
    
    if (platform === "copy") {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  // Date Formatter
  const formatPublishInfo = (timestamp: number) => {
    const d = new Date(timestamp || Date.now());
    const mDate = format(d, "dd MMMM yyyy'م'", { locale: ar });
    const mTime = format(d, "hh:mm a", { locale: ar });

    let hDate = "";
    try {
      const formatted = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(d).trim();
      hDate = formatted.endsWith("هـ") ? formatted : `${formatted} هـ`;
    } catch {
      hDate = "";
    }

    return { mDate, mTime, hDate };
  };

  const { mDate, hDate } = formatPublishInfo(content?.createdAt || Date.now());

  // Reading time calculation
  const calculateReadingTime = (text: string) => {
    if (!text) return "قراءة 3 دقائق";
    const wordCount = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(wordCount / 180));
    return `قراءة ${minutes} دقائق (${wordCount} كلمة)`;
  };

  // Render paragraphs with Quranic highlighting & Subheadings
  const renderParagraph = (text: string, idx: number) => {
    if (!text.trim()) return null;

    const isSubHeader =
      text.startsWith("###") ||
      text.startsWith("##") ||
      text.split(" ").slice(0, 3).join(" ").includes("المحور") ||
      text.startsWith("-");

    if (isSubHeader) {
      const cleanText = text.replace(/^[#-\s]+/, "");
      return (
        <div key={idx} className="mt-7 mb-3.5">
          <div className="flex items-center gap-2 mb-1.5 text-taiz-sky text-xs font-bold font-cairo">
            <span>❖</span>
            <span>محور رئيسي</span>
          </div>
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-taiz-royal border-r-4 border-taiz-sky pr-3 py-1 bg-slate-100 rounded-l-lg leading-relaxed font-cairo">
            {cleanText}
          </h3>
        </div>
      );
    }

    // Quranic Verses Matcher: ﴿ ... ﴾
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
          className="text-taiz-royal font-serif font-bold bg-amber-500/10 px-2 py-0.5 rounded-md inline-block leading-loose text-center mx-1 border border-amber-500/20 shadow-xs"
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
        className="mb-4 sm:mb-5 leading-loose text-justify font-ibm text-text-primary"
        style={{ fontSize: `${fontSize}px` }}
      >
        {parts.length > 0 ? parts : text}
      </p>
    );
  };

  // Theme styling definitions for reader mode
  const getThemeContainerClasses = () => {
    switch (readerTheme) {
      case "parchment":
        return "bg-[#F7EED9] text-[#2C2216] border-[#E2D0AF]";
      case "dark":
        return "bg-taiz-navy text-slate-100 border-taiz-sky/40";
      case "light":
      default:
        return "bg-white text-text-primary border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-main text-text-primary p-4 py-12 flex flex-col items-center justify-center space-y-3" dir="rtl">
        <div className="w-10 h-10 border-3 border-taiz-sky border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-text-muted font-cairo">جاري تحميل مادة السيد القائد...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="max-w-2xl mx-auto p-4 py-16 text-center font-cairo" dir="rtl">
        <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-taiz-sky">
          <Quote className="w-8 h-8" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold mb-2 text-text-primary">
          المادة المطلوبة غير موجودة
        </h2>
        <p className="text-xs text-text-muted mb-5">
          ربما تم نقل هذه المادة أو حذفها، يمكنك العودة لمكتبة السيد القائد وتصفح كافة الخطابات.
        </p>
        <Link
          to={routes.leader()}
          className="inline-flex items-center gap-2 bg-taiz-royal text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقسم السيد القائد</span>
        </Link>
      </div>
    );
  }

  const isVideo = content.type === "video";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="min-h-screen bg-surface-main text-text-primary py-3 sm:py-5 px-3 sm:px-4 md:px-6 font-cairo pb-20 transition-colors duration-300 relative"
      dir="rtl"
    >
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-black/5 z-50 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-taiz-royal via-taiz-sky to-taiz-cyan transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-3.5">
        
        {/* Navigation Breadcrumb Bar */}
        <div className="flex items-center justify-between bg-surface-card rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-border-subtle shadow-soft text-xs">
          <Link
            to={routes.leader()}
            className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-taiz-sky transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 text-taiz-sky" />
            <span>قسم السيد القائد</span>
            <span className="text-slate-400">/</span>
            <span className="text-taiz-royal font-bold truncate max-w-[200px] sm:max-w-xs">
              {isVideo ? "خطاب مرئي" : "نص"}
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            {!isVideo && (
              <button
                onClick={() => handleShare("copy")}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="مشاركة"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={toggleBookmark}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isFavorited
                  ? "bg-taiz-sky text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
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
        {isVideo ? (
          <div className="relative rounded-[20px] sm:rounded-[24px] bg-surface-card border border-border-subtle overflow-hidden shadow-soft">
            {/* Embedded Custom Video Player */}
            <LeaderCustomPlayer
              videoUrl={content.content}
              thumbnailUrl={content.thumbnailUrl}
              title={content.title}
              onPlay={handlePlayVideo}
              isEmbedded={true}
            />

            {/* Video Metadata & Details inside same card */}
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-3 text-xs text-text-muted font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{mDate}</span>
                  </span>
                  {hDate && <span className="text-slate-500">{hDate}</span>}
                </div>

                <div className="flex items-center gap-1 text-xs text-text-muted font-medium">
                  <Eye className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  <span>{(content.views || 0).toLocaleString("ar-EG")} مشاهدة</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-base sm:text-xl font-bold leading-snug text-text-primary font-cairo">
                {content.title}
              </h1>

              {/* Description */}
              {content.description && (
                <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-text-secondary text-xs sm:text-sm font-tajawal leading-relaxed">
                  {content.description}
                </div>
              )}
              
              <div className="bg-[#fafafa]/90 dark:bg-stone-900/60 border border-slate-200/70 dark:border-stone-800/80 rounded-full px-3.5 sm:px-5 py-2 sm:py-2.5 shadow-xs flex items-center justify-between max-w-full mx-auto backdrop-blur-sm mt-4">
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
                    className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-stone-700 hover:text-sky-400 transition-all duration-200 cursor-pointer shadow-2xs"
                    title="مشاركة عبر تليجرام"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleShare("facebook")} 
                    className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-stone-700 hover:text-blue-600 transition-all duration-200 cursor-pointer shadow-2xs"
                    title="مشاركة عبر فيسبوك"
                  >
                    <Facebook className="w-4.5 h-4.5" />
                  </button>
                  <button 
                    onClick={() => handleShare("twitter")} 
                    className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-stone-700 hover:text-black dark:hover:text-white transition-all duration-200 cursor-pointer shadow-2xs"
                    title="مشاركة عبر إكس"
                  >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleShare("whatsapp")} 
                    className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-stone-700 hover:text-emerald-500 transition-all duration-200 cursor-pointer shadow-2xs"
                    title="مشاركة عبر واتساب"
                  >
                    <MessageCircle className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* 2. TEXT / LECTURE VIEW COMPONENT (Single Unified Card) */
          /* ============================================================== */
          <div className={`relative rounded-[20px] sm:rounded-[24px] border overflow-hidden shadow-soft transition-colors duration-300 ${getThemeContainerClasses()}`}>
            {/* Header Title Card with Uploaded Image Background (Matched to Home Slider Dimensions: h-[376px]) */}
            <div className="relative w-full h-[376px] overflow-hidden select-none">
              {/* Background Image (Uploaded Thumbnail or Default) */}
              {content.thumbnailUrl ? (
                <img
                  src={content.thumbnailUrl}
                  alt={content.title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              ) : (
                <img
                  src="/splash_first.png"
                  alt={content.title}
                  className="w-full h-full object-cover brightness-90"
                />
              )}

              {/* Multi-stop gradient overlay in Taiz brand colors matching Home Slider */}
              <div className="absolute inset-0 bg-gradient-to-t from-taiz-navy via-taiz-navy/85 via-taiz-royal/40 to-transparent pointer-events-none" />

              {/* Content Container at the Bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex flex-col justify-end text-right z-10 select-none" dir="rtl">
                {/* Title / Headline matching Home Slider typography */}
                <h1 
                  className="font-bold text-[16px] sm:text-[19px] md:text-[22px] text-white leading-[1.35] font-cairo text-right w-full mb-3 drop-shadow-md"
                  style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}
                >
                  {content.title}
                </h1>

                {/* Metadata Row matching Home Slider layout */}
                <div className="flex flex-wrap items-center justify-start gap-x-4 sm:gap-x-5 gap-y-1.5 text-white/90 text-[10.5px] sm:text-[12.5px] font-medium w-full" dir="rtl">
                  {/* Gregorian Date */}
                  {mDate && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Calendar className="w-4 h-4 text-white/90 stroke-[1.75]" />
                      <span>{mDate}</span>
                    </div>
                  )}

                  {/* Hijri Date */}
                  {hDate && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Calendar className="w-4 h-4 text-white/90 stroke-[1.75]" />
                      <span>{hDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive Reader Toolbar Inside the Unified Card */}
            <div className="px-3 sm:px-5 pt-3 pb-1 border-b border-slate-200/60 dark:border-white/10">
              <LeaderReaderToolbar
                fontSize={fontSize}
                onIncreaseFontSize={() => setFontSize((prev) => Math.min(prev + 2, 32))}
                onDecreaseFontSize={() => setFontSize((prev) => Math.max(prev - 2, 14))}
                onResetFontSize={() => setFontSize(18)}
                readerTheme={readerTheme}
                onThemeChange={setReaderTheme}
                onCopyText={handleCopyText}
                copied={copied}
                onShare={handleShare}
                isFavorited={isFavorited}
                onToggleBookmark={toggleBookmark}
                readingTime={calculateReadingTime(content.content || "")}
              />
            </div>

            {/* Full Lecture Typography Reader Content */}
            <div className="p-4 sm:p-7 md:p-9">
              {/* Bismillah Header */}
              <div className="text-center my-3 select-none">
                <span className="font-serif text-base sm:text-xl text-taiz-royal dark:text-amber-300 font-bold block mb-1">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </span>
                <IslamicDivider className="max-w-xs mx-auto opacity-70 my-2" />
              </div>

              {/* Body Content */}
              <div className="space-y-2 mt-5">
                {(content.content || content.description || "لا يوجد نص متاح لهذه المحاضرة.")
                  .split("\n")
                  .map((para, pIdx) => renderParagraph(para, pIdx))}
              </div>

              {/* Lecture Conclusion Footer */}
              <div className="mt-8 pt-5 border-t border-slate-200/80 dark:border-white/10 text-center space-y-2">
                <IslamicStarMedallion size="w-10 h-10" className="mx-auto">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </IslamicStarMedallion>
                <p className="text-xs font-bold text-text-muted font-cairo">
                  تمت بعون الله وتوفيقه — مكتبة توثيق خطابات السيد القائد
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* RELATED MATERIALS SECTION */}
        {/* ============================================================== */}
        {relatedContent.length > 0 && (
          <div className="mt-8 space-y-3 pt-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-taiz-sky" />
                <h3 className="text-sm sm:text-base font-bold text-text-primary font-cairo">
                  محاضرات وخطابات مقترحة
                </h3>
              </div>
              <Link
                to={routes.leader()}
                className="text-xs font-bold text-taiz-sky hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>عرض الكل</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {relatedContent.map((item, idx) => (
                <div key={item.id}>
                  {item.type === "video" ? (
                    <LeaderVideoCard item={item} index={idx} isFavorited={false} />
                  ) : (
                    <LeaderTextCard item={item} index={idx} isFavorited={false} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
}

export default LeaderItem;
