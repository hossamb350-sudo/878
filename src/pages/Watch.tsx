import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { VideoItem, LiveStream } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { PlayCircle, Eye } from "lucide-react";

export function Watch() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [liveInfo, setLiveInfo] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchWatchData = async () => {
      try {
        const liveDoc = await getDoc(doc(db, "settings", "livestream"));
        if (liveDoc.exists()) {
           setLiveInfo(liveDoc.data() as LiveStream);
        }

        const vids = await getDocs(query(collection(db, "videos"), orderBy("createdAt", "desc")));
        setVideos(vids.docs.map(d => ({ id: d.id, ...d.data() } as VideoItem)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWatchData();
  }, []);

  return (
    <div className="max-w-4xl mx-auto w-full p-4 pb-12">
      <h1 className="text-2xl font-bold mb-6">شاهد - البث المباشر والفيديوهات</h1>
      
      {liveInfo?.isActive && liveInfo.url && (
        <div className="mb-10 w-full bg-black rounded-xl overflow-hidden shadow-lg border border-gray-800 relative">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-red-600/90 text-white px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
             <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
             بث مباشر
          </div>
          <div className="aspect-video w-full">
            <iframe 
               src={liveInfo.url} 
               className="w-full h-full border-0"
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
               allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">جاري التحميل...</div>
      ) : (
        <>
          {activeVideoUrl && (
             <div className="fixed inset-0 z-50 bg-black/90 flex flex-col pt-10 px-4 pb-4">
                <button onClick={() => setActiveVideoUrl(null)} className="self-end text-white p-2 mb-2 bg-white/10 rounded hover:bg-white/20">
                   إغلاق
                </button>
                <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center">
                  <div className="aspect-video w-full bg-black">
                     <iframe 
                        src={activeVideoUrl} 
                        className="w-full h-full"
                        allowFullScreen
                        allow="autoplay"
                     ></iframe>
                  </div>
                </div>
             </div>
          )}

          <h2 className="text-xl font-bold mb-4 border-b dark:border-gray-700 pb-2">أحدث الفيديوهات</h2>
          {videos.length === 0 ? (
             <p className="text-gray-500 text-center py-10">لا توجد فيديوهات حالياً</p>
          ) : (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               {videos.map(vid => (
                 <div key={vid.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 group cursor-pointer" onClick={() => setActiveVideoUrl(vid.url)}>
                    <div className="aspect-video relative overflow-hidden bg-gray-200 dark:bg-gray-700">
                       {vid.thumbnailUrl ? (
                          <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center">
                             <PlayCircle className="w-12 h-12 text-gray-400" />
                          </div>
                       )}
                       <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <PlayCircle className="w-16 h-16 text-white drop-shadow-lg" />
                       </div>
                       {vid.duration && (
                         <span className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-medium">
                           {vid.duration}
                         </span>
                       )}
                    </div>
                    <div className="p-3">
                       <h3 className="font-bold line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">{vid.title}</h3>
                       <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{format(vid.createdAt, "dd MMMM yyyy", { locale: ar })}</span>
                          <span className="flex items-center gap-1">
                             <Eye className="w-3 h-3" />
                             {vid.views || 0}
                          </span>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          )}
        </>
      )}
    </div>
  );
}
