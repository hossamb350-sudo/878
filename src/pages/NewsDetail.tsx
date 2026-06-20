import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { NewsItem } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Share2, BookmarkPlus, ArrowRight } from "lucide-react";

export function NewsDetail() {
  const { id } = useParams();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchNews = async () => {
      try {
        const d = await getDoc(doc(db, "news", id));
        if (d.exists()) {
          setNews({ id: d.id, ...d.data() } as NewsItem);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [id]);

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (!news) return <div className="p-8 text-center">لم يتم العثور على الخبر</div>;

  return (
    <div className="max-w-3xl mx-auto w-full p-4 pb-12">
       <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-6 font-medium">
          <ArrowRight className="w-5 h-5" />
          عودة للأخبار
       </Link>

       <article>
          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-sm px-3 py-1 rounded-full font-medium mb-4 inline-block">
             {news.category}
          </span>
          <h1 className="text-3xl font-extrabold mb-4 leading-tight">{news.title}</h1>
          <div className="flex items-center justify-between text-gray-500 text-sm border-b dark:border-gray-700 pb-4 mb-6">
             <span>{format(news.createdAt, "dd MMMM yyyy - hh:mm a", { locale: ar })}</span>
             <div className="flex gap-2">
                 <button className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-300">
                    <Share2 className="w-4 h-4" />
                 </button>
                 <button className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-300">
                    <BookmarkPlus className="w-4 h-4" />
                 </button>
             </div>
          </div>
          
          {news.imageUrl && (
             <div className="mb-8 rounded-xl overflow-hidden aspect-video bg-gray-100 dark:bg-gray-800">
                <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover" />
             </div>
          )}

          <div className="prose dark:prose-invert prose-blue max-w-none prose-p:leading-relaxed prose-p:mb-6 text-lg" dangerouslySetInnerHTML={{ __html: news.content.replace(/\ng/g, '<br/>') }} />
       </article>
    </div>
  );
}
