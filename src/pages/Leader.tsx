import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { LeaderContent } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Quote } from "lucide-react";

export function Leader() {
  const [content, setContent] = useState<LeaderContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeader = async () => {
      try {
        const q = await getDocs(query(collection(db, "leader"), orderBy("createdAt", "desc")));
        setContent(q.docs.map(d => ({ id: d.id, ...d.data() } as LeaderContent)));
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
    };
    fetchLeader();
  }, []);

  return (
    <div className="max-w-3xl mx-auto w-full p-4 pb-12">
      <div className="bg-emerald-800 text-white p-8 rounded-2xl mb-8 flex items-center justify-between shadow-lg relative overflow-hidden">
         <div className="relative z-10">
            <h1 className="text-3xl font-extrabold mb-2 text-emerald-50">السيد القائد</h1>
            <p className="text-emerald-200">توجيهات، خطابات، ودروس</p>
         </div>
         {/* Decorative Element */}
         <div className="absolute left-0 top-0 opacity-10 pointer-events-none">
            <Quote className="w-48 h-48 -ml-10 -mt-10" />
         </div>
      </div>

      {loading ? (
        <div className="text-center py-10">جاري التحميل...</div>
      ) : content.length === 0 ? (
        <div className="text-center py-20 text-gray-500">لا يوجد محتوى حالياً</div>
      ) : (
        <div className="space-y-6">
          {content.map(item => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
               <h2 className="text-xl font-bold mb-3">{item.title}</h2>
               <span className="text-xs text-gray-500 mb-4 block">
                 {format(item.createdAt, "dd MMMM yyyy", { locale: ar })}
               </span>
               {item.type === 'video' ? (
                 <div className="aspect-video w-full bg-black rounded-lg overflow-hidden my-4">
                    <iframe src={item.content} className="w-full h-full border-0" allowFullScreen></iframe>
                 </div>
               ) : (
                 <div className="prose dark:prose-invert text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {item.content}
                 </div>
               )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
