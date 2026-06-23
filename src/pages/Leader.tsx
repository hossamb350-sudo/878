import { useEffect, useState, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
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
    const fetchLeader = async () => {
      try {
        const q = await getDocs(collection(db, "leader"));
        const data = q.docs.map(d => ({ id: d.id, ...d.data() } as LeaderContent));
        data.sort((a, b) => {
          const aOrder = a.order !== undefined && a.order !== null ? Number(a.order) : Infinity;
          const bOrder = b.order !== undefined && b.order !== null ? Number(b.order) : Infinity;
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          return b.createdAt - a.createdAt;
        });
        setContent(data);
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
    };
    fetchLeader();
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
    <div className="max-w-4xl mx-auto w-full p-4 pb-12 animate-fade-in" dir="rtl">
      <div className="bg-emerald-800 text-white p-8 md:p-12 rounded-3xl mb-8 flex items-center justify-between shadow-2xl relative overflow-hidden">
         <div className="relative z-10 w-full max-w-lg">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-emerald-600/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/50">محاضرات ودروس</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight text-white drop-shadow-sm">السيد القائد</h1>
            <p className="text-emerald-100 text-lg md:text-xl font-medium leading-relaxed opacity-90">الدروس والمحاضرات للثقافة القرآنية المباركة</p>
         </div>
         {/* Decorative Element */}
         <div className="absolute left-[-20%] top-[-20%] opacity-10 pointer-events-none rotate-12">
            <Quote className="w-96 h-96" />
         </div>
         <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-emerald-900/50 to-transparent pointer-events-none"></div>
      </div>

      {/* Advanced Control & Filter Center */}
      <div className="bg-white dark:bg-gray-800/80 p-4 rounded-2xl border border-stone-150 dark:border-zinc-700/50 shadow-sm flex flex-col md:flex-row items-center gap-4 mb-8">
        {/* Modern Unified Search Input */}
        <div className="relative flex-1 w-full">
           <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
           <input 
              type="text" 
              placeholder="ابحث بموضوع العنوان، المحاضرة أو الوصف..."
              className="w-full bg-stone-50 dark:bg-gray-900/40 border border-transparent focus:border-emerald-500/30 focus:bg-white dark:focus:bg-gray-900 focus:outline-none rounded-xl pr-12 pl-4 py-3 text-sm font-medium transition-all placeholder:text-stone-400 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
        
        {/* Dynamic Categorized Filters */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0 w-full md:w-auto">
           {[
             { id: "all", label: "الكل" },
             { id: "video", label: "فيديو" },
             { id: "text", label: "محاضرات ودروس" }
           ].map(cat => (
             <button 
                key={cat.id}
                onClick={() => setSelectedType(cat.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedType === cat.id 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                    : 'bg-stone-50 dark:bg-gray-900/30 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-gray-900'
                }`}
             >
                {cat.label}
             </button>
           ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
           <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredContent.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
           لا يوجد محتوى يطابق خيارات البحث والتصفية المحددة.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {filteredContent.map(item => (
            <Link 
              to={`/leader/${item.id}`} 
              key={item.id} 
              className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700 hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between animate-fade-in"
            >
               <div>
                 {item.thumbnailUrl && (
                   <div className="w-full aspect-video rounded-xl overflow-hidden mb-4 bg-stone-100 border border-stone-100 dark:bg-gray-900 dark:border-gray-750 relative shadow-inner">
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
                       <span className="flex items-center gap-1.5 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold px-2.5 py-1 rounded-md">
                        <PlayCircle className="w-3.5 h-3.5" /> فيديو
                      </span>
                    ) : (
                       <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-md">
                        <FileText className="w-3.5 h-3.5" /> محاضرات ودروس
                      </span>
                    )}
                 </div>
                 <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-3">{item.title}</h2>
               </div>
               
               <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                 <div className="flex items-center gap-3">
                   <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                     {format(item.createdAt, "dd MMMM yyyy", { locale: ar })}
                   </span>
                   {item.views !== undefined && (
                     <span className="flex items-center gap-1 text-xs text-gray-400 font-medium bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        <Eye className="w-3 h-3" /> {item.views}
                     </span>
                   )}
                 </div>
                 
                 <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all transform group-hover:-translate-x-1">
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
