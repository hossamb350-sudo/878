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
    <div className="max-w-4xl mx-auto w-full p-4 pb-2 animate-fade-in" dir="rtl">
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
              className="card card-hover group flex flex-col justify-between animate-fade-in"
            >
               <div>
                 {item.thumbnailUrl && (
                   <div className="w-full aspect-video rounded-xl overflow-hidden mb-4 bg-surface-main border border-border-light relative shadow-inner">
                     <img 
                       src={item.thumbnailUrl} 
                       alt={item.title} 
                       className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                       loading="lazy"
                       referrerPolicy="no-referrer"
                     />
                   </div>
                 )}
                 <div className="flex items-center gap-2 mb-4">
                    {item.type === 'video' ? (
                       <span className="flex items-center gap-1.5 bg-taiz-royal/5 text-taiz-royal text-xs font-bold px-2.5 py-1 rounded-md">
                        <PlayCircle className="w-3.5 h-3.5" /> فيديو
                      </span>
                    ) : (
                       <span className="flex items-center gap-1.5 bg-taiz-sky/5 text-taiz-sky text-xs font-bold px-2.5 py-1 rounded-md">
                        <FileText className="w-3.5 h-3.5" /> محاضرات ودروس
                      </span>
                    )}
                 </div>
                 <h2 className="text-base sm:text-lg font-black mb-3 text-text-primary leading-snug group-hover:text-taiz-royal transition-colors line-clamp-3">{item.title}</h2>
               </div>
               
               <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-light">
                 <div className="flex items-center gap-3">
                   <span className="text-xs text-text-secondary font-bold">
                     {format(item.createdAt, "dd MMMM yyyy", { locale: ar })}
                   </span>
                   {item.views !== undefined && (
                     <span className="flex items-center gap-1 text-xs text-text-secondary font-bold bg-surface-main px-2 py-0.5 rounded-full">
                        <Eye className="w-3 h-3" /> {item.views}
                     </span>
                   )}
                 </div>
                 
                 <div className="w-8 h-8 rounded-full bg-surface-main text-text-secondary flex items-center justify-center group-hover:bg-taiz-navy group-hover:text-white transition-all transform group-hover:-translate-x-1">
                    <ArrowLeft className="w-4 h-4" />
                 </div>
               </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
