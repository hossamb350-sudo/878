import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { SyncService } from "../services/SyncService";
import { NewsItem } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Search as SearchIcon, Eye } from "lucide-react";

export function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [results, setResults] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    const search = async () => {
      setLoading(true);
      try {
        // Fast client-side filter over cached news
        const allNews = await SyncService.getCache<NewsItem>("news");
        const filtered = allNews.filter(n => 
          n.title.includes(q) || 
          n.shortDescription.includes(q) || 
          n.content.includes(q)
        );
        setResults(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    search();
  }, [q]);

  return (
    <div className="max-w-4xl mx-auto w-full p-4 pb-12">
      <div className="flex items-center gap-3 mb-8 border-b border-border-light pb-4">
         <SearchIcon className="w-8 h-8 text-taiz-royal" />
         <h1 className="text-2xl font-bold text-text-primary">نتائج البحث عن: "{q}"</h1>
      </div>

      {loading ? (
        <div className="text-center py-10 text-text-secondary">جاري البحث...</div>
      ) : results.length === 0 ? (
        <div className="text-center py-20 text-text-muted bg-surface-card rounded-2xl border border-border-light">
           لا توجد نتائج مطابقة لبحثك
        </div>
      ) : (
        <div className="space-y-5">
          {results.map(item => (
            <Link 
              key={item.id} 
              to={`/news/${item.id}`} 
              className="flex items-center bg-white rounded-r-2xl rounded-l-none shadow-sm group relative transition-all hover:shadow-md h-[110px] sm:h-[130px]"
              style={{ direction: 'rtl' }}
            >
               {/* Category Tag */}
               <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 z-10">
                 <span className="bg-white border border-gray-200 px-3 py-1 rounded-full text-[10px] shadow-sm font-black whitespace-nowrap text-taiz-royal">
                   {item.category}
                 </span>
               </div>

               {/* Right Side Compact Image */}
               {item.imageUrl ? (
                 <div className="w-[110px] sm:w-[130px] h-full shrink-0 bg-gray-100">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover rounded-r-2xl rounded-l-none" />
                 </div>
               ) : (
                 <div className="w-[110px] sm:w-[130px] h-full shrink-0 bg-gray-100 rounded-r-2xl rounded-l-none flex items-center justify-center">
                    <SearchIcon className="w-8 h-8 text-gray-300" />
                 </div>
               )}

               {/* Left Side News Content */}
               <div className="flex-1 min-w-0 flex flex-col justify-center py-2 px-3 text-right">
                  <div>
                     <h3 className="font-bold text-[13px] sm:text-[14px] text-gray-900 leading-[1.5] transition-colors hover:text-taiz-sky mb-2 whitespace-normal line-clamp-2" style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}>
                       {item.title}
                     </h3>

                     <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-[11px] font-medium text-gray-500 mt-auto">
                        {item.author && (
                          <span className="text-gray-700 font-bold truncate max-w-[80px]">{item.author}</span>
                        )}
                        <span className="shrink-0">{format(item.createdAt, "dd/MM/yyyy", { locale: ar })}</span>
                        {/* Views */}
                        <span className="flex items-center gap-1 shrink-0 text-taiz-royal mr-auto">
                          <Eye className="w-3 h-3"/> 
                          {item.views || 0}
                        </span>
                     </div>
                  </div>
               </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
