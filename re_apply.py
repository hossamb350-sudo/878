import sys

with open("src/pages/Events.tsx", "r") as f:
    content = f.read()

# 1. State
content = content.replace('  const [dbEvents, setDbEvents] = useState<EventItem[]>([]);',
'''  const [dbEvents, setDbEvents] = useState<EventItem[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [activeMainTab, setActiveMainTab] = useState<"calendar" | "activities">("calendar");''')

# 2. useEffect Sync
content = content.replace('''    const unsubPromise2 = SyncService.syncCollection<any>(
      "quran_syllabuses",
      (data) => {
        if (!active) return;
        setSyllabuses(data);
      }
    );''', '''    const unsubPromise3 = SyncService.syncCollection<any>("activities", (data) => {
      if (!active) return;
      setActivities(data);
    });
    const unsubPromise2 = SyncService.syncCollection<any>(
      "quran_syllabuses",
      (data) => {
        if (!active) return;
        setSyllabuses(data);
      }
    );''')

content = content.replace('''      unsubPromise2.then((unsub) => unsub());''', '''      unsubPromise2.then((unsub) => unsub());
      unsubPromise3.then((unsub) => unsub());''')

# 3. useMemo
content = content.replace('''    return merged.sort((a, b) => a.timestamp - b.timestamp);
  }, [dbEvents]);''', '''    activities.forEach(act => {
      const date = new Date(act.startDate);
      merged.push({
        id: `activity-${act.id}`,
        title: act.title,
        description: act.description,
        dayName: format(date, "EEEE", { locale: ar }),
        hijriDate: new Intl.DateTimeFormat("ar-SA-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(date) + " هـ",
        gregorianDate: format(date, "d MMMM yyyy", { locale: ar }),
        timestamp: act.startDate,
        category: "all",
        type: "فعالية",
      } as EventItem);
    });
    return merged.sort((a, b) => a.timestamp - b.timestamp);
  }, [dbEvents, activities]);''')

# 4. Main return wrap
return_sig = '''  return (
    <div
      className="max-w-7xl mx-auto w-full p-4 pb-20 space-y-8 font-sans"
      dir="rtl"
    >'''
new_return_sig = '''  return (
    <div className="max-w-7xl mx-auto w-full p-4 pb-20 space-y-8 font-sans" dir="rtl">
      <div className="relative bg-surface-card p-1.5 rounded-2xl flex border border-border-light shadow-sm w-full max-w-sm mx-auto mb-6">
        {["calendar", "activities"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveMainTab(tab as any)}
            className={`relative flex-1 py-3 text-sm font-black transition-colors z-10 ${
              activeMainTab === tab ? "text-white" : "text-text-muted hover:text-text-primary"
            }`}
          >
            {activeMainTab === tab && (
              <motion.div
                layoutId="activeMainTabIndicator"
                className="absolute inset-0 bg-taiz-navy rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            )}
            {tab === "calendar" ? "التقويم" : "الفعاليات"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {activeMainTab === "calendar" && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, { offset }) => {
              if (offset.x < -50 || offset.x > 50) {
                setActiveMainTab("activities");
              }
            }}
            className="space-y-8"
          >'''
content = content.replace(return_sig, new_return_sig)

# 5. Main return closing
chunk_to_replace = '''                    onView={() => setSelectedEventId(event.id)}
                  />
                ))}
              </div>
              {filteredEvents.length === 0 && <NoResultsFound />}
            </div>
          )}
        </div>

      {/* Event Details Modal */}'''

new_chunk = """                    onView={() => setSelectedEventId(event.id)}
                  />
                ))}
              </div>
              {filteredEvents.length === 0 && <NoResultsFound />}
            </div>
          )}
          </motion.div>
        )}

        {activeMainTab === "activities" && (
          <motion.div
            key="activities"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, { offset }) => {
              if (offset.x < -50 || offset.x > 50) {
                setActiveMainTab("calendar");
              }
            }}
            className="space-y-8 bg-surface-card rounded-2xl p-6 border border-border-light min-h-[60vh] flex flex-col items-center justify-center"
          >
            <h3 className="text-xl font-black text-text-primary mb-2">الفعاليات</h3>
            <p className="text-sm font-bold text-text-secondary mb-6 text-center">
              إدارة وعرض الفعاليات الخاصة بك
            </p>
            <div className="w-full max-w-4xl space-y-4">
              {activities.length === 0 ? (
                <div className="text-text-muted text-sm font-bold text-center">لا توجد فعاليات مضافة حالياً.</div>
              ) : (
                activities.map(act => (
                  <div key={act.id} className="bg-surface-main p-4 rounded-xl border border-border-light flex flex-col md:flex-row gap-4 items-start md:items-center text-right shadow-sm">
                    {act.imageUrl && (
                      <img src={act.imageUrl} alt={act.title} className="w-full md:w-32 h-32 md:h-24 object-cover rounded-lg" />
                    )}
                    <div className="flex-1 space-y-2 w-full text-right">
                      <h4 className="text-base font-black text-text-primary">{act.title}</h4>
                      <p className="text-xs font-bold text-text-secondary">{act.description}</p>
                      <div className="flex flex-wrap gap-4 text-[10px] text-text-muted font-black mt-2">
                        <span className="bg-white/50 px-2 py-1 rounded">يبدأ: {new Date(act.startDate).toLocaleDateString('ar-EG')}</span>
                        {act.endDate && <span className="bg-white/50 px-2 py-1 rounded">ينتهي: {new Date(act.endDate).toLocaleDateString('ar-EG')}</span>}
                        {act.location && <span className="bg-white/50 px-2 py-1 rounded">الموقع: {act.location}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Details Modal */}"""

# Note: In the old code, there was a </div> before {/* Event Details Modal */}.
# Wait, let me check the exact string to replace before executing.
