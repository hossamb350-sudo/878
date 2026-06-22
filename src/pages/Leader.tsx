import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { LeaderContent } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Quote, PlayCircle, FileText, ArrowLeft, Eye } from "lucide-react";
import { Link } from "react-router-dom";

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
    <div className="max-w-4xl mx-auto w-full p-4 pb-12 animate-fade-in">
      <div className="bg-emerald-800 text-white p-8 md:p-12 rounded-3xl mb-8 flex items-center justify-between shadow-2xl relative overflow-hidden">
         <div className="relative z-10 w-full max-w-lg">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-emerald-600/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/50">محاضرات ودروس</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight text-white drop-shadow-sm">السيد القائد</h1>
            <p className="text-emerald-100 text-lg md:text-xl font-medium leading-relaxed opacity-90">الدروس والمحاضرات</p>
         </div>
         {/* Decorative Element */}
         <div className="absolute left-[-20%] top-[-20%] opacity-10 pointer-events-none rotate-12">
            <Quote className="w-96 h-96" />
         </div>
         <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-emerald-900/50 to-transparent pointer-events-none"></div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
           <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : content.length === 0 ? (
        <div className="text-center py-20 text-gray-500 bg-gray-50 dark:bg-gray-800/20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">لا يوجد محتوى حالياً</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {content.map(item => (
            <Link 
              to={`/leader/${item.id}`} 
              key={item.id} 
              className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700 hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between"
            >
               <div>
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
                   <span className="text-xs text-gray-500 font-medium">
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
