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
        <span className="text-gray-500">جاري التحميل...</span>
      ) : !quranInfo?.isActive || !quranInfo?.link ? (
        <div className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-6 py-3 rounded-lg">
           القسم غير مفعل حالياً أو الرابط غير متوفر
        </div>
      ) : (
        <a 
          href={quranInfo.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
        >
          الانتقال إلى المادة
          <ExternalLink className="w-5 h-5" />
        </a>
      )}
    </div>
  );
}
