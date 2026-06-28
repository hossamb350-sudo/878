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
        <div className="space-y-4">
          {results.map(item => (
            <Link key={item.id} to={`/news/${item.id}`} className="block bg-surface-card rounded-xl p-4 shadow-soft border border-border-light hover:border-taiz-royal transition-colors">
               <span className="text-xs text-taiz-royal font-medium mb-1 block">
                  {item.category}
               </span>
               <h2 className="text-xl font-bold mb-2 text-text-primary">{item.title}</h2>
               <p className="text-text-secondary text-sm line-clamp-2 mb-2">
                 {item.shortDescription}
               </p>
               <span className="text-xs text-text-muted">
                  {format(item.createdAt, "dd MMMM yyyy", { locale: ar })}
               </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
