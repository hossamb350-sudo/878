import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { EventItem } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, MapPin } from "lucide-react";

export function Events() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = await getDocs(query(collection(db, "events"), orderBy("date", "asc")));
        setEvents(q.docs.map(d => ({ id: d.id, ...d.data() } as EventItem)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const getTypeColor = (type: string) => {
    switch(type) {
      case "official": return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
      case "local": return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
      case "cultural": return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300";
      case "religious": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getTypeName = (type: string) => {
    switch(type) {
      case "official": return "رسمية";
      case "local": return "محلية";
      case "cultural": return "ثقافية";
      case "religious": return "دينية";
      default: return type;
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-4 pb-12">
      <h1 className="text-2xl font-bold mb-8">المناسبات والفعاليات</h1>

      {loading ? (
         <div className="text-center py-10">جاري التحميل...</div>
      ) : events.length === 0 ? (
         <div className="text-center py-20 text-gray-500">لا توجد فعاليات مجدولة</div>
      ) : (
         <div className="space-y-4">
           {events.map((event) => (
             <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-6 items-start">
                <div className="bg-blue-50 dark:bg-blue-900/20 w-24 h-24 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/50">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                       {format(event.date, "dd", { locale: ar })}
                    </span>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                       {format(event.date, "MMM", { locale: ar })}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                       {format(event.date, "yyyy", { locale: ar })}
                    </span>
                </div>
                <div className="flex-1">
                   <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${getTypeColor(event.type)}`}>
                         {getTypeName(event.type)}
                      </span>
                   </div>
                   <h2 className="text-xl font-bold mb-2">{event.title}</h2>
                   {event.description && (
                      <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                         {event.description}
                      </p>
                   )}
                   <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5 opacity-80">
                         <CalendarIcon className="w-4 h-4" />
                         {format(event.date, "EEEE - hh:mm a", { locale: ar })}
                      </span>
                   </div>
                </div>
             </div>
           ))}
         </div>
      )}
    </div>
  );
}
