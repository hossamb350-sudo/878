import { useEffect, useState, useRef } from "react";
import { collection, query, orderBy, getDocs, doc, getDoc, onSnapshot, where } from "firebase/firestore";
import { db } from "../firebase";
import { VideoItem, LiveStream } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { PlayCircle, MonitorPlay, Radio, X } from "lucide-react";
import { useSearchParams, Link } from "react-router-dom";

export function Watch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [channels, setChannels] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  
  const initialVideoUrl = searchParams.get('v');
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(initialVideoUrl);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const activeVideoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialVideoUrl) {
      setActiveVideoUrl(initialVideoUrl);
      setTimeout(() => {
        activeVideoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    }
  }, [initialVideoUrl]);

  useEffect(() => {
    // Dynamic fetch for channels that are active
    const channelsQ = query(collection(db, "livestreams"), where("isActive", "==", true));
    const unsubChannels = onSnapshot(channelsQ, (snap) => {
      const dbChannels = snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveStream));
      dbChannels.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)); // Sort newest first, or you could keep as is.
      setChannels(dbChannels);
      setActiveChannelId(prev => {
        if (!prev && dbChannels.length > 0) return dbChannels[0].id || null;
        return prev;
      });
    }, (error) => {
      console.error("Error fetching livestreams realtime:", error);
    });

    const fetchVideos = async () => {
      try {
        const vids = await getDocs(query(collection(db, "videos"), orderBy("createdAt", "desc")));
        setVideos(vids.docs.map(d => ({ id: d.id, ...d.data() } as VideoItem)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();

    return () => unsubChannels();
  }, []);

  const activeChannel = channels.find(c => c.id === activeChannelId);

  const handleCloseVideo = () => {
    setActiveVideoUrl(null);
    if (searchParams.has('v')) {
      searchParams.delete('v');
      setSearchParams(searchParams);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-2 sm:p-4 pb-20" ref={activeVideoRef}>
      <div className="flex items-center gap-2 mb-6">
         <Radio className="w-6 h-6 text-red-600 animate-pulse" />
         <h1 className="text-2xl font-extrabold text-[#111827] dark:text-white select-none">البث المباشر</h1>
      </div>
      
      {/* Live Stream Section */}
      <div className="mb-10 w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 relative ring-1 ring-black/5 dark:ring-white/5">
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
           <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
           مباشر
        </div>
        
        <div className="aspect-video w-full bg-gray-900 border-b border-gray-800">
           {activeChannel && activeChannel.url ? (
              <iframe 
                 src={
                    activeChannel.url.includes("youtube.com/watch?v=") || activeChannel.url.includes("youtu.be/") || activeChannel.url.includes("youtube.com/live/")
                    ? activeChannel.url.replace(/.*(?:watch\?v=|youtu\.be\/|live\/)([a-zA-Z0-9_-]{11}).*/, "https://www.youtube.com/embed/$1?autoplay=1&mute=1")
                    : activeChannel.url.includes("/w/") || activeChannel.url.includes("/videos/watch/")
                    ? activeChannel.url.replace("/w/", "/videos/embed/").replace("/videos/watch/", "/videos/embed/")
                    : activeChannel.url
                  }
                 className="w-full h-full border-0"
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                 allowFullScreen
              ></iframe>
           ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-3">
                 <Radio className="w-12 h-12 mb-2 opacity-50" />
                 <p className="font-bold">البث المباشر غير متوفر حالياً لهذه القناة</p>
                 <p className="text-sm">يرجى المحاولة في وقت لاحق</p>
              </div>
           )}
        </div>

        {/* Channel Metadata & Selection */}
        <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <div className="p-4 sm:px-6 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
               <h2 className="text-lg sm:text-xl font-bold text-[#111827] dark:text-white mb-1.5 flex items-center gap-2">
                 {activeChannel?.iconUrl && (
                    <img src={activeChannel.iconUrl} alt={activeChannel.name} className="w-8 h-8 rounded-full object-cover shadow-sm bg-gray-100 dark:bg-gray-800" />
                 )}
                 {activeChannel ? `بث مباشر - ${activeChannel.name}` : "البث المباشر"}
               </h2>
               <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  يتم بث المحتوى الآن
               </div>
            </div>
            
            <div className="hidden md:flex items-center gap-3 bg-red-50 dark:bg-red-900/10 px-4 py-2 rounded-full border border-red-100 dark:border-red-900/20">
               <span className="text-red-600 dark:text-red-400 text-xs font-bold whitespace-nowrap">قنوات البث المتاحة</span>
               <div className="w-px h-4 bg-red-200 dark:bg-red-800"></div>
               <span className="text-gray-600 dark:text-gray-400 text-[11px] font-bold">{channels.length} قناة</span>
            </div>
          </div>

          {/* New Horizontal Channel Selector */}
          <div className="px-4 pb-8 overflow-x-auto select-none no-scrollbar">
            <div className="flex items-center gap-4 sm:gap-6 min-w-max pb-2">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannelId(ch.id!)}
                  className={`flex flex-col items-center gap-2 group transition-all duration-300 ${activeChannelId === ch.id ? 'scale-105' : 'hover:scale-102 opacity-70 hover:opacity-100'}`}
                >
                  <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-lg border-2 transition-all duration-300 flex items-center justify-center bg-white dark:bg-gray-800 ${activeChannelId === ch.id ? 'border-red-600 shadow-red-200/50 dark:shadow-none translate-y-[-4px]' : 'border-gray-100 dark:border-gray-800'}`}>
                    {ch.iconUrl ? (
                      <img src={ch.iconUrl} alt={ch.name} className="w-full h-full object-cover" />
                    ) : (
                      <Radio className={`w-6 h-6 ${activeChannelId === ch.id ? 'text-red-600' : 'text-gray-400'}`} />
                    )}
                    {activeChannelId === ch.id && (
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-red-600"></div>
                    )}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-extrabold truncate max-w-[70px] sm:max-w-[80px] transition-colors ${activeChannelId === ch.id ? 'text-red-600' : 'text-gray-500'}`}>
                    {ch.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 font-bold text-gray-500 animate-pulse">جاري التحميل...</div>
      ) : (
        <>
          {activeVideoUrl && (
             <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col pt-10 px-4 pb-4 backdrop-blur-sm">
                <button onClick={handleCloseVideo} className="self-end text-white p-2 mb-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2 font-bold select-none text-sm">
                   إغلاق <span className="text-xl leading-none">&times;</span>
                </button>
                <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col justify-center">
                  <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
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

          <div className="flex items-center gap-2 mb-6 mt-8">
             <MonitorPlay className="w-6 h-6 text-red-600" />
             <h2 className="font-extrabold text-2xl select-none text-[#111827] dark:text-white">فيديوهات والتقارير</h2>
             <span className="bg-[#facc15] text-black text-xs font-extrabold px-2 py-1 rounded shadow-sm mr-2">جديد</span>
          </div>

          {videos.length === 0 ? (
             <p className="text-gray-500 text-center py-10 font-bold bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">لا توجد فيديوهات حالياً</p>
          ) : (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
               {videos.map(vid => (
               <Link to={`/watch/${vid.id}`} key={vid.id} className="group block cursor-pointer">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 mb-3 shadow-md border border-gray-100 dark:border-gray-800">
                     {vid.thumbnailUrl ? (
                        <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                     ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black"></div>
                     )}
                     <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-all duration-300">
                        <PlayCircle className="w-12 h-12 text-white/80 group-hover:text-white transition-all transform group-hover:scale-110 drop-shadow-md" />
                     </div>
                     <div className="absolute top-3 left-3">
                        <div className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-wide">فيديو</div>
                     </div>
                  </div>
                  <div>
                     <h4 className="text-[#111827] dark:text-gray-100 font-bold leading-tight line-clamp-2 text-right text-sm mb-1">{vid.title}</h4>
                     <div className="flex items-center text-[11px] text-gray-500 font-medium">
                        <span>{format(vid.createdAt || Date.now(), "dd MMMM yyyy", { locale: ar })}</span>
                     </div>
                  </div>
               </Link>
               ))}
             </div>
          )}
        </>
      )}
    </div>
  );
}
