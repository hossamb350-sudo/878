import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { SyncService } from "../services/SyncService";
import { NewsItem } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Search as SearchIcon } from "lucide-react";

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
        const allNews = SyncService.getCache<NewsItem>("news");
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
      <div className="flex items-center gap-3 mb-8 border-b dark:border-gray-700 pb-4">
         <SearchIcon className="w-8 h-8 text-amber-600" />
         <h1 className="text-2xl font-bold">نتائج البحث عن: "{q}"</h1>
      </div>

      {loading ? (
        <div className="text-center py-10">جاري البحث...</div>
      ) : results.length === 0 ? (
        <div className="text-center py-20 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
           لا توجد نتائج مطابقة لبحثك
        </div>
      ) : (
        <div className="space-y-4">
          {results.map(item => (
            <Link key={item.id} to={`/news/${item.id}`} className="block bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-amber-500 transition-colors">
               <span className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1 block">
                  {item.category}
               </span>
               <h2 className="text-xl font-bold mb-2">{item.title}</h2>
               <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-2">
                 {item.shortDescription}
               </p>
               <span className="text-xs text-gray-400">
                  {format(item.createdAt, "dd MMMM yyyy", { locale: ar })}
               </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
