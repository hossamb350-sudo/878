import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { db } from "../firebase";
import { Article } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, User, Eye, Bookmark, ChevronLeft, Newspaper } from "lucide-react";

export function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "articles"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Article[];
      setArticles(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const featuredArticle = articles.find((a) => a.isFeatured) || articles[0];
  const latestArticles = articles.filter((a) => a.id !== (featuredArticle?.id));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c1933] text-white p-6 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-taiz-sky mb-4"></div>
        <p className="font-bold text-gray-400">جاري تحميل المقالات...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c1933] text-white pb-24 font-sans" dir="rtl">
      {/* Header */}
      <div className="p-6 text-center">
        <h1 className="text-3xl font-black mb-2 flex items-center justify-center gap-3">
          المقالات
          <div className="bg-taiz-royal p-1.5 rounded-lg shadow-lg">
             <Newspaper className="w-6 h-6 text-white" />
          </div>
        </h1>
        <p className="text-gray-400 text-sm font-bold">آراء وتحليلات ورؤى معمقة</p>
      </div>

      <div className="max-w-[760px] mx-auto px-4 space-y-8">
        {/* Featured Article */}
        {featuredArticle && (
          <Link to={`/articles/${featuredArticle.id}`} className="block group">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-[16/9] rounded-[2rem] overflow-hidden shadow-2xl border border-white/5"
            >
              {featuredArticle.imageUrl ? (
                <img 
                  src={featuredArticle.imageUrl} 
                  alt={featuredArticle.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900"></div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1933] via-[#0c1933]/40 to-transparent"></div>
              
              <div className="absolute top-4 right-4">
                <span className="bg-status-error text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  مقال مميز
                </span>
              </div>

              <div className="absolute bottom-6 right-6 left-6 text-right">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[10px] font-black px-2.5 py-1 rounded-full">
                    {featuredArticle.category}
                  </span>
                </div>
                
                <h2 className="text-xl md:text-2xl font-black mb-4 leading-relaxed line-clamp-2">
                  {featuredArticle.title}
                </h2>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {featuredArticle.authorPhoto ? (
                        <img 
                          src={featuredArticle.authorPhoto} 
                          className="w-10 h-10 rounded-full border-2 border-taiz-sky/50 object-cover" 
                          alt={featuredArticle.authorName} 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-taiz-royal flex items-center justify-center border-2 border-taiz-sky/50">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-black text-sm">{featuredArticle.authorName}</div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{featuredArticle.hijriDate} هـ</span>
                        <span className="opacity-30">•</span>
                        <span>{featuredArticle.gregorianDate} م</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-gray-400 text-xs font-bold bg-white/5 px-2.5 py-1.5 rounded-xl backdrop-blur-sm">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{featuredArticle.views || 0}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        )}

        {/* Section Title */}
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-black flex items-center gap-2">
            <div className="w-1.5 h-6 bg-taiz-sky rounded-full"></div>
            أحدث المقالات
          </h3>
          <Link to="/articles" className="text-status-error text-sm font-black flex items-center gap-1 hover:gap-2 transition-all">
            عرض الكل
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {latestArticles.map((article, idx) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link to={`/articles/${article.id}`} className="block group bg-white/5 rounded-3xl border border-white/5 overflow-hidden hover:bg-white/[0.08] transition-all hover:-translate-y-1">
                <div className="relative aspect-video">
                  {article.imageUrl ? (
                    <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-800"></div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className="bg-[#055198]/80 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1 rounded-lg">
                      {article.category}
                    </span>
                  </div>
                  <button className="absolute top-3 left-3 bg-white/10 backdrop-blur-sm p-2 rounded-xl text-white hover:bg-taiz-sky/20 transition-colors">
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-5 text-right">
                  <h4 className="font-black text-[15px] leading-relaxed mb-4 line-clamp-2 min-h-[45px]">
                    {article.title}
                  </h4>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                       {article.authorPhoto ? (
                        <img src={article.authorPhoto} className="w-8 h-8 rounded-full border border-taiz-sky/30 object-cover" alt={article.authorName} />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-taiz-royal flex items-center justify-center border border-taiz-sky/30">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <span className="text-xs font-black text-gray-300">{article.authorName}</span>
                    </div>
                    <div className="text-[10px] font-bold text-gray-400">
                      {article.hijriDate} هـ
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
