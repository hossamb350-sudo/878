import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { QuranContent } from "../types";
import { BookOpen, ExternalLink } from "lucide-react";

export function Quran() {
  const [quranInfo, setQuranInfo] = useState<QuranContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuran = async () => {
      try {
        const d = await getDoc(doc(db, "settings", "quran"));
        if (d.exists()) {
           setQuranInfo(d.data() as QuranContent);
        }
      } catch(err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
    };
    fetchQuran();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      <div className="w-32 h-32 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-8 mx-auto ring-8 ring-emerald-50 dark:ring-emerald-900/10">
         <BookOpen className="w-16 h-16" />
      </div>
      <h1 className="text-3xl font-bold mb-4 text-emerald-800 dark:text-emerald-400">من هدي القرآن</h1>
      <p className="text-gray-600 dark:text-gray-300 max-w-md mb-8 leading-relaxed">
        الوصول إلى قسم "من هدي القرآن" والمحتوى الشامل للتلاوات والدروس القرآنية.
      </p>

      {loading ? (
        <div className="flex justify-center items-center py-10">
           <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : !quranInfo?.isActive || !quranInfo?.link ? (
        <div className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-6 py-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
           هذا القسم سيكون متاحاً قريباً، شكراً لانتظاركم.
        </div>
      ) : (
        <div className="space-y-4">
           <a 
             href={quranInfo.link}
             target="_blank"
             rel="noopener noreferrer"
             className="inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all hover:-translate-y-1 active:scale-95 group"
           >
             {quranInfo.link.toLocaleLowerCase().endsWith('.apk') ? 'تحميل تطبيق القرآن (APK)' : 'الانتقال إلى المادة'}
             <ExternalLink className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
           </a>
           
           {quranInfo.link.toLocaleLowerCase().endsWith('.apk') && (
             <p className="text-xs font-bold text-gray-400 dark:text-gray-500">
               * بعد التحميل، قم بتثبيت التطبيق على هاتفك الأندرويد.
             </p>
           )}
        </div>
      )}
    </div>
  );
}
