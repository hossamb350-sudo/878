import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SyncService } from "../../services/SyncService";
import { EventItem } from "../../types";
import {
  format,
  differenceInDays,
  isSameDay,
  isAfter,
  startOfDay,
} from "date-fns";
import { ar } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  List,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  CalendarDays,
  Timer,
  SlidersHorizontal,
  MapPin,
  Share2,
  BookOpen,
  History as HistoryIcon,
  Tag,
  ArrowRight,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BASE_EVENTS } from "../../data/staticEvents";
import { ModernEventCard } from "../../components/ModernEventCard";
import { PullToRefresh } from "../../components/PullToRefresh";
import { HijriCalendarWidget } from "../../components/HijriCalendarWidget";

const HIJRI_MONTHS = [
  { id: 1, name: "محرم" },
  { id: 2, name: "صفر" },
  { id: 3, name: "ربيع الأول" },
  { id: 4, name: "ربيع الثاني" },
  { id: 5, name: "جمادى الأولى" },
  { id: 6, name: "جمادى الآخرة" },
  { id: 7, name: "رجب" },
  { id: 8, name: "شعبان" },
  { id: 9, name: "رمضان" },
  { id: 10, name: "شوال" },
  { id: 11, name: "ذو القعدة" },
  { id: 12, name: "ذو الحجة" },
];

function getEventHijriMonthIndex(hijriDateStr: string): number {
  if (!hijriDateStr) return 1;
  const str = hijriDateStr.trim();
  if (str.includes("محرم")) return 1;
  if (str.includes("صفر")) return 2;
  if (str.includes("ربيع الأول") || str.includes("ربيع 1") || str.includes("ربيع الاول")) return 3;
  if (str.includes("ربيع الثاني") || str.includes("ربيع الآخر") || str.includes("ربيع 2") || str.includes("ربيع الاخر")) return 4;
  if (str.includes("جمادى الأولى") || str.includes("جمادى 1") || str.includes("جمادى الاولى")) return 5;
  if (str.includes("جمادى الآخرة") || str.includes("جمادى الثانية") || str.includes("جمادى 2") || str.includes("جمادى الاخره")) return 6;
  if (str.includes("رجب")) return 7;
  if (str.includes("شعبان")) return 8;
  if (str.includes("رمضان")) return 9;
  if (str.includes("شوال")) return 10;
  if (str.includes("ذو القعدة") || str.includes("ذو القعده")) return 11;
  if (str.includes("ذو الحجة") || str.includes("ذو الحجه")) return 12;
  return 1;
}

export function Events() {
  const [dbEvents, setDbEvents] = useState<EventItem[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<
    "cards" | "list" | "table" | "calendar" | "timeline"
  >("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [syllabuses, setSyllabuses] = useState<any[]>([]);

  // Activities Tab Switcher
  const [activityTab, setActivityTab] = useState<"today" | "upcoming" | "past">("upcoming");

  // Hijri Month State for Occasions Calendar
  const [selectedHijriMonth, setSelectedHijriMonth] = useState<number>(2); // Safar default
  const [selectedHijriYear, setSelectedHijriYear] = useState<number>(1448);
  const [currentRealHijriMonth, setCurrentRealHijriMonth] = useState<number>(2);

  const navigate = useNavigate();

  // Load actual real Hijri month on mount
  useEffect(() => {
    try {
      const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
        month: 'numeric',
        year: 'numeric'
      });
      const parts = formatter.formatToParts(new Date());
      const m = parts.find(p => p.type === 'month')?.value;
      const y = parts.find(p => p.type === 'year')?.value;
      if (m) {
        const realMonth = parseInt(m);
        setCurrentRealHijriMonth(realMonth);
        setSelectedHijriMonth(realMonth);
      }
      if (y) setSelectedHijriYear(parseInt(y));
    } catch (e) {
      console.warn("Hijri month detection failed", e);
    }
  }, []);

  const events = useMemo(() => {
    const dbTitles = new Set(dbEvents.map((e) => e.title));
    const merged = [...dbEvents];
    BASE_EVENTS.forEach((be, i) => {
      if (!dbTitles.has(be.title)) {
        merged.push({ id: `static-${i}`, ...be } as EventItem);
      }
    });
    return merged.sort((a, b) => a.timestamp - b.timestamp);
  }, [dbEvents]);

  useEffect(() => {
    // Load cache
    const cachedActivities = localStorage.getItem("taiz_activities_cache");
    const cachedSyllabuses = localStorage.getItem("taiz_syllabuses_cache");
    const cachedDbEvents = localStorage.getItem("taiz_events_cache");

    let hasCache = false;

    if (cachedActivities) {
      try {
        const parsed = JSON.parse(cachedActivities);
        if (parsed.length > 0) {
          setActivities(parsed);
          hasCache = true;
        }
      } catch (e) {
        console.warn("Error parsing activities cache", e);
      }
    }
    if (cachedSyllabuses) {
      try {
        const parsed = JSON.parse(cachedSyllabuses);
        if (parsed.length > 0) {
          setSyllabuses(parsed);
          hasCache = true;
        }
      } catch (e) {
        console.warn("Error parsing syllabuses cache", e);
      }
    }
    if (cachedDbEvents) {
      try {
        const parsed = JSON.parse(cachedDbEvents);
        if (parsed.length > 0) {
          setDbEvents(parsed);
          hasCache = true;
        }
      } catch (e) {
        console.warn("Error parsing events cache", e);
      }
    }

    if (hasCache) {
      setLoading(false);
    }

    let active = true;
    let activitiesDone = false;
    let syllabusesDone = false;
    let eventsDone = false;

    const checkLoading = () => {
      if (active && activitiesDone && syllabusesDone && eventsDone) {
        setLoading(false);
      }
    };

    const unsubPromise3 = SyncService.syncCollection<any>("activities", (data) => {
      if (!active) return;
      setActivities(data);
      localStorage.setItem("taiz_activities_cache", JSON.stringify(data));
      activitiesDone = true;
      checkLoading();
    });

    const unsubPromise2 = SyncService.syncCollection<any>(
      "quran_syllabuses",
      (data) => {
        if (!active) return;
        setSyllabuses(data);
        localStorage.setItem("taiz_syllabuses_cache", JSON.stringify(data));
        syllabusesDone = true;
        checkLoading();
      }
    );

    const unsubPromise = SyncService.syncCollection<EventItem>(
      "events",
      (data) => {
        if (!active) return;
        setDbEvents(data);
        localStorage.setItem("taiz_events_cache", JSON.stringify(data));
        eventsDone = true;
        checkLoading();
      },
      { orderByField: "timestamp", orderDirection: "asc" }
    );

    return () => {
      active = false;
      unsubPromise.then((unsub) => unsub());
      unsubPromise2.then((unsub) => unsub());
      unsubPromise3.then((unsub) => unsub());
    };
  }, []);

  const handleRefresh = async () => {
    try {
      const freshActivities = await SyncService.refreshCollection<any>("activities");
      setActivities(freshActivities);
      localStorage.setItem("taiz_activities_cache", JSON.stringify(freshActivities));

      const freshSyllabuses = await SyncService.refreshCollection<any>("quran_syllabuses");
      setSyllabuses(freshSyllabuses);
      localStorage.setItem("taiz_syllabuses_cache", JSON.stringify(freshSyllabuses));

      const freshEvents = await SyncService.refreshCollection<EventItem>("events", { orderByField: "timestamp", orderDirection: "asc" });
      setDbEvents(freshEvents);
      localStorage.setItem("taiz_events_cache", JSON.stringify(freshEvents));
    } catch (e) {
      console.error("Error refreshing events data", e);
      throw e;
    }
  };

  const today = startOfDay(new Date());

  // Partitioned Activities
  const partitionedActivities = useMemo(() => {
    const todayActivities: any[] = [];
    const upcomingActivities: any[] = [];
    const pastActivities: any[] = [];

    activities.forEach((act) => {
      if (!act.startDate) return;
      const actDate = startOfDay(new Date(act.startDate));
      if (isSameDay(actDate, today)) {
        todayActivities.push(act);
      } else if (isAfter(actDate, today)) {
        upcomingActivities.push(act);
      } else {
        pastActivities.push(act);
      }
    });

    upcomingActivities.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    pastActivities.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    return { todayActivities, upcomingActivities, pastActivities };
  }, [activities, today]);

  // Event Count Map by Hijri Month (1 to 12)
  const eventsCountByMonth = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let i = 1; i <= 12; i++) counts[i] = 0;
    events.forEach((e) => {
      const idx = getEventHijriMonthIndex(e.hijriDate);
      counts[idx] = (counts[idx] || 0) + 1;
    });
    return counts;
  }, [events]);

  // Filter events strictly for Selected Hijri Month + Search Query + Category
  const monthFilteredEvents = useMemo(() => {
    return events.filter((e) => {
      const monthIdx = getEventHijriMonthIndex(e.hijriDate);
      const matchesMonth = monthIdx === selectedHijriMonth;

      const matchesSearch =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.hijriDate.includes(searchQuery) ||
        e.gregorianDate.includes(searchQuery);

      const matchesCategory =
        selectedCategory === "all" || e.category === selectedCategory;

      return matchesMonth && matchesSearch && matchesCategory;
    });
  }, [events, selectedHijriMonth, searchQuery, selectedCategory]);

  const eventOfTheDay = useMemo(() => {
    return events.find((e) => isSameDay(startOfDay(new Date(e.timestamp)), today));
  }, [events, today]);

  const nearestMonthEvent = useMemo(() => {
    if (monthFilteredEvents.length === 0) return null;
    const upcoming = monthFilteredEvents.filter((e) => isAfter(startOfDay(new Date(e.timestamp)), today) || isSameDay(startOfDay(new Date(e.timestamp)), today));
    if (upcoming.length > 0) return upcoming[0];
    return monthFilteredEvents[0];
  }, [monthFilteredEvents, today]);

  const partitions = useMemo(() => {
    const current: EventItem[] = [];
    const upcoming: EventItem[] = [];
    const past: EventItem[] = [];

    monthFilteredEvents.forEach((e) => {
      const eventDate = startOfDay(new Date(e.timestamp));
      if (isSameDay(eventDate, today)) {
        current.push(e);
      } else if (isAfter(eventDate, today)) {
        upcoming.push(e);
      } else {
        past.push(e);
      }
    });

    upcoming.sort((a, b) => a.timestamp - b.timestamp);
    past.sort((a, b) => b.timestamp - a.timestamp);

    return { current, upcoming, past };
  }, [monthFilteredEvents, today]);

  const getEventStatus = (timestamp: number) => {
    const eventDate = startOfDay(new Date(timestamp));
    if (isSameDay(eventDate, today))
      return {
        label: "اليوم",
        color: "bg-[#015028]",
        text: "text-[#015028] border-emerald-300/60 bg-emerald-50",
      };
    if (isAfter(eventDate, today))
      return {
        label: "قادمة",
        color: "bg-[#10264A]",
        text: "text-[#10264A] border-blue-300/60 bg-blue-50",
      };
    return {
      label: "منتهية",
      color: "bg-slate-400",
      text: "text-slate-600 border-slate-200 bg-slate-50",
    };
  };

  const getRemainingDays = (timestamp: number) => {
    const diff = differenceInDays(startOfDay(new Date(timestamp)), today);
    return diff > 0 ? diff : 0;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 bg-slate-50/50">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-[#015028]/20 border-t-[#015028] animate-spin"></div>
        </div>
        <p className="text-slate-600 text-xs font-bold font-cairo">
          جاري تحميل قسم الأنشطة والمناسبات...
        </p>
      </div>
    );
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const relatedSyllabus = syllabuses.find((s) => s.eventId === selectedEventId);
  const selectedMonthObj = HIJRI_MONTHS.find((m) => m.id === selectedHijriMonth) || HIJRI_MONTHS[1];

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 pb-24 space-y-12 font-ibm" dir="rtl">
        
        {/* ==================== 1. ACTIVITIES SECTION (قسم الأنشطة) ==================== */}
        <section className="space-y-6">
          {/* Section Header */}
          <div className="bg-gradient-to-r from-[#015028]/10 via-[#015028]/5 to-transparent p-5 sm:p-6 rounded-3xl border border-[#015028]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#015028] animate-pulse"></span>
                <span className="text-xs font-black text-[#015028] font-cairo uppercase tracking-wider">أنشطة وفعاليات محافظة تعز</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-cairo">
                الأنشطة والفعاليات
              </h2>
            </div>

            {/* Segmented Tab Controls for Activities */}
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-1 shrink-0 self-start sm:self-center">
              <button
                onClick={() => setActivityTab("today")}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer font-cairo flex items-center gap-1.5 ${
                  activityTab === "today"
                    ? "bg-[#015028] text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>أنشطة اليوم</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activityTab === "today" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {partitionedActivities.todayActivities.length}
                </span>
              </button>

              <button
                onClick={() => setActivityTab("upcoming")}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer font-cairo flex items-center gap-1.5 ${
                  activityTab === "upcoming"
                    ? "bg-[#015028] text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>الأنشطة القادمة</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activityTab === "upcoming" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {partitionedActivities.upcomingActivities.length}
                </span>
              </button>

              <button
                onClick={() => setActivityTab("past")}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer font-cairo flex items-center gap-1.5 ${
                  activityTab === "past"
                    ? "bg-[#015028] text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>الأنشطة السابقة</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activityTab === "past" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {partitionedActivities.pastActivities.length}
                </span>
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activityTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* Today's Activities */}
              {activityTab === "today" && (
                <div>
                  {partitionedActivities.todayActivities.length === 0 ? (
                    <div className="bg-white border border-slate-200/80 shadow-xs p-8 text-center flex flex-col items-center justify-center rounded-3xl min-h-[180px]">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#015028] flex items-center justify-center mb-3 border border-emerald-100">
                        <CalendarIcon className="w-6 h-6" />
                      </div>
                      <p className="text-slate-700 font-extrabold text-sm font-cairo">
                        لا توجد فعاليات لهذه اليوم
                      </p>
                      <p className="text-slate-400 text-xs font-bold mt-1">
                        يمكنك الاطلاع على الأنشطة القادمة من التبويب المبتكر أعلاه
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      {partitionedActivities.todayActivities.map((act) => (
                        <ModernEventCard
                          key={act.id}
                          activity={act}
                          statusOverride="حالية"
                          onClick={() => navigate(`/events/activity/${act.id}`)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Upcoming Activities */}
              {activityTab === "upcoming" && (
                <div>
                  {partitionedActivities.upcomingActivities.length === 0 ? (
                    <div className="bg-white border border-slate-200/80 shadow-xs p-8 text-center flex flex-col items-center justify-center rounded-3xl min-h-[180px]">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
                        <CalendarDays className="w-6 h-6" />
                      </div>
                      <p className="text-slate-700 font-extrabold text-sm font-cairo">
                        لا توجد أنشطة قادمة حالياً
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      {partitionedActivities.upcomingActivities.map((act) => (
                        <ModernEventCard
                          key={act.id}
                          activity={act}
                          statusOverride="قادمة"
                          onClick={() => navigate(`/events/activity/${act.id}`)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Past Activities */}
              {activityTab === "past" && (
                <div>
                  {partitionedActivities.pastActivities.length === 0 ? (
                    <div className="bg-white border border-slate-200/80 shadow-xs p-8 text-center flex flex-col items-center justify-center rounded-3xl min-h-[180px]">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3 border border-slate-200">
                        <HistoryIcon className="w-6 h-6" />
                      </div>
                      <p className="text-slate-700 font-extrabold text-sm font-cairo">
                        لا توجد أنشطة سابقة مدونة في الأرشيف
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      {partitionedActivities.pastActivities.map((act) => (
                        <ModernEventCard
                          key={act.id}
                          activity={act}
                          statusOverride="سابقة"
                          onClick={() => navigate(`/events/activity/${act.id}`)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* ==================== 2. CALENDAR / OCCASIONS SECTION (قسم التاريخ الهجري) ==================== */}
        <section className="space-y-6 pt-8 border-t border-slate-200/80">
          <HijriCalendarWidget onSelectEvent={(id) => setSelectedEventId(id)} />
        </section>

        {/* Event Details Modal */}
        <EventDetailsModal
          event={selectedEvent}
          events={events}
          onClose={() => setSelectedEventId(null)}
          relatedSyllabus={relatedSyllabus}
          onNavigateToSyllabus={() => {
            if (relatedSyllabus) {
              navigate(`/syllabus/${relatedSyllabus.id}`);
              setSelectedEventId(null);
            }
          }}
        />
      </div>
    </PullToRefresh>
  );
}

function EventCard({
  event,
  status,
  remaining,
  onView,
}: {
  event: EventItem;
  status: any;
  remaining: number;
  onView: () => void;
}) {
  return (
    <motion.div
      onClick={onView}
      whileHover={{ y: -4, scale: 1.01 }}
      className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
    >
      <div className={`absolute top-0 right-0 w-1.5 h-full ${status.color}`}></div>

      <div className="text-right">
        <div className="flex justify-between items-start mb-3">
          <div className="bg-[#FEF9E6] border border-[#E5A921]/40 px-3 py-1 rounded-xl font-black text-[#8C6200] text-xs font-cairo">
            {event.hijriDate}
          </div>
          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border font-cairo ${status.text}`}>
            {status.label}
          </span>
        </div>

        <h3 className="text-base font-black text-slate-900 leading-snug mb-2 group-hover:text-[#015028] transition-colors font-cairo">
          {event.title}
        </h3>

        <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed mb-4 font-medium">
          {event.description || "استعرض التفاصيل لمعرفة الأبعاد التوعوية والثقافية للحدث."}
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
        <span className="text-xs font-black text-[#015028] group-hover:underline flex items-center gap-1 font-cairo">
          التفاصيل كاملة <ChevronLeft className="w-3.5 h-3.5" />
        </span>
        {remaining > 0 && (
          <span className="text-[10px] font-black text-[#10264A] flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
            <Timer className="w-3.5 h-3.5" />
            متبقي {remaining} يوم
          </span>
        )}
      </div>
    </motion.div>
  );
}

function TimelineItem({
  event,
  idx,
  status,
  onView,
}: {
  event: EventItem;
  idx: number;
  status: any;
  onView: () => void;
}) {
  const isEven = idx % 2 === 0;
  return (
    <div className={`relative flex items-center gap-6 ${isEven ? "flex-row" : "flex-row-reverse"}`}>
      <div className={`absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white z-10 shadow-sm ${status.color}`}></div>

      <div className={`w-1/2 ${isEven ? "text-left pl-2" : "text-right pr-2"}`}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={onView}
          className="inline-block bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs cursor-pointer hover:shadow-md transition-all text-right"
        >
          <div className="bg-emerald-50 text-[#015028] text-[10px] font-black px-2.5 py-0.5 rounded-md inline-block mb-1.5 font-cairo">
            {event.hijriDate}
          </div>
          <h4 className="text-xs sm:text-sm font-black text-slate-900 mb-1 leading-tight font-cairo">
            {event.title}
          </h4>
          <div className="text-[10px] text-slate-500 font-bold">
            {event.gregorianDate}
          </div>
        </motion.div>
      </div>

      <div className={`w-1/2 text-center ${isEven ? "text-right pr-2" : "text-left pl-2"}`}>
        <div className="text-lg font-black text-slate-300 font-cairo">
          #{idx + 1}
        </div>
      </div>
    </div>
  );
}

function NoResultsFound({ monthName, className = "" }: { monthName?: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center p-6 w-full ${className}`}>
      <Search className="w-10 h-10 text-slate-300 mb-3" />
      <div className="text-sm font-black text-slate-800 font-cairo">
        لا توجد نتائج مطابقة في {monthName ? `شهر ${monthName}` : "هذا القسم"}
      </div>
      <p className="text-slate-500 text-xs mt-1 font-bold max-w-sm">
        يمكنك تصفح بقية الأشهر من خلال التنقل بين أسماء الأشهر الهجرية أعلاه
      </p>
    </div>
  );
}

function EventDetailsModal({
  event,
  events,
  onClose,
  relatedSyllabus,
  onNavigateToSyllabus,
}: {
  event: EventItem | undefined;
  events: EventItem[];
  onClose: () => void;
  relatedSyllabus?: any;
  onNavigateToSyllabus: () => void;
}) {
  if (!event) return null;

  const today = startOfDay(new Date());
  const diff = differenceInDays(startOfDay(new Date(event.timestamp)), today);
  const statusLabel = diff === 0 ? "يحدث اليوم" : diff > 0 ? "مناسبة قادمة" : "مناسبة منتهية";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in" dir="rtl">
      <button onClick={onClose} className="absolute inset-0 cursor-default bg-transparent w-full h-full border-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 max-h-[90vh]"
      >
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-emerald-50 text-[#015028] border border-emerald-200 font-cairo">
              {statusLabel}
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight mt-1 font-cairo">
              {event.title}
            </h2>
            <p className="text-xs text-slate-500 font-bold">
              {event.gregorianDate} - {event.dayName || ""}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-xl transition cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grow overflow-y-auto py-5 space-y-4 text-right">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
            {event.description || "معلومات تفصيلية تنشر قريباً لتغطية هذه المناسبة الإسلامية والوطنية الهامة."}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#FEF9E6] border border-[#E5A921]/30 p-3.5 rounded-2xl">
              <span className="text-[10px] font-black text-[#8C6200] block mb-0.5 font-cairo">
                التاريخ الهجري
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-900">
                {event.hijriDate}
              </span>
            </div>
            <div className="bg-blue-50 border border-blue-200/60 p-3.5 rounded-2xl">
              <span className="text-[10px] font-black text-blue-800 block mb-0.5 font-cairo">
                المسافة الزمنية
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-900">
                {diff > 0 ? `متبقي ${diff} يوم` : diff === 0 ? "يصادف اليوم" : "منتهية"}
              </span>
            </div>
          </div>

          {relatedSyllabus && (
            <div
              onClick={onNavigateToSyllabus}
              className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 cursor-pointer hover:bg-emerald-100/80 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#015028] text-white rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-emerald-950 font-cairo">
                    المقرر الحالي للمناسبة
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5 font-bold">
                    انقر هنا للانتقال إلى دروس هدي القرآن
                  </div>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-emerald-600" />
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-[#015028] hover:bg-[#083b20] text-white py-3 rounded-2xl text-xs sm:text-sm font-black shadow-md transition duration-200 cursor-pointer text-center font-cairo"
          >
            إغلاق
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${event.title} - ${event.hijriDate}`);
              alert("تم نسخ تفاصيل المناسبة بنجاح!");
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer font-cairo"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
