import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NewspaperIssue } from "../types";
import { NewspaperReader } from "../components/NewspaperReader";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { BookOpen, ArrowRight, Newspaper, Calendar } from "lucide-react";

export const NewspaperPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [issue, setIssue] = useState<NewspaperIssue | null>(null);
  const [archives, setArchives] = useState<NewspaperIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadNewspaper() {
      setIsLoading(true);
      try {
        if (id) {
          // Load specific issue by ID
          const docRef = doc(db, "newspapers", id);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setIssue({ id: snap.id, ...snap.data() } as NewspaperIssue);
          }
        } else {
          // Load latest published issue
          const qLatest = query(
            collection(db, "newspapers"),
            where("status", "==", "published"),
            orderBy("publishedAt", "desc"),
            limit(1)
          );
          const snapLatest = await getDocs(qLatest);
          if (!snapLatest.empty) {
            const firstDoc = snapLatest.docs[0];
            setIssue({ id: firstDoc.id, ...firstDoc.data() } as NewspaperIssue);
          }
        }

        // Fetch Archives list
        const qArch = query(
          collection(db, "newspapers"),
          where("status", "==", "published"),
          orderBy("publishedAt", "desc"),
          limit(10)
        );
        const snapArch = await getDocs(qArch);
        const data: NewspaperIssue[] = [];
        snapArch.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as NewspaperIssue);
        });
        setArchives(data);
      } catch (err) {
        console.error("Error loading newspaper issue:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadNewspaper();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center dir-rtl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d49a37] to-[#b37f2c] flex items-center justify-center text-white animate-pulse mb-4 shadow-xl">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
          جاري تجهيز وتنسيق صفحات الصحيفة الإلكترونية...
        </h2>
        <p className="text-xs text-slate-500 font-bold mt-1">منصة تعز الإعلامية</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 dir-rtl text-right">
        <div className="max-w-md mx-auto text-center space-y-4 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <Newspaper className="w-16 h-16 text-amber-500 mx-auto" />
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">
            لا توجد صحيفة إلكترونية صادرة حالياً
          </h2>
          <p className="text-xs text-slate-500 font-bold">
            يمكن لإدارة المنصة إنشاء وإصدار العدد الصحفي الجديد من لوحة التحكّم.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-black text-xs inline-flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dir-rtl">
      {/* Newspaper Interactive Reader */}
      <NewspaperReader issue={issue} isStandalonePage={true} />

      {/* Archives Drawer / Footer list */}
      {archives.length > 1 && (
        <section className="bg-slate-900 text-white py-12 px-4 border-t border-slate-800 no-print">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-amber-500" />
                <h3 className="text-xl font-black">أرشيف الإصدارات الأسبوعية للصحيفة</h3>
              </div>
              <span className="text-xs font-bold text-slate-400">منصة تعز الإعلامية</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {archives.map((arch) => (
                <button
                  key={arch.id}
                  onClick={() => navigate(`/newspaper/${arch.id}`)}
                  className={`p-4 rounded-2xl border transition-all text-right flex flex-col justify-between h-36 ${
                    arch.id === issue.id
                      ? "bg-gradient-to-br from-[#d49a37] to-[#b37f2c] border-amber-400 text-white shadow-lg scale-102"
                      : "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700"
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-black uppercase opacity-80 block mb-1">
                      {arch.issueNumber} • {arch.publishDate}
                    </span>
                    <h4 className="font-extrabold text-sm line-clamp-2 leading-snug">
                      {arch.mainHeadline || arch.title}
                    </h4>
                  </div>

                  <span className="text-[10px] font-bold underline opacity-90 mt-2 block">
                    تصفح هذا العدد ←
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
