import { useEffect, useState, useMemo } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { SyncService } from "../services/SyncService";
import { EventItem } from "../types";
import { format, differenceInDays, isSameDay, isAfter, startOfDay, addDays, isBefore } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  List, 
  LayoutGrid, 
  Clock, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  CalendarDays,
  Timer,
  ExternalLink,
  SlidersHorizontal,
  MapPin,
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { BASE_EVENTS } from "../data/staticEvents";

export function Events() {
  const [dbEvents, setDbEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"cards" | "table" | "calendar" | "timeline">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const events = useMemo(() => {
    const dbTitles = new Set(dbEvents.map(e => e.title));
    const merged = [...dbEvents];
    BASE_EVENTS.forEach((be, i) => {
      if (!dbTitles.has(be.title)) {
        merged.push({ id: `static-${i}`, ...be } as EventItem);
      }
    });
    return merged.sort((a, b) => a.timestamp - b.timestamp);
  }, [dbEvents]);

  useEffect(() => {
    let active = true;
    const unsubPromise = SyncService.syncCollection<EventItem>("events", (data) => {
      if (!active) return;
      setDbEvents(data);
      setLoading(false);
    }, { orderByField: "timestamp", orderDirection: "asc" });

    return () => {
      active = false;
      unsubPromise.then(unsub => unsub());
    };
  }, []);

  const today = startOfDay(new Date());

  const eventOfTheDay = useMemo(() => {
    return events.find(e => isSameDay(startOfDay(new Date(e.timestamp)), today));
  }, [events, today]);

  const upcomingEvents = useMemo(() => {
    return events.filter(e => isAfter(startOfDay(new Date(e.timestamp)), today))
                 .sort((a, b) => a.timestamp - b.timestamp);
  }, [events, today]);

  const nearestUpcoming = upcomingEvents[0];

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           e.hijriDate.includes(searchQuery) ||
                           e.gregorianDate.includes(searchQuery);
      const matchesCategory = selectedCategory === "all" || e.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [events, searchQuery, selectedCategory]);

  const getEventStatus = (timestamp: number) => {
    const eventDate = startOfDay(new Date(timestamp));
    if (isSameDay(eventDate, today)) return { label: "اليوم", color: "bg-emerald-500", text: "text-emerald-600 border-emerald-500/20 bg-emerald-50/50" };
    if (isAfter(eventDate, today)) return { label: "قادمة", color: "bg-amber-500", text: "text-amber-600 border-amber-500/20 bg-amber-50/50" };
    return { label: "منتهية", color: "bg-stone-400", text: "text-stone-500 border-stone-200 bg-stone-50/50" };
  };

  const getRemainingDays = (timestamp: number) => {
    const diff = differenceInDays(startOfDay(new Date(timestamp)), today);
    return diff > 0 ? diff : 0;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-600/10 border-t-emerald-600 animate-spin"></div>
        </div>
        <p className="text-stone-400 text-xs font-bold font-sans">جاري تحميل تقويم المناسبات...</p>
      </div>
    );
  }

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="max-w-7xl mx-auto w-full p-4 pb-20 space-y-8 font-sans" dir="rtl">
      
      {/* Exquisite Top Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-l from-emerald-50/50 via-white to-amber-50/20 rounded-3xl p-6 sm:p-8 border border-stone-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Abstract Background Accents */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
        
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-inner">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2.5xl sm:text-3.5xl font-black text-stone-900 mt-1">تقويم المناسبات</h1>
            </div>
          </div>
          <p className="text-stone-500 text-sm max-w-2xl font-medium leading-relaxed">
            نافذة تفاعلية توثق المناسبات الإسلامية والوطنية الهامة، مع رصد الفواصل الزمنية والتصنيفات الدقيقة لتتبع مسيرة الهداية ومحطات الأمة الإسلامية.
          </p>
        </div>

        {/* Dynamic Counter Widgets */}
        <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-stone-150 shadow-sm shrink-0 self-start md:self-center">
          <div className="text-right px-3">
             <div className="text-2xl font-black text-stone-900">{events.length}</div>
             <div className="text-[10px] font-black text-stone-400">إجمالي المناسبات</div>
          </div>
          <div className="w-px h-8 bg-stone-200"></div>
          <div className="text-right px-3">
             <div className="text-2xl font-black text-emerald-600">{upcomingEvents.length}</div>
             <div className="text-[10px] font-black text-stone-400">مناسبات قادمة</div>
          </div>
        </div>
      </div>

      {/* Modern Bento Highlights Banner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Bento Cell 1: Event of the Day Card */}
        <div className="lg:col-span-7 relative overflow-hidden bg-gradient-to-br from-stone-900 to-emerald-950 rounded-[2rem] p-6 sm:p-8 text-white shadow-xl flex items-center min-h-[240px] group">
           {/* Geometric Islamic Line Motif */}
           <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px] z-0 z-10" />
           
           <div className="relative z-10 w-full flex flex-col justify-between h-full space-y-6">
              <div className="flex items-center justify-between">
                <div className="bg-emerald-500/15 backdrop-blur-lg border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-2 text-emerald-300">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  المناسبة الحالية اليوم
                </div>
                <div className="text-stone-300 font-bold text-xs">{format(today, "EEEE, d MMMM yyyy", { locale: ar })}</div>
              </div>
              
              {eventOfTheDay ? (
                <div className="space-y-4 font-sans">
                  <h2 className="text-2.5xl sm:text-3xl font-black leading-tight text-white group-hover:text-emerald-300 transition-colors duration-300">{eventOfTheDay.title}</h2>
                  <div className="flex flex-wrap gap-4 text-emerald-250 font-bold text-xs">
                    <span className="bg-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5 opacity-80" /> {eventOfTheDay.hijriDate}</span>
                    <span className="bg-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 opacity-80" /> {eventOfTheDay.gregorianDate}</span>
                  </div>
                  <p className="text-stone-300 text-xs sm:text-sm leading-relaxed max-w-xl line-clamp-2">
                    {eventOfTheDay.description || "لا يوجد وصف مدون حالياً لهذه المناسبة الإسلامية الكريمة."}
                  </p>
                  <button 
                    onClick={() => setSelectedEventId(eventOfTheDay.id)}
                    className="bg-emerald-550 border border-emerald-500 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-xs hover:scale-[1.02] transition shadow-lg flex items-center gap-2 cursor-pointer self-start"
                  >
                    عرض التفاصيل الكبرى <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="py-6 text-center w-full font-sans">
                   <div className="text-base font-bold text-emerald-300 flex items-center justify-center gap-2 mb-1.5">
                      <Info className="w-5 h-5 text-amber-500" /> لا توجد مناسبات مسجلة لهذا اليوم التاريخي
                   </div>
                   <p className="text-stone-400 text-xs">تصفح التقويم وأقرب المناسبات من اللوحة المجاورة</p>
                </div>
              )}
           </div>
        </div>

        {/* Bento Cell 2: Nearest Upcoming Card */}
        <div className="lg:col-span-5 relative overflow-hidden bg-white rounded-[2rem] p-6 sm:p-8 border border-stone-150 shadow-sm flex flex-col justify-between group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
           
           {nearestUpcoming ? (
             <div className="relative z-10 flex flex-col h-full justify-between space-y-4">
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                      <div className="bg-amber-50 border border-amber-500/10 text-amber-700 px-3 py-1 rounded-full text-xs font-black flex items-center gap-2">
                        المناسبة القادمة الأقرب
                      </div>
                      <div className="text-amber-600 font-black text-xs sm:text-sm flex items-center gap-1">
                        <Timer className="w-4 h-4 animate-spin-slow" />
                        متبقي {getRemainingDays(nearestUpcoming.timestamp)} يوم
                      </div>
                   </div>
                   
                   <h2 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight group-hover:text-amber-600 transition-colors duration-300">
                     {nearestUpcoming.title}
                   </h2>
                   
                   <p className="text-stone-500 text-xs line-clamp-2 leading-relaxed">
                     {nearestUpcoming.description || "معلومات تفصيلية تنشر قريباً، تفيد السيرة النبوية والمناسبات الإسلامية العظيمة."}
                   </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-stone-400">التاريخ المجدول</span>
                      <span className="text-xs font-bold text-stone-700">{nearestUpcoming.hijriDate}</span>
                   </div>
                   <button 
                    onClick={() => setSelectedEventId(nearestUpcoming.id)}
                    className="text-white bg-stone-900 hover:bg-stone-800 text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                   >
                     استعراض الأن
                   </button>
                </div>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-center text-stone-450 py-10 opacity-60">
                <CalendarDays className="w-12 h-12 mb-2 text-stone-300" />
                <div className="font-bold">لا توجد مناسبات قادمة مجدولة في المدى القريب</div>
             </div>
           )}
        </div>
      </div>

      {/* Advanced Control and Filter Center */}
      <div className="bg-white p-4 rounded-2xl border border-stone-150 shadow-sm flex flex-col lg:flex-row items-center gap-4">
        
        {/* Modern Unified Search Input */}
        <div className="relative flex-1 w-full">
           <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
           <input 
              type="text" 
              placeholder="ابحث باسم المناسبة، التاريخ الهجري أو الميلادي..."
              className="w-full bg-stone-50 border border-transparent focus:border-emerald-500/30 focus:bg-white rounded-xl pr-12 pl-4 py-3 text-sm font-medium transition-all focus:outline-none placeholder:text-stone-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
        
        {/* Dynamic Categorized Filters */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0 w-full lg:w-auto">
           {[
             { id: "all", label: "الكل" },
             { id: "religious", label: "إسلامية ودينية" },
             { id: "national", label: "أحداث ووطنية" },
             { id: "historical", label: "تاريخية ومناسبات" }
           ].map(cat => (
             <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                }`}
             >
                {cat.label}
             </button>
           ))}
        </div>

        {/* Multi-view Interactive Switcher */}
        <div className="bg-stone-50 p-1 rounded-xl flex items-center gap-1 shrink-0 w-full lg:w-auto justify-center">
           {[
             { id: "cards", icon: LayoutGrid, label: "شبكي" },
             { id: "table", icon: List, label: "جدولي" },
             { id: "calendar", icon: CalendarDays, label: "تقويم تفاعلي" },
             { id: "timeline", icon: Clock, label: "خط زمني" }
           ].map(view => (
             <button 
                key={view.id}
                onClick={() => setActiveView(view.id as any)}
                className={`p-2 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                  activeView === view.id 
                    ? 'bg-white text-emerald-600 shadow-sm border border-stone-150 font-black' 
                    : 'text-stone-400 hover:text-stone-700'
                }`}
                title={view.label}
             >
                <view.icon className="w-4.5 h-4.5" />
                <span className="hidden sm:inline">{view.label}</span>
             </button>
           ))}
        </div>
      </div>

      {/* Main Responsive Views Area */}
      <AnimatePresence mode="wait">
        <motion.div
           key={activeView + selectedCategory + searchQuery}
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -15 }}
           transition={{ duration: 0.3 }}
           className="min-h-[400px]"
        >
           {/* Grid Layout View */}
           {activeView === "cards" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {filteredEvents.map(event => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      status={getEventStatus(event.timestamp)} 
                      remaining={getRemainingDays(event.timestamp)}
                      onView={() => setSelectedEventId(event.id)}
                    />
                 ))}
                 {filteredEvents.length === 0 && <NoResultsFound />}
              </div>
           )}

           {/* Table Layout View */}
           {activeView === "table" && (
              <div className="bg-white rounded-[1.5rem] border border-stone-150 shadow-sm overflow-x-auto">
                 <table className="w-full text-right border-collapse">
                    <thead>
                       <tr className="bg-stone-50 text-stone-500 font-black text-xs border-b border-stone-100">
                          <th className="p-4.5">#</th>
                          <th className="p-4.5">المناسبة</th>
                          <th className="p-4.5">التاريخ الهجري</th>
                          <th className="p-4.5">التاريخ الميلادي</th>
                          <th className="p-4.5">الحالة متبقي</th>
                          <th className="p-4.5 text-center">الإجراءات</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                       {filteredEvents.map((event, idx) => {
                          const status = getEventStatus(event.timestamp);
                          const rem = getRemainingDays(event.timestamp);
                          return (
                            <tr key={event.id} className="hover:bg-stone-50/50 transition-colors">
                               <td className="p-4.5 text-xs font-bold text-stone-400">{idx + 1}</td>
                               <td className="p-4.5">
                                  <div className="font-extrabold text-stone-900 text-sm">{event.title}</div>
                                  <div className="text-[10px] text-stone-400 font-bold mt-0.5">{event.dayName}</div>
                               </td>
                               <td className="p-4.5 text-xs font-bold text-emerald-700">{event.hijriDate}</td>
                               <td className="p-4.5 text-xs font-medium text-stone-500">{event.gregorianDate}</td>
                               <td className="p-4.5">
                                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${status.text}`}>
                                     {rem === 0 ? 'اليوم' : `متبقي ${rem} يوم`}
                                  </span>
                               </td>
                               <td className="p-4.5 text-center">
                                  <button 
                                    onClick={() => setSelectedEventId(event.id)}
                                    className="text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors inline-block cursor-pointer"
                                  >
                                     <Info className="w-4.5 h-4.5" />
                                  </button>
                               </td>
                            </tr>
                          );
                       })}
                    </tbody>
                 </table>
                 {filteredEvents.length === 0 && <NoResultsFound className="py-20" />}
              </div>
           )}

           {/* Calendar Layout View */}
           {activeView === "calendar" && (
              <div className="flex flex-col items-center">
                 <div className="w-full max-w-4xl bg-white rounded-[2rem] border border-stone-150 shadow-sm p-4 sm:p-8">
                    <style>{`
                      .react-calendar {
                        width: 100%;
                        border: none;
                        font-family: inherit;
                        background: transparent;
                      }
                      .react-calendar__navigation {
                        display: flex;
                        margin-bottom: 1.5rem;
                        border-bottom: 1px solid #f3f4f6;
                        padding-bottom: 1rem;
                      }
                      .react-calendar__navigation button {
                        font-weight: 800;
                        color: #047857;
                        font-size: 1.05rem;
                        min-width: 44px;
                        background: none;
                        border: none;
                        cursor: pointer;
                        padding: 0.5rem;
                        border-radius: 12px;
                        transition: all 0.2s;
                      }
                      .react-calendar__navigation button:enabled:hover {
                        background-color: #ecfdf5;
                        color: #065f46;
                      }
                      .react-calendar__month-view__weekdays {
                         font-weight: 800;
                         text-transform: none;
                         color: #6b7280;
                         font-size: 0.85rem;
                         padding-bottom: 0.5rem;
                      }
                      .react-calendar__month-view__weekdays__weekday {
                        text-align: center;
                      }
                      .react-calendar__month-view__days {
                        gap: 4px;
                      }
                      .react-calendar__tile {
                         padding: 1.2rem 0.5rem;
                         border-radius: 12px;
                         font-weight: 700;
                         color: #374151;
                         background: none;
                         border: none;
                         cursor: pointer;
                         transition: all 0.2s;
                         position: relative;
                      }
                      .react-calendar__tile:enabled:hover {
                         background-color: #fafaf9;
                         color: #047857;
                      }
                      .react-calendar__tile--now {
                         background: #f0fdf4 !important;
                         color: #166534 !important;
                         border: 1px solid #bbf7d0 !important;
                      }
                      .react-calendar__tile--active {
                         background: #047857 !important;
                         color: white !important;
                      }
                      .event-tile {
                         color: #047857 !important;
                         font-weight: 900 !important;
                      }
                      .event-dot {
                         width: 5px;
                         height: 5px;
                         background-color: #d97706;
                         border-radius: 50%;
                         margin: 4px auto 0;
                         position: absolute;
                         bottom: 6px;
                         left: 50%;
                         transform: translateX(-50%);
                      }
                    `}</style>
                    <Calendar 
                       locale="ar"
                       className="mx-auto"
                       tileClassName={({ date }) => {
                          const hasEvent = events.some(e => isSameDay(new Date(e.timestamp), date));
                          return hasEvent ? 'event-tile' : '';
                       }}
                       tileContent={({ date }) => {
                          const hasEvent = events.some(e => isSameDay(new Date(e.timestamp), date));
                          return hasEvent ? <div className="event-dot"></div> : null;
                       }}
                       onClickDay={(date) => {
                          const event = events.find(e => isSameDay(new Date(e.timestamp), date));
                          if (event) setSelectedEventId(event.id);
                       }}
                    />
                 </div>
                 
                 {/* Quick upcoming list beneath calendar */}
                 <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                    {events.filter(e => isAfter(new Date(e.timestamp), today) || isSameDay(new Date(e.timestamp), today)).slice(0, 4).map(e => (
                       <div key={e.id} onClick={() => setSelectedEventId(e.id)} className="flex items-center gap-4 bg-white p-4.5 rounded-2xl border border-stone-150 shadow-sm cursor-pointer hover:border-emerald-500/30 transition-all select-none">
                          <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center font-black text-emerald-800 text-sm">
                             {format(new Date(e.timestamp), "d")}
                          </div>
                          <div className="flex-1">
                             <h4 className="text-sm font-black text-stone-900 truncate">{e.title}</h4>
                             <p className="text-[10px] font-bold text-stone-450">{e.hijriDate} • {e.gregorianDate}</p>
                          </div>
                          <ChevronLeft className="w-4.5 h-4.5 text-stone-300" />
                       </div>
                    ))}
                 </div>
              </div>
           )}

           {/* Timeline Layout View */}
           {activeView === "timeline" && (
              <div className="relative py-12 max-w-2xl mx-auto px-4 overflow-hidden">
                 {/* Luxury Central Line Indicator */}
                 <div className="absolute top-0 right-1/2 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-emerald-600 via-amber-500 to-stone-200"></div>
                 
                 <div className="space-y-10">
                    {filteredEvents.map((event, idx) => (
                       <TimelineItem 
                          key={event.id} 
                          event={event} 
                          idx={idx} 
                          status={getEventStatus(event.timestamp)}
                          onView={() => setSelectedEventId(event.id)}
                       />
                    ))}
                 </div>
                 {filteredEvents.length === 0 && <NoResultsFound />}
              </div>
           )}
        </motion.div>
      </AnimatePresence>

      {/* Event Details Modal */}
      <EventDetailsModal 
        event={selectedEvent} 
        events={events}
        onClose={() => setSelectedEventId(null)} 
      />
    </div>
  );
}

function EventCard({ event, status, remaining, onView }: { event: EventItem, status: any, remaining: number, onView: () => void, key?: any }) {
  return (
    <motion.div 
      onClick={onView}
      whileHover={{ y: -4, scale: 1.01 }}
      className="bg-white rounded-2xl p-5 border border-stone-150 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
    >
       {/* Highlight Bar */}
       <div className={`absolute top-0 right-0 w-1.5 h-full ${status.color}`}></div>
       
       <div>
         <div className="flex justify-between items-start mb-4">
            <div className="bg-stone-50 border border-stone-100 px-2.5 py-1.5 rounded-xl font-black text-emerald-800 text-xs">
               {event.hijriDate.split(" ")[0]} {event.hijriDate.split(" ")[1]}
            </div>
            <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border ${status.text}`}>
               {status.label}
            </span>
         </div>
         
         <h3 className="text-sm sm:text-base font-black text-stone-900 leading-tight mb-2 group-hover:text-emerald-700 transition-colors">
           {event.title}
         </h3>

         <p className="text-stone-400 text-xs line-clamp-2 leading-relaxed mb-4">
            {event.description || "استعرض التفاصيل لمعرفة الأهمية الكبرى والأبعاد الدينية والتوعوية للحدث."}
         </p>
       </div>

       <div className="flex items-center justify-between pt-4 border-t border-stone-100 mt-auto">
          <span className="text-[10px] sm:text-xs font-black text-emerald-700 group-hover:underline flex items-center gap-1">عرض التفاصيل <ChevronLeft className="w-3.5 h-3.5" /></span>
          {remaining > 0 && (
             <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg">
               <Timer className="w-3.5 h-3.5" />
               متبقي {remaining} يوم
             </span>
          )}
       </div>
    </motion.div>
  );
}

function TimelineItem({ event, idx, status, onView }: { event: EventItem, idx: number, status: any, onView: () => void, key?: any }) {
  const isEven = idx % 2 === 0;
  return (
    <div className={`relative flex items-center gap-6 ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
       {/* Circle Connector */}
       <div className={`absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full border-4 border-white z-10 shadow-sm ${status.color}`}></div>
       
       {/* Card Container */}
       <div className={`w-1/2 ${isEven ? 'text-left pl-2' : 'text-right pr-2'}`}>
          <motion.div 
             whileHover={{ scale: 1.02 }}
             onClick={onView}
             className="inline-block bg-white p-4.5 rounded-2xl border border-stone-150 shadow-xs cursor-pointer hover:shadow-md transition-all text-right"
          >
             <div className="bg-emerald-50 text-emerald-800 text-[9px] font-black px-2.5 py-0.5 rounded-md inline-block mb-2">
                {event.hijriDate}
             </div>
             <h4 className="text-xs sm:text-sm font-black text-stone-900 mb-1 leading-tight">{event.title}</h4>
             <div className="text-[10px] text-stone-400 font-bold">{event.gregorianDate}</div>
          </motion.div>
       </div>
       
       {/* Number Pointer */}
       <div className={`w-1/2 text-center ${isEven ? 'text-right pr-2 animate-pulse' : 'text-left pl-2 animate-pulse'}`}>
          <div className="text-xl font-black text-stone-200 select-none">
             #{idx + 1}
          </div>
       </div>
    </div>
  );
}

function NoResultsFound({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200 w-full ${className}`}>
       <Search className="w-10 h-10 text-stone-300 mb-3" />
       <div className="text-sm font-bold text-stone-500">مرحباً.. لا توجد نتائج مطابقة لبحثك</div>
       <p className="text-stone-400 text-xs mt-1">تأكد من كتابة الكلمات بشكل صحيح وتصفية الفئات والمناسبات الفرعية</p>
    </div>
  );
}

function EventDetailsModal({ event, events, onClose }: { event: EventItem | undefined, events: EventItem[], onClose: () => void }) {
  if (!event) return null;

  const today = startOfDay(new Date());
  const diff = differenceInDays(startOfDay(new Date(event.timestamp)), today);
  const statusLabel = diff === 0 ? "يحدث اليوم" : (diff > 0 ? "قادمة قريباً" : "مناسبة منتهية");
  const statusTheme = diff === 0 
    ? { btn: "bg-emerald-600 text-white", badge: "bg-emerald-50 text-emerald-800 border-emerald-500/10" } 
    : (diff > 0 
        ? { btn: "bg-amber-600 text-white", badge: "bg-amber-50 text-amber-800 border-amber-500/10" } 
        : { btn: "bg-stone-800 text-white", badge: "bg-stone-100 text-stone-600 border-stone-200" });

  const sortedEvents = [...events].sort((a,b) => a.timestamp - b.timestamp);
  const currentIndex = sortedEvents.findIndex(e => e.id === event.id);
  
  const prevEvent = currentIndex > 0 ? sortedEvents[currentIndex - 1] : null;
  const nextEvent = currentIndex < sortedEvents.length - 1 ? sortedEvents[currentIndex + 1] : null;
  
  const daysFromPrev = prevEvent ? differenceInDays(new Date(event.timestamp), new Date(prevEvent.timestamp)) : null;
  const daysToNext = nextEvent ? differenceInDays(new Date(nextEvent.timestamp), new Date(event.timestamp)) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in" dir="rtl">
       <button onClick={onClose} className="absolute inset-0 cursor-default bg-transparent w-full h-full border-none" />
       
       <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl border border-stone-100 overflow-hidden flex flex-col p-6 max-h-[90vh]"
       >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-stone-100">
             <div className="space-y-1">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border ${statusTheme.badge}`}>
                   {statusLabel}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-stone-900 leading-tight mt-1">{event.title}</h2>
                <p className="text-xs text-stone-400 font-semibold">{event.gregorianDate} - {event.dayName}</p>
             </div>
             
             <button 
                onClick={onClose} 
                className="text-stone-400 hover:text-stone-800 bg-stone-50 hover:bg-stone-100 p-2 rounded-xl transition cursor-pointer"
             >
                <ChevronRight className="w-5 h-5" />
             </button>
          </div>

          {/* Body Content */}
          <div className="grow overflow-y-auto py-5 space-y-5">
             
             {/* Main Description */}
             <div className="space-y-2">
                <div className="flex items-center gap-1 px-1">
                   <Info className="w-4 h-4 text-emerald-600" />
                   <span className="text-xs font-black text-stone-400">ملخص وموضوع المناسبة</span>
                </div>
                <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4.5 text-xs sm:text-sm text-stone-605 leading-relaxed font-medium">
                   {event.description || "معلومات تفصيلية تنشر قريباً لتغطية هذه الذكرى والمناسبة الدينية والوطنية الهامة التابعة للثقافة القرآنية المباركة."}
                </div>
             </div>

             {/* Dates Comparison Bento cards */}
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50/50 border border-emerald-500/10 p-4 rounded-xl">
                   <span className="text-[10px] font-black text-emerald-800 block mb-0.5">التاريخ الهجري</span>
                   <span className="text-xs sm:text-sm font-extrabold text-stone-800">{event.hijriDate}</span>
                </div>
                <div className="bg-amber-50/40 border border-amber-500/10 p-4 rounded-xl">
                   <span className="text-[10px] font-black text-amber-700 block mb-0.5">تباعد الأيام للحدث</span>
                   <span className="text-xs sm:text-sm font-extrabold text-stone-850">
                      {diff > 0 ? `متبقي ${diff} يوم` : (diff === 0 ? "يصادف اليوم" : "منتهية ومضت")}
                   </span>
                </div>
             </div>

             {/* Time Gaps between adjacent events */}
             <div className="space-y-2">
                <div className="flex items-center gap-1 px-1">
                   <Timer className="w-4 h-4 text-amber-500" />
                   <span className="text-xs font-black text-stone-400">الربط والمسافات الزمنية</span>
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs font-bold font-sans">
                   {prevEvent && (
                     <div className="flex items-center justify-between p-3.5 bg-stone-50 hover:bg-stone-100 rounded-xl transition">
                        <span className="text-stone-500 leading-none">فترة البعد عن [{prevEvent.title.slice(0, 20)}...]:</span>
                        <span className="text-emerald-700 font-extrabold">+{daysFromPrev} يوم</span>
                     </div>
                   )}
                   {nextEvent && (
                     <div className="flex items-center justify-between p-3.5 bg-stone-50 hover:bg-stone-100 rounded-xl transition">
                        <span className="text-stone-500 leading-none">فترة القرب من [{nextEvent.title.slice(0, 20)}...]:</span>
                        <span className="text-amber-700 font-extrabold">{daysToNext} يوم</span>
                     </div>
                   )}
                </div>
             </div>
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-stone-100 flex gap-3">
             <button 
               onClick={onClose}
               className="flex-1 bg-stone-900 hover:bg-stone-800 text-white py-3.5 rounded-xl text-xs sm:text-sm font-black shadow-lg transition duration-200 cursor-pointer text-center"
             >
                إغلاق
             </button>
             <button 
               onClick={() => {
                 navigator.clipboard.writeText(`${event.title} - ${event.hijriDate}`);
                 alert("تم نسخ تفاصيل المناسبة بنجاح!");
               }}
               className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer"
             >
                <Share2 className="w-4.5 h-4.5" />
                <span className="hidden sm:inline">نشر المناسبة</span>
             </button>
          </div>
       </motion.div>
    </div>
  );
}
