import { useEffect, useState, useMemo } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { EventItem } from "../types";
import { format, differenceInDays, isSameDay, isAfter, startOfDay, addDays, isBefore } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  List, 
  LayoutGrid, 
  Clock, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  CalendarDays,
  Timer,
  Calendar as CalendarIconAlt,
  ExternalLink
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
    const unsub = onSnapshot(query(collection(db, "events"), orderBy("timestamp", "asc")), (snap) => {
      setDbEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as EventItem)));
      setLoading(false);
    });
    return unsub;
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
    if (isSameDay(eventDate, today)) return { label: "اليوم", color: "bg-green-500", text: "text-green-500" };
    if (isAfter(eventDate, today)) return { label: "قادمة", color: "bg-blue-500", text: "text-blue-500" };
    return { label: "منتهية", color: "bg-gray-400", text: "text-gray-400" };
  };

  const getRemainingDays = (timestamp: number) => {
    const diff = differenceInDays(startOfDay(new Date(timestamp)), today);
    return diff > 0 ? diff : 0;
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="max-w-7xl mx-auto w-full p-4 pb-20 space-y-10" dir="rtl">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 mb-2">
            <CalendarIcon className="w-8 h-8" />
            <h1 className="text-3xl font-black">تقويم المناسبات</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium font-sans">تغطية شاملة لأهم المناسبات الدينية والوطنية والتاريخية بشكل تفاعلي</p>
        </div>
        <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="text-center px-4">
             <div className="text-2xl font-black text-gray-900 dark:text-white">{events.length}</div>
             <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">إجمالي المناسبات</div>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-800"></div>
          <div className="text-center px-4">
             <div className="text-2xl font-black text-blue-600">{upcomingEvents.length}</div>
             <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">مناسبات قادمة</div>
          </div>
        </div>
      </div>

      {/* Special Highlights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event of the Day */}
        <div className="relative group overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/10 transition-all hover:shadow-emerald-500/20 min-h-[220px] flex items-center">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="relative z-10 w-full">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  مناسبة اليوم
                </div>
                <div className="text-white/80 font-bold text-xs">{format(today, "EEEE, d MMMM yyyy", { locale: ar })}</div>
              </div>
              
              {eventOfTheDay ? (
                <div className="space-y-4 font-sans">
                  <h2 className="text-3xl font-black leading-tight">{eventOfTheDay.title}</h2>
                  <div className="flex flex-wrap gap-4 text-emerald-50 font-bold text-xs">
                    <div className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4 opacity-70"/> {eventOfTheDay.hijriDate}</div>
                    <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 opacity-70"/> {eventOfTheDay.gregorianDate}</div>
                  </div>
                  <p className="text-emerald-50/80 text-sm leading-relaxed line-clamp-2 italic">
                    {eventOfTheDay.description || "لا يوجد وصف حالي لهذه المناسبة الهامة."}
                  </p>
                  <button 
                    onClick={() => setSelectedEventId(eventOfTheDay.id)}
                    className="bg-white text-emerald-700 px-6 py-2.5 rounded-xl font-black text-sm hover:bg-emerald-50 transition shadow-lg flex items-center gap-2"
                  >
                    عرض التفاصيل <ChevronLeft className="w-4 h-4"/>
                  </button>
                </div>
              ) : (
                <div className="py-6 text-center font-sans">
                   <div className="text-lg font-bold text-emerald-100 flex items-center justify-center gap-2 mb-2">
                      <Info className="w-5 h-5"/> لا توجد مناسبات مسجلة لهذا اليوم
                   </div>
                   <p className="text-emerald-100/60 text-sm">تصفح التقويم أدناه لعرض المناسبات القادمة</p>
                </div>
              )}
           </div>
        </div>

        {/* Nearest Upcoming */}
        <div className="relative group overflow-hidden bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none transition-all hover:border-blue-500/30">
           {nearestUpcoming ? (
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                   <div className="flex items-center justify-between mb-4">
                      <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                        أقرب مناسبة قادمة
                      </div>
                      <div className="flex items-center gap-2 text-orange-500 font-black text-sm">
                        <Timer className="w-4 h-4" />
                        متبقي {getRemainingDays(nearestUpcoming.timestamp)} يوم
                      </div>
                   </div>
                   <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-3">
                     {nearestUpcoming.title}
                   </h2>
                   <div className="flex gap-4 text-gray-500 dark:text-gray-400 font-bold text-xs mb-4">
                      <span>{nearestUpcoming.hijriDate}</span>
                      <span>•</span>
                      <span>{nearestUpcoming.gregorianDate}</span>
                   </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                   <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white dark:border-gray-800"></div>
                      <div className="w-8 h-8 rounded-full bg-blue-400 border-2 border-white dark:border-gray-800"></div>
                      <div className="w-8 h-8 rounded-full bg-blue-300 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] font-bold text-white">+{upcomingEvents.length}</div>
                   </div>
                   <button 
                    onClick={() => setSelectedEventId(nearestUpcoming.id)}
                    className="text-white bg-blue-600 px-5 py-2 rounded-xl font-black text-xs hover:bg-blue-700 transition shadow-md"
                   >
                     تصفح المناسبة
                   </button>
                </div>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-10 opacity-60">
                <CalendarDays className="w-12 h-12 mb-2" />
                <div className="font-bold">لا توجد مناسبات قادمة مجدولة</div>
             </div>
           )}
        </div>
      </div>

      {/* Controls & Navigation */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/40 dark:shadow-none flex flex-col lg:flex-row items-center gap-6">
        {/* Search */}
        <div className="relative flex-1 w-full">
           <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
           <input 
              type="text" 
              placeholder="ابحث باسم المناسبة، التاريخ الهجري أو الميلادي..."
              className="w-full bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-blue-500/50 focus:bg-white dark:focus:bg-gray-800 rounded-2xl pr-12 pl-4 py-3 text-sm font-medium transition-all focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
           {[
             { id: "all", label: "الكل" },
             { id: "religious", label: "دينية" },
             { id: "national", label: "وطنية" },
             { id: "historical", label: "تاريخية" }
           ].map(cat => (
             <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${selectedCategory === cat.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-gray-50 dark:bg-gray-900 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
             >
                {cat.label}
             </button>
           ))}
        </div>

        {/* View Switcher */}
        <div className="bg-gray-50 dark:bg-gray-900 p-1 rounded-2xl flex items-center gap-1 shrink-0">
           {[
             { id: "cards", icon: LayoutGrid, label: "بطاقات" },
             { id: "table", icon: List, label: "جدول" },
             { id: "calendar", icon: CalendarDays, label: "تقويم" },
             { id: "timeline", icon: Clock, label: "خط زمني" }
           ].map(view => (
             <button 
                key={view.id}
                onClick={() => setActiveView(view.id as any)}
                className={`p-2.5 rounded-xl transition-all ${activeView === view.id ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                title={view.label}
             >
                <view.icon className="w-5 h-5" />
             </button>
           ))}
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
           key={activeView + selectedCategory + searchQuery}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           transition={{ duration: 0.2 }}
           className="min-h-[400px]"
        >
           {activeView === "cards" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

           {activeView === "table" && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-x-auto">
                 <table className="w-full text-right border-collapse">
                    <thead>
                       <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 font-black text-xs border-b border-gray-100 dark:border-gray-700">
                          <th className="p-5">م</th>
                          <th className="p-5">المناسبة</th>
                          <th className="p-5">التاريخ الهجري</th>
                          <th className="p-5">التاريخ الميلادي</th>
                          <th className="p-5">المتبقي</th>
                          <th className="p-5 text-center">الإجراءات</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                       {filteredEvents.map((event, idx) => (
                          <tr key={event.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                             <td className="p-5 text-xs font-bold text-gray-400">{idx + 1}</td>
                             <td className="p-5">
                                <div className="font-black text-gray-900 dark:text-white text-sm">{event.title}</div>
                                <div className="text-[10px] text-gray-400 mt-1 font-bold">{event.dayName}</div>
                             </td>
                             <td className="p-5 text-xs font-bold text-blue-600 dark:text-blue-400">{event.hijriDate}</td>
                             <td className="p-5 text-xs font-medium text-gray-400">{event.gregorianDate}</td>
                             <td className="p-5">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${getRemainingDays(event.timestamp) === 0 ? 'bg-green-100 text-green-700' : 'bg-orange-50 text-orange-600'}`}>
                                   {getRemainingDays(event.timestamp) === 0 ? 'اليوم' : `متبقي ${getRemainingDays(event.timestamp)} يوم`}
                                </span>
                             </td>
                             <td className="p-5 text-center">
                                <button 
                                  onClick={() => setSelectedEventId(event.id)}
                                  className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition-colors inline-block"
                                >
                                   <Info className="w-5 h-5" />
                                </button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
                 {filteredEvents.length === 0 && <NoResultsFound className="py-20" />}
              </div>
           )}

           {activeView === "calendar" && (
              <div className="flex flex-col items-center">
                 <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-2xl p-4 sm:p-8">
                    <style>{`
                      .react-calendar {
                        width: 100%;
                        border: none;
                        font-family: inherit;
                        background: transparent;
                      }
                      .react-calendar__navigation button {
                        font-weight: 800;
                        color: #2563eb;
                        font-size: 1.1rem;
                      }
                      .react-calendar__navigation button:enabled:hover, .react-calendar__navigation button:enabled:focus {
                        background-color: #eff6ff;
                        border-radius: 12px;
                      }
                      .react-calendar__month-view__weekdays {
                         font-weight: 700;
                         text-transform: none;
                         color: #94a3b8;
                         font-size: 0.8rem;
                      }
                      .react-calendar__tile {
                         padding: 1.5rem 0.5rem;
                         border-radius: 16px;
                         font-weight: 700;
                         transition: all 0.2s;
                         position: relative;
                      }
                      .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus {
                         background-color: #f8fafc;
                         color: #2563eb;
                      }
                      .react-calendar__tile--now {
                         background: #eff6ff !important;
                         color: #2563eb !important;
                      }
                      .react-calendar__tile--active {
                         background: #2563eb !important;
                         color: white !important;
                         box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
                      }
                      .event-tile {
                         color: #2563eb !important;
                      }
                      .event-dot {
                         width: 6px;
                         height: 6px;
                         background-color: #2563eb;
                         border-radius: 50%;
                         margin: 4px auto 0;
                         position: absolute;
                         bottom: 8px;
                         left: 50%;
                         transform: translateX(-50%);
                      }
                      .dark .react-calendar__navigation button { color: #60a5fa; }
                      .dark .react-calendar__navigation button:enabled:hover { background-color: #1e293b; }
                      .dark .react-calendar__tile { color: #e2e8f0; }
                      .dark .react-calendar__tile:enabled:hover { background-color: #111827; color: #60a5fa; }
                      .dark .react-calendar__tile--now { background: #1e293b !important; color: #60a5fa !important; }
                      .dark .event-dot { background-color: #60a5fa; }
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
                 <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                    {events.filter(e => isAfter(new Date(e.timestamp), today) || isSameDay(new Date(e.timestamp), today)).slice(0, 4).map(e => (
                       <div key={e.id} onClick={() => setSelectedEventId(e.id)} className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer hover:border-blue-500/50 transition-all">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center font-black text-blue-600 dark:text-blue-400 text-sm">
                             {format(new Date(e.timestamp), "d")}
                          </div>
                          <div className="flex-1">
                             <h4 className="text-sm font-black text-gray-900 dark:text-white truncate">{e.title}</h4>
                             <p className="text-[10px] font-bold text-gray-500">{e.hijriDate} • {e.gregorianDate}</p>
                          </div>
                          <ChevronLeft className="w-4 h-4 text-gray-300" />
                       </div>
                    ))}
                 </div>
              </div>
           )}

           {activeView === "timeline" && (
              <div className="relative py-10 max-w-2xl mx-auto px-4 overflow-hidden">
                 <div className="absolute top-0 right-1/2 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-blue-600 via-purple-500 to-gray-200 dark:to-gray-800"></div>
                 <div className="space-y-12">
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
        events={events} // Pass full list to calculate prev/next
        onClose={() => setSelectedEventId(null)} 
      />
    </div>
  );
}

function EventCard({ event, status, remaining, onView }: { event: EventItem, status: any, remaining: number, onView: () => void, key?: any }) {
  return (
    <div 
      onClick={onView}
      className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
    >
       <div className={`absolute top-0 right-0 w-1.5 h-full ${status.color}`}></div>
       <div className="flex justify-between items-start mb-6">
          <div className="bg-gray-50 dark:bg-gray-900 w-12 h-12 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-gray-700 font-black text-blue-600 dark:text-blue-400 text-sm">
             {event.hijriDate.split(" ")[0]}
          </div>
          <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-sm ${status.color} text-white`}>
             {status.label}
          </span>
       </div>
       
       <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight mb-2 group-hover:text-blue-600 transition-colors">
         {event.title}
       </h3>
       
       <div className="flex flex-col gap-1.5 mb-6">
          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500">
             <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
             {event.hijriDate}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
             <Clock className="w-3.5 h-3.5 text-gray-300" />
             {event.gregorianDate}
          </div>
       </div>

       <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700/50">
          <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400">عرض التفاصيل</span>
          {remaining > 0 && (
             <span className="text-[10px] font-black text-orange-500 flex items-center gap-1">
               <Timer className="w-3 h-3" />
               {remaining} يوم
             </span>
          )}
       </div>
    </div>
  );
}

function TimelineItem({ event, idx, status, onView }: { event: EventItem, idx: number, status: any, onView: () => void, key?: any }) {
  const isEven = idx % 2 === 0;
  return (
    <div className={`relative flex items-center gap-8 ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
       {/* Circle Connector */}
       <div className={`absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-white dark:border-gray-900 z-10 ${status.color}`}></div>
       
       {/* Card Container */}
       <div className={`w-1/2 ${isEven ? 'text-left pl-4' : 'text-right pr-4'}`}>
          <motion.div 
             whileHover={{ scale: 1.02 }}
             onClick={onView}
             className="inline-block bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-md cursor-pointer hover:shadow-blue-500/10 transition-all text-right"
          >
             <div className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full inline-block mb-2 uppercase tracking-tight">
                {event.hijriDate}
             </div>
             <h4 className="text-sm font-black text-gray-900 dark:text-white mb-1">{event.title}</h4>
             <div className="text-[10px] text-gray-500 font-bold">{event.gregorianDate}</div>
          </motion.div>
       </div>
       
       {/* Date Indicator on other side */}
       <div className={`w-1/2 text-center ${isEven ? 'text-right pr-4' : 'text-left pl-4'}`}>
          <div className="text-lg font-black text-gray-200 dark:text-gray-800 select-none">
             #{idx + 1}
          </div>
       </div>
    </div>
  );
}

function NoResultsFound({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 w-full ${className}`}>
       <Search className="w-12 h-12 text-gray-300 mb-4" />
       <div className="text-lg font-bold text-gray-500">لم يتم العثور على مناسبات</div>
       <p className="text-gray-400 text-sm mt-2">جرب تغيير كلمات البحث أو الفلاتر المختارة</p>
    </div>
  );
}

function EventDetailsModal({ event, events, onClose }: { event: EventItem | undefined, events: EventItem[], onClose: () => void }) {
  if (!event) return null;

  const today = startOfDay(new Date());
  const diff = differenceInDays(startOfDay(new Date(event.timestamp)), today);
  const statusLabel = diff === 0 ? "يحدث اليوم" : (diff > 0 ? "قادمة" : "منتهية");
  const statusColor = diff === 0 ? "bg-green-600" : (diff > 0 ? "bg-blue-600" : "bg-gray-500");

  // Calculate gaps
  const sortedEvents = [...events].sort((a,b) => a.timestamp - b.timestamp);
  const currentIndex = sortedEvents.findIndex(e => e.id === event.id);
  
  const prevEvent = currentIndex > 0 ? sortedEvents[currentIndex - 1] : null;
  const nextEvent = currentIndex < sortedEvents.length - 1 ? sortedEvents[currentIndex + 1] : null;
  
  const daysFromPrev = prevEvent ? differenceInDays(new Date(event.timestamp), new Date(prevEvent.timestamp)) : null;
  const daysToNext = nextEvent ? differenceInDays(new Date(nextEvent.timestamp), new Date(event.timestamp)) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in" dir="rtl">
       <button onClick={onClose} className="absolute inset-0 cursor-default" />
       <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
       >
          <div className={`w-full md:w-1/3 p-8 flex flex-col items-center justify-center text-white text-center relative ${statusColor}`}>
             <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
             <div className="relative z-10 w-full">
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md mx-auto mb-6 flex items-center justify-center shadow-inner">
                   <CalendarIcon className="w-12 h-12" />
                </div>
                <div className="text-4xl font-black mb-1">{event.hijriDate.split(" ")[0]}</div>
                <div className="text-sm font-bold opacity-80">{event.hijriDate.split(" ")[1]}</div>
                <div className="mt-8 pt-6 border-t border-white/20">
                   <div className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">حالة المناسبة</div>
                   <div className="bg-white text-gray-900 px-4 py-1.5 rounded-full text-xs font-black shadow-lg inline-block">
                     {statusLabel}
                   </div>
                </div>
             </div>
          </div>
          
          <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
             <div className="flex justify-between items-start mb-6">
                <div>
                   <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-2">{event.title}</h2>
                   <div className="text-blue-600 dark:text-blue-400 font-bold text-sm">{event.dayName} • {event.gregorianDate}</div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
                   <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
             </div>

             <div className="space-y-6">
                {event.description && (
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                       <Info className="w-4 h-4" /> وصف المناسبة
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                      {event.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-800/50">
                      <div className="text-[10px] font-black text-orange-400 uppercase mb-1">الوقت المتبقي</div>
                      <div className="text-xl font-black text-orange-600">{diff > 0 ? `${diff} أيام` : (diff === 0 ? "اليوم" : "انتهت")}</div>
                   </div>
                   <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                      <div className="text-[10px] font-black text-blue-400 uppercase mb-1">الترتيب السنوي</div>
                      <div className="text-xl font-black text-blue-600">#{currentIndex + 1}</div>
                   </div>
                </div>

                <div className="space-y-3">
                   <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Timer className="w-4 h-4" /> الفواصل الزمنية
                   </h4>
                   <div className="grid grid-cols-1 gap-2 text-xs font-bold">
                      {prevEvent && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                           <span className="text-gray-500">من المناسبة السابقة:</span>
                           <span className="text-gray-900 dark:text-white">+{daysFromPrev} يوم</span>
                        </div>
                      )}
                      {nextEvent && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                           <span className="text-gray-500">إلى المناسبة القادمة:</span>
                           <span className="text-gray-900 dark:text-white">{daysToNext} يوم</span>
                        </div>
                      )}
                   </div>
                </div>
             </div>

             <button 
               onClick={onClose}
               className="w-full bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-4 rounded-2xl font-black text-sm mt-8 shadow-xl transition hover:opacity-90"
             >
                إغلاق النافذة
             </button>
          </div>
       </motion.div>
    </div>
  );
}
