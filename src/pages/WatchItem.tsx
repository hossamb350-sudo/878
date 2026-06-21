import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import { VideoItem } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ArrowRight, Eye, Calendar, Video } from "lucide-react";

export function WatchItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchVideo = async () => {
      try {
        const docRef = doc(db, "videos", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const videoData = { id: docSnap.id, ...docSnap.data() } as VideoItem;
          setVideo(videoData);
          
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
    
    fetchVideo();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 py-12 animate-pulse">
        <div className="w-full aspect-video bg-gray-200 dark:bg-gray-800 rounded-2xl mb-6"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-800 w-3/4 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-800 w-1/4 rounded"></div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="max-w-4xl mx-auto p-4 py-20 text-center">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Video className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">الفيديو غير موجود</h2>
        <p className="text-gray-500 mb-6">قد يكون تم حذفه أو أن الرابط غير صحيح.</p>
        <button 
          onClick={() => navigate('/watch')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition-colors inline-flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" /> عودة لقسم شاهد
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 py-8 animate-fade-in">
      <button 
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 font-bold text-gray-500 hover:text-blue-600 transition-colors"
      >
        <ArrowRight className="w-4 h-4" /> عودة
      </button>

      <div className="bg-black rounded-2xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-800 mb-6">
        <div className="aspect-video w-full">
          <iframe 
            src={video.url} 
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media"
          ></iframe>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-tight mb-4">{video.title}</h1>
        
        <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{format(video.createdAt, "dd MMMM yyyy", { locale: ar })}</span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
            <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{(video.views || 0) + 1} مشاهدة</span>
          </div>
        </div>
      </div>
    </div>
  );
}
