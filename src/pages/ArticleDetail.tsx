import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, updateDoc, increment, collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Article } from "../types";
import { motion } from "motion/react";
import { 
  ArrowRight, 
  User, 
  Calendar, 
  Share2, 
  Bookmark, 
  Eye, 
  Type, 
  Plus, 
  Minus,
  Check,
  Twitter,
  Facebook,
  MessageCircle,
  Copy,
  Star
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Starting with the default font size matching news detail page
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem("article_font_size");
    return saved ? parseInt(saved, 10) : 16;
  });

  useEffect(() => {
    localStorage.setItem("article_font_size", fontSize.toString());
  }, [fontSize]);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchArticle = async () => {
      try {
        const docRef = doc(db, "articles", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Article;
          setArticle(data);
          
          // Increment views
          updateDoc(docRef, { views: increment(1) });

          // Fetch related
          const q = query(
            collection(db, "articles"),
            where("category", "==", data.category),
            limit(4)
          );
          const relatedSnap = await getDocs(q);
          const related = relatedSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as Article))
            .filter(a => a.id !== id);
          setRelatedArticles(related);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
    window.scrollTo(0, 0);
  }, [id]);

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const text = article?.title || "";

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
    }
    window.open(shareUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-main flex flex-col items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-[#D32027] mb-4"></div>
        <p className="font-medium text-text-secondary font-ibm text-sm">جاري تحميل المقال...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-surface-main text-text-primary flex flex-col items-center justify-center p-6" dir="rtl">
        <h2 className="text-xl font-bold mb-4 font-ibm">المقال غير موجود</h2>
        <button onClick={() => navigate("/articles")} className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold font-ibm shadow-md hover:bg-red-700 transition-all">العودة للمقالات</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-main text-text-primary pb-32 font-sans" dir="rtl">
      {/* Top Nav with matching light background */}
      <div className="sticky top-0 z-40 bg-surface-main/90 backdrop-blur-md border-b border-border-light px-4 h-16 flex items-center justify-between text-text-primary">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors text-text-primary">
          <ArrowRight className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`p-2 rounded-xl transition-all ${isBookmarked ? "text-[#D32027] bg-[#D32027]/10" : "hover:bg-slate-200/50 text-text-primary"}`}
          >
            <Bookmark className={`w-6 h-6 ${isBookmarked ? "fill-current" : ""}`} />
          </button>
          <button onClick={() => handleShare("copy")} className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors relative text-text-primary">
            {copied ? <Check className="w-6 h-6 text-red-600" /> : <Share2 className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div className="max-w-[760px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* Featured Article Card Header - Matching the Landing Page's Featured Card EXACTLY */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full h-[376px] rounded-[24px] overflow-hidden border border-border-light shadow-medium mb-6 select-none"
        >
          {article.imageUrl ? (
            <img 
              src={article.imageUrl} 
              alt={article.title} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <img 
                src={article.authorPhoto || "https://i.pravatar.cc/150"} 
                className="w-full h-full object-cover opacity-80" 
                alt={article.authorName} 
              />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.85)] via-[rgba(0,0,0,0.4)] to-transparent"></div>
          
          <div className="absolute top-[16px] left-0">
            <span className="bg-[#D32027] text-white text-[13px] font-bold font-ibm w-[100px] h-[34px] rounded-r-[10px] flex items-center justify-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-current animate-pulse" />
              مقال مميز
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-[20px] pb-[16px] flex flex-col justify-end text-right">
            <h2 className="text-[18px] font-bold font-ibm leading-[28px] w-full text-white mb-[12px]">
              {article.title}
            </h2>
            
            <div className="flex items-center justify-between w-full h-[46px]">
              <div className="flex items-center gap-[8px]">
                <img 
                  src={article.authorPhoto || "https://i.pravatar.cc/150"} 
                  className="w-[44px] h-[44px] rounded-full object-cover shrink-0 border border-white/20" 
                  alt={article.authorName} 
                />
                <span className="text-[14px] font-medium font-ibm text-white">{article.authorName}</span>
              </div>
              <div className="flex flex-col text-[12px] text-slate-300 font-normal font-ibm text-left">
                <span>{article.hijriDate || "ذو الحجة 1446 هـ"}</span>
                {article.gregorianDate && (
                  <span className="text-[10px] text-slate-400 mt-[2px]">{article.gregorianDate}</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Controls */}
        <div className="sticky top-20 z-40 mb-6 flex justify-center">
           <div className="bg-white/95 border border-border-light rounded-2xl px-4 py-2 flex items-center gap-6 shadow-medium backdrop-blur-sm text-text-primary">
              <div className="flex items-center gap-2">
                 <button onClick={() => setFontSize(f => Math.min(f + 1, 30))} className="p-1.5 hover:bg-slate-100 rounded-lg text-text-primary"><Plus className="w-4 h-4" /></button>
                 <span className="text-sm font-bold min-w-[36px] text-center font-ibm text-text-primary">{fontSize}px</span>
                 <button onClick={() => setFontSize(f => Math.max(f - 1, 12))} className="p-1.5 hover:bg-slate-100 rounded-lg text-text-primary"><Minus className="w-4 h-4" /></button>
              </div>
              <div className="w-px h-6 bg-slate-200"></div>
              <div className="flex items-center gap-4">
                 <button onClick={() => handleShare("whatsapp")} className="text-slate-400 hover:text-green-500 transition-colors"><MessageCircle className="w-5 h-5" /></button>
                 <button onClick={() => handleShare("twitter")} className="text-slate-400 hover:text-sky-400 transition-colors"><Twitter className="w-5 h-5" /></button>
                 <button onClick={() => handleShare("facebook")} className="text-slate-400 hover:text-blue-500 transition-colors"><Facebook className="w-5 h-5" /></button>
              </div>
           </div>
        </div>

        {/* Body content styled to match NewsDetail exactly */}
        <div 
          className="prose prose-slate max-w-none text-text-primary text-justify font-ibm [&_p]:mb-4 [&_p]:mt-0 [&_p]:leading-[1.8] [&_p]:text-justify mb-12 px-[4px]"
          style={{ 
            fontSize: `${fontSize}px`, 
            lineHeight: 1.8,
          }}
        >
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="border-t border-border-light pt-8 mt-8">
             <h3 className="text-lg font-bold font-ibm mb-6 flex items-center gap-2 text-text-primary">
                <div className="w-[4px] h-[18px] bg-[#D32027] rounded-[2px]"></div>
                مقالات ذات صلة
             </h3>
             <div className="grid grid-cols-2 gap-4">
                {relatedArticles.map(a => (
                  <Link key={a.id} to={`/articles/${a.id}`} className="group block bg-white rounded-2xl p-3 border border-border-light hover:bg-slate-50 transition-all shadow-soft">
                     <div className="aspect-video rounded-xl overflow-hidden mb-3">
                        <img src={a.imageUrl || a.authorPhoto} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     </div>
                     <h4 className="font-bold font-ibm text-xs text-text-primary line-clamp-2 leading-relaxed text-right">{a.title}</h4>
                  </Link>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
