import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { SyncService } from "../services/SyncService";
import { EventItem } from "../types";
import {
  format,
  differenceInDays,
  isSameDay,
  isAfter,
  startOfDay,
  addDays,
  isBefore,
} from "date-fns";
import { ar } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  List,
  LayoutGrid,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  CalendarDays,
  Timer,
  ExternalLink,
  SlidersHorizontal,
  MapPin,
  Share2,
  BookOpen,
  History as HistoryIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { BASE_EVENTS } from "../data/staticEvents";
import { ModernEventCard } from "../components/ModernEventCard";
import { PullToRefresh } from "../components/PullToRefresh";

export function Events() {
  const [dbEvents, setDbEvents] = useState<EventItem[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isPastActivitiesOpen, setIsPastActivitiesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<
    "cards" | "list" | "table" | "calendar" | "timeline"
  >("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [syllabuses, setSyllabuses] = useState<any[]>([]);
  const [isPastEventsOpen, setIsPastEventsOpen] = useState(false);
  const [isUpcomingEventsOpen, setIsUpcomingEventsOpen] = useState(false);
  const navigate = useNavigate();

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
    // Load from cache first
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

    // Sort upcoming ascending (nearest first)
    upcomingActivities.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    // Sort past descending (most recent first)
    pastActivities.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    return { todayActivities, upcomingActivities, pastActivities };
  }, [activities, today]);

  const eventOfTheDay = useMemo(() => {
    return events.find((e) =>
      isSameDay(startOfDay(new Date(e.timestamp)), today)
    );
  }, [events, today]);

  const upcomingEvents = useMemo(() => {
    return events
      .filter((e) => isAfter(startOfDay(new Date(e.timestamp)), today))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [events, today]);

  const nearestUpcoming = upcomingEvents[0];

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.hijriDate.includes(searchQuery) ||
        e.gregorianDate.includes(searchQuery);
      const matchesCategory =
        selectedCategory === "all" || e.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [events, searchQuery, selectedCategory]);

  const partitions = useMemo(() => {
    const current: EventItem[] = [];
    const upcoming: EventItem[] = [];
    const past: EventItem[] = [];

    filteredEvents.forEach((e) => {
      const eventDate = startOfDay(new Date(e.timestamp));
      if (isSameDay(eventDate, today)) {
        current.push(e);
      } else if (isAfter(eventDate, today)) {
        upcoming.push(e);
      } else {
        past.push(e);
      }
    });

    // Sort upcoming ascending (nearest first)
    upcoming.sort((a, b) => a.timestamp - b.timestamp);
    // Sort past descending (most recent first)
    past.sort((a, b) => b.timestamp - a.timestamp);

    return { current, upcoming, past };
  }, [filteredEvents, today]);

  const getEventStatus = (timestamp: number) => {
    const eventDate = startOfDay(new Date(timestamp));
    if (isSameDay(eventDate, today))
      return {
        label: "اليوم",
        color: "bg-taiz-sky",
        text: "text-taiz-sky border-taiz-sky/20 bg-taiz-sky/5",
      };
    if (isAfter(eventDate, today))
      return {
        label: "قادمة",
        color: "bg-taiz-royal",
        text: "text-taiz-royal border-taiz-royal/20 bg-taiz-royal/5",
      };
    return {
      label: "منتهية",
      color: "bg-taiz-soft",
      text: "text-taiz-soft border-taiz-soft/20 bg-taiz-soft/5",
    };
  };

  const getRemainingDays = (timestamp: number) => {
    const diff = differenceInDays(startOfDay(new Date(timestamp)), today);
    return diff > 0 ? diff : 0;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 bg-surface-main">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-taiz-navy/10 border-t-taiz-royal animate-spin"></div>
        </div>
        <p className="text-text-secondary text-xs font-bold">
          جاري تحميل تقويم المناسبات...
        </p>
      </div>
    );
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const relatedSyllabus = syllabuses.find((s) => s.eventId === selectedEventId);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="max-w-7xl mx-auto w-full p-4 pb-20 space-y-12 font-ibm" dir="rtl">
        
        {/* ==================== 1. ACTIVITIES SECTION ==================== */}
        <section className="space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-900 font-ibm">
              الأنشطة
            </h2>
            <p className="text-xs font-bold text-gray-500 mt-1">
              متابعة الأنشطة اليومية والمقبلة والسابقة بالمنصة
            </p>
          </div>

          {/* Today's Activities */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-[#0a8f5c] flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#0a8f5c] rounded-full animate-pulse"></span>
              <span>أنشطة اليوم</span>
            </h3>
            {partitionedActivities.todayActivities.length === 0 ? (
              <div className="bg-white border border-gray-100 shadow-sm p-8 text-center flex flex-col items-center justify-center rounded-[2rem] min-h-[160px]">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-3">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <p className="text-gray-500 font-bold text-sm">
                  لا توجد فعاليات لهذا اليوم
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 w-full max-w-3xl mx-auto">
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

          {/* Upcoming Activities */}
          {partitionedActivities.upcomingActivities.length > 0 && (
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-black text-taiz-royal flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-taiz-royal rounded-full"></span>
                <span>الأنشطة القادمة</span>
              </h3>
              <div className="grid grid-cols-1 gap-8 w-full max-w-3xl mx-auto">
                {partitionedActivities.upcomingActivities.map((act) => (
                  <ModernEventCard
                    key={act.id}
                    activity={act}
                    statusOverride="قادمة"
                    onClick={() => navigate(`/events/activity/${act.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Activities (Collapsible) */}
          {partitionedActivities.pastActivities.length > 0 && (
            <div className="border-t border-gray-100 pt-6">
              <button
                type="button"
                onClick={() => setIsPastActivitiesOpen(!isPastActivitiesOpen)}
                className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 p-4 rounded-xl text-gray-700 font-bold text-sm transition-all cursor-pointer select-none"
              >
                  <span className="flex items-center gap-2">
                    <HistoryIcon className="w-4 h-4 text-gray-500" />
                    <span>الأنشطة السابقة ({partitionedActivities.pastActivities.length})</span>
                  </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isPastActivitiesOpen ? "rotate-180" : ""}`} />
              </button>
              {isPastActivitiesOpen && (
                <div className="grid grid-cols-1 gap-8 mt-6 w-full max-w-3xl mx-auto animate-in fade-in duration-200">
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
        </section>

        {/* ==================== 2. CALENDAR / OCCASIONS SECTION ==================== */}
        <section className="space-y-6 pt-8 border-t border-gray-100">
          <div className="pb-4">
            <h2 className="text-xl font-bold text-gray-900 font-ibm">
              تقويم المناسبات
            </h2>
          </div>
      {/* Modern Bento Highlights Banner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bento Cell 1: Event of the Day Card */}
        <div className="lg:col-span-7 relative overflow-hidden bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-border-light flex flex-col justify-between min-h-[220px] group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-red-50 rounded-full blur-3xl pointer-events-none -mt-10 -mr-10"></div>

          <div className="relative z-10 w-full flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                مناسبة اليوم
              </div>
              <div className="text-slate-400 font-bold text-[10px] flex items-center gap-1.5">
                <span>{format(today, "EEEE, d MMMM yyyy", { locale: ar })}</span>
                <span className="opacity-40">|</span>
                <span>{new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(today)} هـ</span>
              </div>
            </div>

            {eventOfTheDay ? (
              <div className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-black leading-tight text-slate-900 group-hover:text-red-600 transition-colors duration-300">
                  {eventOfTheDay.title}
                </h2>
                <div className="flex flex-wrap gap-3 text-slate-500 font-bold text-[10px]">
                  <span className="bg-slate-50 px-2 py-1 rounded-md flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-red-600" />
                    {eventOfTheDay.hijriDate}
                  </span>
                  <span className="bg-slate-50 px-2 py-1 rounded-md flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-red-600" />
                    {eventOfTheDay.gregorianDate}
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed max-w-xl line-clamp-2 font-bold mt-2">
                  {eventOfTheDay.description || "لا يوجد وصف مدون حالياً لهذه المناسبة الإسلامية الكريمة."}
                </p>
                <div className="pt-4 flex justify-end">
                   <button
                    onClick={() => setSelectedEventId(eventOfTheDay.id)}
                    className="bg-red-600 text-white hover:bg-red-700 px-6 py-2.5 rounded-xl font-black text-xs transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    عرض التفاصيل <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center w-full">
                <div className="text-base font-black text-slate-400 flex items-center justify-center gap-2 mb-2">
                  <Info className="w-5 h-5" /> لا توجد مناسبات مسجلة لهذا اليوم
                </div>
                <p className="text-slate-400 text-[10px] font-bold">
                  تصفح التقويم وأقرب المناسبات من اللوحة المجاورة
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bento Cell 2: Nearest Upcoming Card */}
        <div className="lg:col-span-5 relative overflow-hidden bg-white rounded-3xl p-6 sm:p-8 border border-border-light shadow-sm flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50/30 rounded-full blur-2xl pointer-events-none" />

          {nearestUpcoming ? (
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="bg-slate-50 border border-slate-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-2">
                    المناسبة القادمة الأقرب
                  </div>
                  <div className="text-red-600 font-black text-xs flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 animate-spin-slow" />
                    متبقي {getRemainingDays(nearestUpcoming.timestamp)} يوم
                  </div>
                </div>

                <h2 className="text-xl font-black text-slate-900 leading-tight group-hover:text-red-600 transition-colors duration-300">
                  {nearestUpcoming.title}
                </h2>

                <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed font-bold">
                  {nearestUpcoming.description || "معلومات تفصيلية تنشر قريباً، تفيد السيرة النبوية والمناسبات الإسلامية العظيمة."}
                </p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-6">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400">
                    التاريخ المجدول
                  </span>
                  <span className="text-xs font-black text-slate-700">
                    {nearestUpcoming.hijriDate}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedEventId(nearestUpcoming.id)}
                  className="text-white bg-slate-900 hover:bg-red-600 text-xs font-black px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  استعراض
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-300 py-10 opacity-60">
              <CalendarDays className="w-12 h-12 mb-2" />
              <div className="font-black text-sm">
                لا توجد مناسبات قادمة مجدولة
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Control and Filter Center */}
      <div className="bg-surface-card p-4 rounded-2xl border border-border-light shadow-sm flex flex-col lg:flex-row items-center gap-4">
        {/* Modern Unified Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="ابحث باسم المناسبة، التاريخ الهجري أو الميلادي..."
            className="w-full bg-surface-main border border-transparent focus:border-taiz-sky/30 focus:bg-surface-card text-text-primary rounded-xl pr-12 pl-4 py-3 text-sm font-bold transition-all focus:outline-none placeholder:text-text-muted"
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
            { id: "historical", label: "تاريخية ومناسبات" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-taiz-royal text-white shadow-md"
                  : "bg-gray-50 text-taiz-soft hover:bg-gray-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Multi-view Interactive Switcher */}
        <div className="bg-gray-50 p-1 rounded-xl flex items-center gap-1 shrink-0 w-full lg:w-auto justify-center">
          {[
            { id: "list", icon: List, label: "قائمة" },
            { id: "table", icon: SlidersHorizontal, label: "جدولي" },
            { id: "calendar", icon: CalendarDays, label: "تقويم" },
            { id: "timeline", icon: Clock, label: "زمني" },
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as any)}
              className={`p-2 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-black ${
                activeView === view.id
                  ? "bg-white text-taiz-royal shadow-sm border border-gray-100"
                  : "text-taiz-soft hover:text-taiz-navy"
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
            <div className="space-y-8">
              {/* 2. Collapsible Upcoming Events Section */}
              <div className="space-y-3">
                <button
                  onClick={() => setIsUpcomingEventsOpen(!isUpcomingEventsOpen)}
                  className="w-full flex items-center justify-between p-4 bg-surface-card hover:bg-surface-hover rounded-2xl border border-border-light shadow-sm transition-all text-right cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-taiz-royal/10 text-taiz-royal flex items-center justify-center">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-text-primary">
                        المناسبات القادمة ({partitions.upcoming.length})
                      </h3>
                      <p className="text-[10px] text-text-secondary font-bold">
                        تصفح واستعرض المناسبات القادمة
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-taiz-royal bg-taiz-royal/5 px-2.5 py-1 rounded-lg">
                      {isUpcomingEventsOpen ? "إغلاق" : "عرض"}
                    </span>
                    {isUpcomingEventsOpen ? (
                      <ChevronUp className="w-5 h-5 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-text-muted" />
                    )}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isUpcomingEventsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {partitions.upcoming.map((event) => (
                          <SmallEventCard
                            key={event.id}
                            event={event}
                            status={getEventStatus(event.timestamp)}
                            remaining={getRemainingDays(event.timestamp)}
                            onView={() => setSelectedEventId(event.id)}
                          />
                        ))}
                        {partitions.upcoming.length === 0 && (
                          <div className="col-span-full py-10 text-center text-text-muted text-xs font-bold bg-surface-main rounded-xl border border-dashed border-border-light">
                            لا توجد مناسبات قادمة مطابقة لبحثك.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Collapsible Past Events Section */}
              <div className="space-y-3">
                <button
                  onClick={() => setIsPastEventsOpen(!isPastEventsOpen)}
                  className="w-full flex items-center justify-between p-4 bg-surface-card hover:bg-surface-hover rounded-2xl border border-border-light shadow-sm transition-all text-right cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-taiz-soft/10 text-taiz-soft flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-text-primary">
                        المناسبات المنتهية والمطوية ({partitions.past.length})
                      </h3>
                      <p className="text-[10px] text-text-secondary font-bold">
                        الأرشيف التاريخي للمناسبات والذكريات المنصرمة
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-text-muted bg-surface-main px-2.5 py-1 rounded-lg">
                      {isPastEventsOpen ? "إغلاق" : "عرض"}
                    </span>
                    {isPastEventsOpen ? (
                      <ChevronUp className="w-5 h-5 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-text-muted" />
                    )}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isPastEventsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {partitions.past.map((event) => (
                          <SmallEventCard
                            key={event.id}
                            event={event}
                            status={getEventStatus(event.timestamp)}
                            remaining={getRemainingDays(event.timestamp)}
                            onView={() => setSelectedEventId(event.id)}
                          />
                        ))}
                        {partitions.past.length === 0 && (
                          <div className="col-span-full py-10 text-center text-text-muted text-xs font-bold bg-surface-main rounded-xl border border-dashed border-border-light">
                            لا توجد مناسبات منتهية مطابقة لبحثك.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {filteredEvents.length === 0 && <NoResultsFound />}
            </div>
          )}

          {/* Compact List View */}
          {activeView === "list" && (
            <div className="space-y-8 max-w-4xl mx-auto">
              {/* 2. Collapsible Upcoming Events Section */}
              <div className="space-y-3">
                <button
                  onClick={() => setIsUpcomingEventsOpen(!isUpcomingEventsOpen)}
                  className="w-full flex items-center justify-between p-4 bg-surface-card hover:bg-surface-hover rounded-2xl border border-border-light shadow-sm transition-all text-right cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-taiz-royal/10 text-taiz-royal flex items-center justify-center">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-text-primary">
                        المناسبات القادمة ({partitions.upcoming.length})
                      </h3>
                      <p className="text-[10px] text-text-secondary font-bold">
                        تصفح واستعرض المناسبات القادمة
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-taiz-royal bg-taiz-royal/5 px-2.5 py-1 rounded-lg">
                      {isUpcomingEventsOpen ? "إغلاق" : "عرض"}
                    </span>
                    {isUpcomingEventsOpen ? (
                      <ChevronUp className="w-5 h-5 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-text-muted" />
                    )}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isUpcomingEventsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 space-y-3">
                        {partitions.upcoming.map((event) => {
                          const status = getEventStatus(event.timestamp);
                          return (
                            <motion.div
                              key={event.id}
                              onClick={() => setSelectedEventId(event.id)}
                              whileHover={{ x: -4 }}
                              className="bg-surface-card p-4 rounded-2xl border border-border-light shadow-sm flex items-center gap-4 cursor-pointer hover:border-taiz-sky/30 transition-all group"
                            >
                              <div className="w-14 h-14 rounded-2xl bg-surface-main border border-border-light flex flex-col items-center justify-center shrink-0">
                                <span className="text-xs font-black text-taiz-royal">
                                  {format(new Date(event.timestamp), "d")}
                                </span>
                                <span className="text-[8px] font-black text-text-muted uppercase">
                                  {format(new Date(event.timestamp), "MMMM", {
                                    locale: ar,
                                  })}
                                </span>
                              </div>
                              <div className="flex-1 text-right min-w-0">
                                <h4 className="text-sm sm:text-base font-black text-text-primary group-hover:text-taiz-royal transition-colors truncate">
                                  {event.title}
                                </h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[10px] font-black text-taiz-sky flex items-center gap-1">
                                    <CalendarIcon className="w-3 h-3" /> {event.hijriDate}
                                  </span>
                                  <span className="text-[10px] font-black text-text-muted flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {event.gregorianDate}
                                  </span>
                                </div>
                              </div>
                              <div className="shrink-0 flex items-center gap-2">
                                <span
                                  className={`text-[9px] font-black px-2 py-0.5 rounded-lg border hidden sm:inline-block ${status.text}`}
                                >
                                  {status.label}
                                </span>
                                <ChevronLeft className="w-5 h-5 text-text-muted group-hover:text-red-600 group-hover:-translate-x-1 transition-all" />
                              </div>
                            </motion.div>
                          );
                        })}
                        {partitions.upcoming.length === 0 && (
                          <div className="py-10 text-center text-text-muted text-xs font-bold bg-surface-main rounded-xl border border-dashed border-border-light">
                            لا توجد مناسبات قادمة مطابقة لبحثك.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Collapsible Past Events Section */}
              <div className="space-y-3">
                <button
                  onClick={() => setIsPastEventsOpen(!isPastEventsOpen)}
                  className="w-full flex items-center justify-between p-4 bg-surface-card hover:bg-surface-hover rounded-2xl border border-border-light shadow-sm transition-all text-right cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-taiz-soft/10 text-taiz-soft flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-text-primary">
                        المناسبات المنتهية والمطوية ({partitions.past.length})
                      </h3>
                      <p className="text-[10px] text-text-secondary font-bold">
                        الأرشيف التاريخي للمناسبات والذكريات المنصرمة
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-text-muted bg-surface-main px-2.5 py-1 rounded-lg">
                      {isPastEventsOpen ? "إغلاق" : "عرض"}
                    </span>
                    {isPastEventsOpen ? (
                      <ChevronUp className="w-5 h-5 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-text-muted" />
                    )}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isPastEventsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 space-y-3">
                        {partitions.past.map((event) => {
                          const status = getEventStatus(event.timestamp);
                          return (
                            <motion.div
                              key={event.id}
                              onClick={() => setSelectedEventId(event.id)}
                              whileHover={{ x: -4 }}
                              className="bg-surface-card p-4 rounded-2xl border border-border-light shadow-sm flex items-center gap-4 cursor-pointer hover:border-taiz-sky/30 transition-all group"
                            >
                              <div className="w-14 h-14 rounded-2xl bg-surface-main border border-border-light flex flex-col items-center justify-center shrink-0">
                                <span className="text-xs font-black text-taiz-royal">
                                  {format(new Date(event.timestamp), "d")}
                                </span>
                                <span className="text-[8px] font-black text-text-muted uppercase">
                                  {format(new Date(event.timestamp), "MMMM", {
                                    locale: ar,
                                  })}
                                </span>
                              </div>
                              <div className="flex-1 text-right min-w-0">
                                <h4 className="text-sm sm:text-base font-black text-text-primary group-hover:text-taiz-royal transition-colors truncate">
                                  {event.title}
                                </h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[10px] font-black text-taiz-sky flex items-center gap-1">
                                    <CalendarIcon className="w-3 h-3" /> {event.hijriDate}
                                  </span>
                                  <span className="text-[10px] font-black text-text-muted flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {event.gregorianDate}
                                  </span>
                                </div>
                              </div>
                              <div className="shrink-0 flex items-center gap-2">
                                <span
                                  className={`text-[9px] font-black px-2 py-0.5 rounded-lg border hidden sm:inline-block ${status.text}`}
                                >
                                  {status.label}
                                </span>
                                <ChevronLeft className="w-5 h-5 text-text-muted group-hover:text-red-600 group-hover:-translate-x-1 transition-all" />
                              </div>
                            </motion.div>
                          );
                        })}
                        {partitions.past.length === 0 && (
                          <div className="py-10 text-center text-text-muted text-xs font-bold bg-surface-main rounded-xl border border-dashed border-border-light">
                            لا توجد مناسبات منتهية مطابقة لبحثك.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {filteredEvents.length === 0 && <NoResultsFound />}
            </div>
          )}

          {/* Table Layout View */}
          {activeView === "table" && (
            <div className="bg-surface-card rounded-[1.5rem] border border-border-light shadow-sm overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-surface-hover text-text-muted font-black text-xs border-b border-border-light">
                    <th className="p-4.5">#</th>
                    <th className="p-4.5">المناسبة</th>
                    <th className="p-4.5">التاريخ الهجري</th>
                    <th className="p-4.5">التاريخ الميلادي</th>
                    <th className="p-4.5">الحالة متبقي</th>
                    <th className="p-4.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {filteredEvents.map((event, idx) => {
                    const status = getEventStatus(event.timestamp);
                    const rem = getRemainingDays(event.timestamp);
                    return (
                      <tr
                        key={event.id}
                        className="hover:bg-surface-hover transition-colors border-border-light"
                      >
                        <td className="p-4.5 text-xs font-black text-text-muted">
                          {idx + 1}
                        </td>
                        <td className="p-4.5">
                          <div className="font-black text-text-primary text-sm">
                            {event.title}
                          </div>
                          <div className="text-[10px] text-text-secondary font-black mt-0.5">
                            {event.dayName}
                          </div>
                        </td>
                        <td className="p-4.5 text-xs font-black text-taiz-royal">
                          {event.hijriDate}
                        </td>
                        <td className="p-4.5 text-xs font-bold text-text-secondary">
                          {event.gregorianDate}
                        </td>
                        <td className="p-4.5">
                          <span
                            className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${status.text}`}
                          >
                            {rem === 0 ? "اليوم" : `متبقي ${rem} يوم`}
                          </span>
                        </td>
                        <td className="p-4.5 text-center">
                          <button
                            onClick={() => setSelectedEventId(event.id)}
                            className="text-text-muted hover:text-taiz-royal hover:bg-taiz-sky/5 p-2 rounded-lg transition-colors inline-block cursor-pointer"
                          >
                            <Info className="w-4.5 h-4.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredEvents.length === 0 && (
                <NoResultsFound className="py-20" />
              )}
            </div>
          )}

          {/* Calendar Layout View */}
          {activeView === "calendar" && (
            <div className="flex flex-col items-center">
              <div className="w-full max-w-4xl bg-surface-card rounded-[2rem] border border-border-light shadow-sm p-4 sm:p-8">
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
                        border-bottom: 1px solid var(--color-border-light, #f3f4f6);
                        padding-bottom: 1rem;
                      }
                      .react-calendar__navigation button {
                        font-weight: 800;
                        color: var(--color-taiz-royal, #10264A);
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
                        background-color: var(--color-surface-hover, #f0f7ff);
                        color: var(--color-taiz-navy, #07152b);
                      }
                      .react-calendar__month-view__weekdays {
                         font-weight: 800;
                         text-transform: none;
                         color: var(--color-taiz-sky, #90bad6);
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
                         color: var(--color-text-primary, #07152b);
                         background: none;
                         border: none;
                         cursor: pointer;
                         transition: all 0.2s;
                         position: relative;
                      }
                      .react-calendar__tile:enabled:hover {
                         background-color: var(--color-surface-hover, #f8fafc);
                         color: var(--color-taiz-royal, #34619b);
                      }
                      .react-calendar__tile--now {
                         background: var(--color-surface-hover, #f0f7ff) !important;
                         color: var(--color-taiz-navy, #10264A) !important;
                         border: 1px solid var(--color-taiz-sky, #90bad6) !important;
                      }
                      .react-calendar__tile--active {
                         background: var(--color-taiz-royal, #10264A) !important;
                         color: white !important;
                      }
                      .event-tile {
                         color: var(--color-taiz-royal, #34619b) !important;
                         font-weight: 900 !important;
                      }
                      .event-dot {
                         width: 5px;
                         height: 5px;
                         background-color: var(--color-taiz-navy, #10264A);
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
                    const hasEvent = events.some((e) =>
                      isSameDay(new Date(e.timestamp), date)
                    );
                    return hasEvent ? "event-tile" : "";
                  }}
                  tileContent={({ date }) => {
                    const hasEvent = events.some((e) =>
                      isSameDay(new Date(e.timestamp), date)
                    );
                    return hasEvent ? (
                      <div className="event-dot bg-taiz-royal"></div>
                    ) : null;
                  }}
                  onClickDay={(date) => {
                    const event = events.find((e) =>
                      isSameDay(new Date(e.timestamp), date)
                    );
                    if (event) setSelectedEventId(event.id);
                  }}
                />
              </div>

              {/* Quick upcoming list beneath calendar */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                {events
                  .filter(
                    (e) =>
                      isAfter(new Date(e.timestamp), today) ||
                      isSameDay(new Date(e.timestamp), today)
                  )
                  .slice(0, 4)
                  .map((e) => (
                    <div
                      key={e.id}
                      onClick={() => setSelectedEventId(e.id)}
                      className="flex items-center gap-4 bg-surface-card p-4.5 rounded-2xl border border-border-light shadow-sm cursor-pointer hover:border-taiz-sky/30 transition-all select-none"
                    >
                      <div className="w-12 h-12 rounded-xl bg-surface-main border border-border-light flex items-center justify-center font-black text-taiz-royal text-sm">
                        {format(new Date(e.timestamp), "d")}
                      </div>
                      <div className="flex-1 text-right">
                        <h4 className="text-sm font-black text-text-primary truncate">
                          {e.title}
                        </h4>
                        <p className="text-[10px] font-black text-text-secondary">
                          {e.hijriDate} • {e.gregorianDate}
                        </p>
                      </div>
                      <ChevronLeft className="w-4.5 h-4.5 text-text-muted" />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Timeline Layout View */}
          {activeView === "timeline" && (
            <div className="relative py-12 max-w-2xl mx-auto px-4 overflow-hidden">
              {/* Luxury Central Line Indicator */}
              <div className="absolute top-0 right-1/2 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-taiz-navy via-taiz-royal to-gray-100"></div>

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
    </section>

    {/* Event Details Modal */}
    <EventDetailsModal
      event={selectedEvent}
      events={events}
      onClose={() => setSelectedEventId(null)}
      onNavigateToSyllabus={() => {}}
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
  key?: any;
}) {
  return (
    <motion.div
      onClick={onView}
      whileHover={{ y: -4, scale: 1.01 }}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
    >
      {/* Highlight Bar */}
      <div
        className={`absolute top-0 right-0 w-1.5 h-full ${status.color}`}
      ></div>

      <div className="text-right">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-xl font-black text-taiz-royal text-xs">
            {event.hijriDate.split(" ")[0]} {event.hijriDate.split(" ")[1]}
          </div>
          <span
            className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border ${status.text}`}
          >
            {status.label}
          </span>
        </div>

        <h3 className="text-sm sm:text-base font-black text-taiz-navy leading-tight mb-2 group-hover:text-taiz-royal transition-colors">
          {event.title}
        </h3>

        <p className="text-taiz-soft text-xs line-clamp-2 leading-relaxed mb-4 font-bold">
          {event.description ||
            "استعرض التفاصيل لمعرفة الأهمية الكبرى والأبعاد الدينية والتوعوية للحدث."}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
        <span className="text-[10px] sm:text-xs font-black text-taiz-royal group-hover:underline flex items-center gap-1">
          عرض التفاصيل <ChevronLeft className="w-3.5 h-3.5" />
        </span>
        {remaining > 0 && (
          <span className="text-[10px] font-black text-taiz-sky flex items-center gap-1 bg-taiz-sky/5 px-2 py-0.5 rounded-lg">
            <Timer className="w-3.5 h-3.5" />
            متبقي {remaining} يوم
          </span>
        )}
      </div>
    </motion.div>
  );
}

function SmallEventCard({
  event,
  status,
  remaining,
  onView,
}: {
  event: EventItem;
  status: any;
  remaining: number;
  onView: () => void;
  key?: any;
}) {
  return (
    <motion.div
      onClick={onView}
      whileHover={{ y: -2, scale: 1.01 }}
      className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
    >
      <div
        className={`absolute top-0 right-0 w-1 h-full ${status.color}`}
      ></div>

      <div className="text-right">
        <div className="flex justify-between items-center mb-2">
          <span className="bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg font-black text-taiz-royal text-[10px]">
            {event.hijriDate}
          </span>
          <span
            className={`text-[8px] font-black px-2 py-0.5 rounded-md border ${status.text}`}
          >
            {status.label}
          </span>
        </div>

        <h3 className="text-xs sm:text-sm font-black text-taiz-navy leading-snug mb-1 group-hover:text-taiz-royal transition-colors line-clamp-1">
          {event.title}
        </h3>

        <p className="text-taiz-soft text-[10px] line-clamp-1 leading-normal mb-2 font-bold">
          {event.description || "تصفح التفاصيل لمعرفة المزيد عن هذه المناسبة الكريمة."}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
        <span className="text-[10px] font-black text-taiz-royal group-hover:underline flex items-center gap-0.5">
          التفاصيل <ChevronLeft className="w-3 h-3" />
        </span>
        {remaining > 0 && (
          <span className="text-[8px] font-black text-taiz-sky flex items-center gap-0.5 bg-taiz-sky/5 px-1.5 py-0.5 rounded-md">
            <Timer className="w-3 h-3" />
            متبقي {remaining} يوم
          </span>
        )}
      </div>
    </motion.div>
  );
}

function HighlightedEventCard({
  event,
  status,
  remaining,
  onView,
  isActualToday,
}: {
  event: EventItem;
  status: any;
  remaining: number;
  onView: () => void;
  isActualToday: boolean;
  key?: any;
}) {
  return (
    <motion.div
      onClick={onView}
      whileHover={{ scale: 1.005 }}
      className="relative overflow-hidden bg-gradient-to-br from-taiz-navy via-taiz-navy to-taiz-royal rounded-[2rem] p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer group border-2 border-taiz-sky/40"
    >
      <div className="absolute top-0 left-0 w-48 h-48 bg-taiz-sky/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-taiz-royal/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-4 flex-1 text-right">
        <div className="flex flex-wrap items-center gap-2 justify-start">
          <span className="bg-taiz-sky text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            {isActualToday ? "المناسبة الحالية اليوم" : "المناسبة القادمة المميزة"}
          </span>
          <span className="bg-white/15 border border-white/10 text-white px-3 py-1 rounded-full text-xs font-black">
            {event.hijriDate}
          </span>
          {remaining > 0 && (
            <span className="text-white/95 font-black text-xs flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg">
              <Timer className="w-3.5 h-3.5" />
              متبقي {remaining} يوم
            </span>
          )}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black leading-tight text-white group-hover:text-taiz-sky transition-colors duration-300">
          {event.title}
        </h2>

        <p className="text-gray-150 text-xs sm:text-sm leading-relaxed max-w-2xl line-clamp-3 font-bold">
          {event.description ||
            "لا يوجد وصف مدون حالياً لهذه المناسبة الإسلامية الكريمة، استكشف التفاصيل الكبرى لقراءة المزيد."}
        </p>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="bg-white text-taiz-navy hover:bg-taiz-sky hover:text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer self-start"
        >
          عرض التفاصيل الكبرى <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="relative z-10 w-24 h-24 rounded-[1.5rem] bg-white/10 border border-white/20 flex flex-col items-center justify-center shrink-0 self-center hidden md:flex backdrop-blur-md shadow-inner">
        <span className="text-2xl font-black text-white">
          {format(new Date(event.timestamp), "d")}
        </span>
        <span className="text-[10px] font-black text-taiz-sky uppercase mt-0.5">
          {format(new Date(event.timestamp), "MMMM", { locale: ar })}
        </span>
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
  key?: any;
}) {
  const isEven = idx % 2 === 0;
  return (
    <div
      className={`relative flex items-center gap-6 ${
        isEven ? "flex-row" : "flex-row-reverse"
      }`}
    >
      {/* Circle Connector */}
      <div
        className={`absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full border-4 border-white z-10 shadow-sm ${status.color}`}
      ></div>

      {/* Card Container */}
      <div className={`w-1/2 ${isEven ? "text-left pl-2" : "text-right pr-2"}`}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={onView}
          className="inline-block bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all text-right"
        >
          <div className="bg-taiz-navy/5 text-taiz-navy text-[9px] font-black px-2.5 py-0.5 rounded-md inline-block mb-2">
            {event.hijriDate}
          </div>
          <h4 className="text-xs sm:text-sm font-black text-taiz-navy mb-1 leading-tight">
            {event.title}
          </h4>
          <div className="text-[10px] text-taiz-soft font-bold">
            {event.gregorianDate}
          </div>
        </motion.div>
      </div>

      {/* Number Pointer */}
      <div
        className={`w-1/2 text-center ${
          isEven
            ? "text-right pr-2 animate-pulse"
            : "text-left pl-2 animate-pulse"
        }`}
      >
        <div className="text-xl font-black text-taiz-navy/10 select-none">
          #{idx + 1}
        </div>
      </div>
    </div>
  );
}

function NoResultsFound({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-20 bg-surface-main rounded-2xl border border-dashed border-border-light w-full ${className}`}
    >
      <Search className="w-10 h-10 text-text-muted mb-3" />
      <div className="text-sm font-black text-text-primary">
        مرحباً.. لا توجد نتائج مطابقة لبحثك
      </div>
      <p className="text-text-secondary text-xs mt-1 font-bold">
        تأكد من كتابة الكلمات بشكل صحيح وتصفية الفئات والمناسبات الفرعية
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
  const statusLabel =
    diff === 0 ? "يحدث اليوم" : diff > 0 ? "قادمة قريباً" : "مناسبة منتهية";
  const statusTheme =
    diff === 0
      ? {
          btn: "bg-taiz-sky text-white",
          badge: "bg-taiz-sky/5 text-taiz-sky border-taiz-sky/10",
        }
      : diff > 0
      ? {
          btn: "bg-taiz-royal text-white",
          badge: "bg-taiz-royal/5 text-taiz-royal border-taiz-royal/10",
        }
      : {
          btn: "bg-red-600 text-white",
          badge: "bg-taiz-navy/5 text-text-primary border-border-light",
        };

  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const currentIndex = sortedEvents.findIndex((e) => e.id === event.id);

  const prevEvent = currentIndex > 0 ? sortedEvents[currentIndex - 1] : null;
  const nextEvent =
    currentIndex < sortedEvents.length - 1
      ? sortedEvents[currentIndex + 1]
      : null;

  const daysFromPrev = prevEvent
    ? differenceInDays(new Date(event.timestamp), new Date(prevEvent.timestamp))
    : null;
  const daysToNext = nextEvent
    ? differenceInDays(new Date(nextEvent.timestamp), new Date(event.timestamp))
    : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in"
      dir="rtl"
    >
      <button
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-transparent w-full h-full border-none"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-xl bg-surface-card rounded-[2rem] shadow-2xl border border-border-light overflow-hidden flex flex-col p-6 max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-border-light">
          <div className="space-y-1 text-right">
            <span
              className={`text-[10px] font-black px-2.5 py-1 rounded-md border ${statusTheme.badge}`}
            >
              {statusLabel}
            </span>
            <h2 className="text-lg sm:text-xl font-black text-text-primary leading-tight mt-1">
              {event.title}
            </h2>
            <p className="text-xs text-text-secondary font-bold">
              {event.gregorianDate} - {event.dayName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary bg-surface-main hover:bg-surface-hover p-2 rounded-xl transition cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="grow overflow-y-auto py-5 space-y-5 text-right">
          {/* Main Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 px-1">
              <Info className="w-4 h-4 text-red-600" />
              <span className="text-xs font-black text-text-secondary">
                ملخص وموضوع المناسبة
              </span>
            </div>
            <div className="bg-surface-main border border-border-light rounded-2xl p-4.5 text-xs sm:text-sm text-text-primary leading-relaxed font-bold">
              {event.description ||
                "معلومات تفصيلية تنشر قريباً لتغطية هذه الذكرى والمناسبة الدينية والوطنية الهامة التابعة للثقافة القرآنية المباركة."}
            </div>
          </div>

          {/* Dates Comparison Bento cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-taiz-sky/5 border border-taiz-sky/10 p-4 rounded-xl">
              <span className="text-[10px] font-black text-taiz-royal block mb-0.5">
                التاريخ الهجري
              </span>
              <span className="text-xs sm:text-sm font-black text-text-primary">
                {event.hijriDate}
              </span>
            </div>
            <div className="bg-taiz-royal/5 border border-taiz-royal/10 p-4 rounded-xl">
              <span className="text-[10px] font-black text-text-primary block mb-0.5">
                تباعد الأيام للحدث
              </span>
              <span className="text-xs sm:text-sm font-black text-text-primary">
                {diff > 0
                  ? `متبقي ${diff} يوم`
                  : diff === 0
                  ? "يصادف اليوم"
                  : "منتهية ومضت"}
              </span>
            </div>
          </div>

          {/* Related Syllabus Section */}
          {relatedSyllabus && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 px-1">
                <BookOpen className="w-4 h-4 text-red-600" />
                <span className="text-xs font-black text-text-secondary">
                  مقرر الدروس المرتبط بالمناسبة
                </span>
              </div>
              <div
                onClick={onNavigateToSyllabus}
                className="bg-emerald-50/50 border border-emerald-500/20 rounded-2xl p-4.5 cursor-pointer hover:bg-emerald-50 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-emerald-900 group-hover:text-emerald-700 transition-colors">
                      المقرر الحالي للمناسبة
                    </div>
                    <div className="text-xs text-emerald-700/80 mt-1 font-bold">
                      انقر هنا للانتقال إلى قسم هدي القرآن لقراءة المقرر
                    </div>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-emerald-600/50 group-hover:text-red-600 transition-colors" />
              </div>
            </div>
          )}

          {/* Time Gaps between adjacent events */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 px-1">
              <Timer className="w-4 h-4 text-red-600" />
              <span className="text-xs font-black text-text-secondary">
                الربط والمسافات الزمنية
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs font-black">
              {prevEvent && (
                <div className="flex items-center justify-between p-3.5 bg-surface-main hover:bg-surface-hover rounded-xl transition border border-border-light">
                  <span className="text-text-secondary leading-none">
                    فترة البعد عن [{prevEvent.title.slice(0, 20)}...]:
                  </span>
                  <span className="text-taiz-royal font-black">
                    +{daysFromPrev} يوم
                  </span>
                </div>
              )}
              {nextEvent && (
                <div className="flex items-center justify-between p-3.5 bg-surface-main hover:bg-surface-hover rounded-xl transition border border-border-light">
                  <span className="text-text-secondary leading-none">
                    فترة القرب من [{nextEvent.title.slice(0, 20)}...]:
                  </span>
                  <span className="text-taiz-sky font-black">
                    {daysToNext} يوم
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-4 border-t border-border-light flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl text-xs sm:text-sm font-black shadow-lg transition duration-200 cursor-pointer text-center"
          >
            إغلاق
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${event.title} - ${event.hijriDate}`
              );
              alert("تم نسخ تفاصيل المناسبة بنجاح!");
            }}
            className="bg-surface-main hover:bg-surface-hover text-text-primary border border-border-light px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4.5 h-4.5" />
            <span className="hidden sm:inline">نشر المناسبة</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
