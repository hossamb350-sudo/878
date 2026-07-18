import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { SyncService } from "../services/SyncService";
import { LeaderContent } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Quote, PlayCircle, FileText, ArrowLeft, Eye, Search } from "lucide-react";
import { Link } from "react-router-dom";

export function Leader() {
  const [content, setContent] = useState<LeaderContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "video" | "text">("all");

  useEffect(() => {
    let active = true;
    const unsubPromise = SyncService.syncCollection<LeaderContent>("leader", (leaderData) => {
      if (!active) return;
      const sorted = [...leaderData];
      sorted.sort((a, b) => {
        const aOrder = a.order !== undefined && a.order !== null ? Number(a.order) : Infinity;
        const bOrder = b.order !== undefined && b.order !== null ? Number(b.order) : Infinity;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return b.createdAt - a.createdAt;
      });
      setContent(sorted);
      setLoading(false);
    }, { orderByField: "createdAt", orderDirection: "desc", limit: 50 });

    return () => {
      active = false;
      unsubPromise.then(unsub => unsub());
    };
  }, []);

  const filteredContent = useMemo(() => {
    return content.filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = selectedType === "all" || item.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [content, searchQuery, selectedType]);

  return (
    <div className="max-w-4xl mx-auto w-full p-4 pb-2 animate-fade-in font-ibm" dir="rtl">
      {/* Advanced Control & Filter Center */}
      <div className="bg-surface-card p-4 rounded-3xl border border-border-light shadow-soft flex flex-col md:flex-row items-center gap-4 mb-8">
        {/* Modern Unified Search Input */}
        <div className="relative flex-1 w-full">
           <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
           <input 
              type="text" 
              placeholder="ابحث بموضوع العنوان، المحاضرة أو الوصف..."
              className="w-full bg-surface-main border border-transparent focus:border-taiz-sky/30 focus:bg-surface-card focus:outline-none rounded-2xl pr-12 pl-4 py-3 text-sm font-bold transition-all placeholder:text-text-muted"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
        
        {/* Dynamic Categorized Filters */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0 w-full md:w-auto bg-surface-main p-1.5 rounded-2xl border border-border-light">
           {[
             { id: "all", label: "الكل" },
             { id: "video", label: "فيديو" },
             { id: "text", label: "محاضرات ودروس" }
           ].map(cat => (
             <button 
                key={cat.id}
                onClick={() => setSelectedType(cat.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedType === cat.id 
                    ? 'bg-surface-card text-text-primary shadow-sm' 
                    : 'bg-transparent text-text-secondary hover:text-text-primary'
                }`}
             >
                {cat.label}
             </button>
           ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
           <div className="w-12 h-12 border-4 border-taiz-royal border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredContent.length === 0 ? (
        <div className="text-center py-20 text-text-muted bg-surface-main rounded-3xl border border-dashed border-border-light">
           لا يوجد محتوى يطابق خيارات البحث والتصفية المحددة.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {filteredContent.map(item => (
            <Link 
              to={`/leader/${item.id}`} 
              key={item.id} 
              className="group relative aspect-video rounded-3xl overflow-hidden shadow-md border border-border-light animate-fade-in"
            >
              {item.thumbnailUrl ? (
                <img 
                  src={item.thumbnailUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-taiz-navy to-taiz-royal flex items-center justify-center">
                  {item.type === 'video' ? <PlayCircle className="w-12 h-12 text-white/20" /> : <FileText className="w-12 h-12 text-white/20" />}
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              
              <div className="absolute top-3 right-3">
                {item.type === 'video' ? (
                   <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md flex items-center gap-1.5 shadow-lg">
                    <PlayCircle className="w-3 h-3" /> فيديو
                  </span>
                ) : (
                   <span className="bg-taiz-sky text-white text-[10px] font-black px-2 py-1 rounded-md flex items-center gap-1.5 shadow-lg">
                    <FileText className="w-3 h-3" /> محاضرة
                  </span>
                )}
              </div>

              <div className="absolute bottom-4 right-4 left-4 text-right">
                <h2 className="text-white text-sm sm:text-base font-black leading-snug line-clamp-2 group-hover:text-red-400 transition-colors">
                  {item.title}
                </h2>
                <div className="flex items-center justify-between mt-2 opacity-80">
                  <span className="text-[10px] text-white/80 font-bold">
                    {format(item.createdAt, "dd MMMM yyyy", { locale: ar })}
                  </span>
                  {item.views !== undefined && (
                    <span className="flex items-center gap-1 text-[10px] text-white/80 font-bold bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
                       <Eye className="w-2.5 h-2.5 text-red-500" /> {item.views}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
