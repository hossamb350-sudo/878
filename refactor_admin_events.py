import sys
import re

with open("src/pages/Admin.tsx", "r") as f:
    content = f.read()

# Replace function AdminEvents() { with function AdminEventsContent() {
content = content.replace("function AdminEvents() {", "function AdminEventsContent() {")

# Then add function AdminEvents() at the end (or before AdminRoles)
# Find function AdminRoles()
idx = content.find("function AdminRoles()")

admin_events_wrapper = """
function AdminActivitiesContent() {
  const [actTitle, setActTitle] = useState("");
  const [actDesc, setActDesc] = useState("");
  const [actStartDate, setActStartDate] = useState("");
  const [actEndDate, setActEndDate] = useState("");
  const [actLocation, setActLocation] = useState("");
  const [actImageUrl, setActImageUrl] = useState("");
  const [activities, setActivities] = useState<any[]>([]);
  const [actEditingId, setActEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const cached = await SyncService.getCache<any>("activities");
        if (cached && active) setActivities(cached);
      } catch (e) {}
    };
    load();
    const unsub = SyncService.syncCollection<any>(
      "activities",
      (data) => {
        if (!active) return;
        setActivities(data);
      },
      { orderByField: "startDate", orderDirection: "asc" }
    );
    return () => {
      active = false;
      unsub.then((u) => u());
    };
  }, []);

  const save = async () => {
    if (!actTitle || !actStartDate) return alert("يرجى إدخال عنوان وتاريخ بدء الفعالية");
    setSaving(true);
    try {
      const data = {
        title: actTitle,
        description: actDesc,
        startDate: new Date(actStartDate).getTime(),
        endDate: actEndDate ? new Date(actEndDate).getTime() : null,
        location: actLocation,
        imageUrl: actImageUrl,
        updatedAt: Date.now(),
      };
      
      if (actEditingId) {
        await updateDoc(doc(db, "activities", actEditingId), data);
        alert("تم تعديل الفعالية بنجاح");
      } else {
        await addDoc(collection(db, "activities"), { ...data, createdAt: Date.now() });
        alert("تم إضافة الفعالية بنجاح");
      }
      
      setActTitle("");
      setActDesc("");
      setActStartDate("");
      setActEndDate("");
      setActLocation("");
      setActImageUrl("");
      setActEditingId(null);
    } catch (e) {
      alert("خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفعالية؟")) return;
    try {
      await deleteDoc(doc(db, "activities", id));
      alert("تم حذف الفعالية");
    } catch (e) {
      alert("خطأ أثناء الحذف");
    }
  };

  const edit = (act: any) => {
    setActEditingId(act.id);
    setActTitle(act.title);
    setActDesc(act.description || "");
    setActStartDate(new Date(act.startDate).toISOString().slice(0, 16));
    setActEndDate(act.endDate ? new Date(act.endDate).toISOString().slice(0, 16) : "");
    setActLocation(act.location || "");
    setActImageUrl(act.imageUrl || "");
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4">
        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">
          {actEditingId ? "تعديل الفعالية" : "إضافة فعالية جديدة"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
            placeholder="عنوان الفعالية"
            value={actTitle}
            onChange={(e) => setActTitle(e.target.value)}
          />
          <input
            type="text"
            className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
            placeholder="الموقع (اختياري)"
            value={actLocation}
            onChange={(e) => setActLocation(e.target.value)}
          />
        </div>
        <textarea
          className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
          placeholder="وصف الفعالية"
          rows={3}
          value={actDesc}
          onChange={(e) => setActDesc(e.target.value)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">تاريخ ووقت البدء</label>
            <input
              type="datetime-local"
              className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
              value={actStartDate}
              onChange={(e) => setActStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">تاريخ ووقت الانتهاء (اختياري)</label>
            <input
              type="datetime-local"
              className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
              value={actEndDate}
              onChange={(e) => setActEndDate(e.target.value)}
            />
          </div>
        </div>
        <input
            type="text"
            className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
            placeholder="رابط صورة (اختياري)"
            value={actImageUrl}
            onChange={(e) => setActImageUrl(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition flex-1"
          >
            {saving ? "جاري الحفظ..." : actEditingId ? "حفظ التعديلات" : "إضافة فعالية"}
          </button>
          {actEditingId && (
            <button
              onClick={() => {
                setActEditingId(null);
                setActTitle("");
                setActDesc("");
                setActStartDate("");
                setActEndDate("");
                setActLocation("");
                setActImageUrl("");
              }}
              className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-bold transition"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {activities.map((act) => (
          <div key={act.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center shadow-sm">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">{act.title}</h4>
              <div className="text-xs text-gray-500 mt-1">
                تبدأ: {new Date(act.startDate).toLocaleString('ar-EG')}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => edit(act)}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
              >
                تعديل
              </button>
              <button
                onClick={() => remove(act.id)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
              >
                حذف
              </button>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <p className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
            لا توجد فعاليات مضافة حالياً.
          </p>
        )}
      </div>
    </div>
  );
}

function AdminEvents() {
  const [activeSubTab, setActiveSubTab] = useState<"calendar" | "activities">("calendar");

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-blue-600" />
          قسم المناسبات والفعاليات
        </h2>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl flex gap-1 w-max">
        <button
          onClick={() => setActiveSubTab("calendar")}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeSubTab === "calendar" 
              ? "bg-white dark:bg-gray-900 text-blue-600 shadow-sm" 
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          إدارة التقويم (المناسبات)
        </button>
        <button
          onClick={() => setActiveSubTab("activities")}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeSubTab === "activities" 
              ? "bg-white dark:bg-gray-900 text-blue-600 shadow-sm" 
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          إدارة الفعاليات
        </button>
      </div>

      {activeSubTab === "calendar" ? <AdminEventsContent /> : <AdminActivitiesContent />}
    </div>
  );
}

"""

content = content[:idx] + admin_events_wrapper + content[idx:]

# Additionally, inside AdminEventsContent, we need to remove the title section 
# because it's now in AdminEvents
# Let's just remove the first 2 divs of AdminEventsContent.
# Actually, the title is:
#      <div className="flex justify-between items-center">
#        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
#          <CalendarIcon className="w-6 h-6 text-blue-600" />
#          إدارة تقويم المناسبات
#        </h2>
#      </div>
header_to_remove = """      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-blue-600" />
          إدارة تقويم المناسبات
        </h2>
      </div>"""

content = content.replace(header_to_remove, "")

with open("src/pages/Admin.tsx", "w") as f:
    f.write(content)

