import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import { LeaderContent } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ArrowRight, Eye, Calendar, Quote } from "lucide-react";

export function LeaderItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState<LeaderContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchLeaderContent = async () => {
      try {
        const docRef = doc(db, "leader", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const itemData = { id: docSnap.id, ...docSnap.data() } as LeaderContent;
          setContent(itemData);
          
          // Increment views
          try {
            await updateDoc(docRef, {
              views: increment(1)
            });
          } catch(e) {
            console.warn("Could not increment views", e);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderContent();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 py-12 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-800 w-3/4 rounded mb-6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-800 w-1/4 rounded mb-10"></div>
        <div className="w-full aspect-video bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="max-w-4xl mx-auto p-4 py-20 text-center">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Quote className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">المحتوى غير موجود</h2>
        <p className="text-gray-500 mb-6">قد يكون تم حذفه أو أن الرابط غير صحيح.</p>
        <button 
          onClick={() => navigate('/leader')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-bold transition-colors inline-flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" /> عودة لقسم السيد القائد
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 py-8 animate-fade-in">
      <button 
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 font-bold text-gray-500 hover:text-emerald-600 transition-colors"
      >
        <ArrowRight className="w-4 h-4" /> عودة
      </button>

      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-5 pointer-events-none">
          <Quote className="w-32 h-32 -mt-4 -mr-4" />
        </div>
      
        <h1 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight mb-6 relative z-10">{content.title}</h1>
        
        <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-gray-500 dark:text-gray-400 mb-10 pb-6 border-b border-gray-100 dark:border-gray-800/50">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{format(content.createdAt, "dd MMMM yyyy", { locale: ar })}</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{(content.views || 0) + 1} مشاهدة</span>
          </div>
        </div>

        <div className="relative z-10">
          {content.type === 'video' ? (
             <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl relative">
                <iframe 
                  src={content.content.includes('almasirah.net.ye/video?id=') 
                    ? content.content.replace('/video?id=', '/player?id=') 
                    : content.content} 
                  className="w-full h-full border-0 absolute inset-0" 
                  allowFullScreen
                ></iframe>
             </div>
          ) : (
             <div className="prose prose-lg dark:prose-invert prose-emerald max-w-none text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                {content.content}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
