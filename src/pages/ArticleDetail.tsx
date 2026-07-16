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
  Copy
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);
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
      <div className="min-h-screen bg-[#0c1933] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-taiz-sky"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#0c1933] text-white flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-black mb-4">المقال غير موجود</h2>
        <button onClick={() => navigate("/articles")} className="bg-taiz-royal px-6 py-2 rounded-xl">العودة للمقالات</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c1933] text-white pb-32 font-sans" dir="rtl">
      {/* Top Nav */}
      <div className="fixed top-0 inset-x-0 z-50 bg-[#0c1933]/80 backdrop-blur-md border-b border-white/5 px-4 h-16 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
          <ArrowRight className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`p-2 rounded-xl transition-all ${isBookmarked ? "text-taiz-sky bg-taiz-sky/10" : "hover:bg-white/10"}`}
          >
            <Bookmark className={`w-6 h-6 ${isBookmarked ? "fill-current" : ""}`} />
          </button>
          <button onClick={() => handleShare("copy")} className="p-2 hover:bg-white/10 rounded-xl transition-colors relative">
            {copied ? <Check className="w-6 h-6 text-emerald-500" /> : <Share2 className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div className="pt-20">
        {/* Cover Image */}
        <div className="w-full aspect-[16/9] md:aspect-[21/9] relative">
          {article.imageUrl ? (
            <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-800"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1933] to-transparent"></div>
        </div>

        <div className="max-w-[800px] mx-auto px-6 -mt-20 relative z-10">
          {/* Badge */}
          <div className="flex mb-6">
            <span className="bg-[#055198] text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg">
              {article.category}
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black mb-8 leading-relaxed">
            {article.title}
          </h1>

          {/* Author Info Card */}
          <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6 mb-12 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                {article.authorPhoto ? (
                  <img src={article.authorPhoto} className="w-14 h-14 rounded-full border-2 border-taiz-sky/50 object-cover" alt={article.authorName} />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-taiz-royal flex items-center justify-center border-2 border-taiz-sky/50">
                    <User className="w-7 h-7 text-white" />
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-black text-lg text-white">{article.authorName}</div>
                <div className="flex items-center gap-3 text-xs text-gray-400 font-bold mt-1">
                   <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{article.hijriDate} هـ</span>
                   </div>
                   <span className="opacity-30">|</span>
                   <span>{article.gregorianDate} م</span>
                </div>
              </div>
            </div>
            
            <div className="hidden sm:flex flex-col items-end gap-1">
               <div className="flex items-center gap-1.5 text-taiz-sky font-black text-sm">
                  <Eye className="w-4 h-4" />
                  <span>{article.views} مشاهدة</span>
               </div>
            </div>
          </div>

          {/* Content Controls */}
          <div className="sticky top-20 z-40 mb-8 flex justify-center">
             <div className="bg-[#1a2b4d] border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-6 shadow-2xl backdrop-blur-sm">
                <div className="flex items-center gap-2">
                   <button onClick={() => setFontSize(f => Math.min(f + 2, 32))} className="p-1.5 hover:bg-white/10 rounded-lg"><Plus className="w-4 h-4" /></button>
                   <Type className="w-5 h-5 text-taiz-sky" />
                   <button onClick={() => setFontSize(f => Math.max(f - 2, 14))} className="p-1.5 hover:bg-white/10 rounded-lg"><Minus className="w-4 h-4" /></button>
                </div>
                <div className="w-px h-6 bg-white/10"></div>
                <div className="flex items-center gap-4">
                   <button onClick={() => handleShare("whatsapp")} className="text-gray-400 hover:text-green-500 transition-colors"><MessageCircle className="w-5 h-5" /></button>
                   <button onClick={() => handleShare("twitter")} className="text-gray-400 hover:text-sky-400 transition-colors"><Twitter className="w-5 h-5" /></button>
                   <button onClick={() => handleShare("facebook")} className="text-gray-400 hover:text-blue-500 transition-colors"><Facebook className="w-5 h-5" /></button>
                </div>
             </div>
          </div>

          {/* Body */}
          <div 
            className="prose prose-invert max-w-none mb-16 text-right leading-[1.8]"
            style={{ fontSize: `${fontSize}px`, fontFamily: 'Tajawal, sans-serif' }}
          >
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="border-t border-white/5 pt-12">
               <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                  مقالات ذات صلة
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {relatedArticles.map(a => (
                    <Link key={a.id} to={`/articles/${a.id}`} className="group block bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/[0.08] transition-all">
                       <div className="aspect-video rounded-xl overflow-hidden mb-4">
                          <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       </div>
                       <h4 className="font-black text-sm line-clamp-2 leading-relaxed">{a.title}</h4>
                    </Link>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
