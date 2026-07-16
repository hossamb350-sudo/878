import sys

with open("src/pages/Admin.tsx", "r") as f:
    content = f.read()

start_idx = content.find("function AdminActivitiesContent() {")
end_idx = content.find("function AdminEvents() {", start_idx)

if start_idx == -1 or end_idx == -1:
    print("Could not find bounds")
    sys.exit(1)

new_func = """function AdminActivitiesContent() {
  const [actTitle, setActTitle] = useState("");
  const [actType, setActType] = useState("");
  const [actDate, setActDate] = useState("");
  const [actDayName, setActDayName] = useState("");
  const [actHijriDate, setActHijriDate] = useState("");
  const [actGregorianDate, setActGregorianDate] = useState("");
  const [actStartTime, setActStartTime] = useState("");
  const [actEndTime, setActEndTime] = useState("");
  const [actDesc, setActDesc] = useState("");
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

  const handleDateChange = (val: string) => {
    setActDate(val);
    if (!val) return;
    const newDate = new Date(val);
    if (!isNaN(newDate.getTime())) {
      setActDayName(new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(newDate));
      setActHijriDate(new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(newDate) + " هـ");
      setActGregorianDate(new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(newDate));
    }
  };

  const save = async () => {
    if (!actTitle || !actType || !actDate) return alert("يرجى إدخال عنوان ونوع الفعالية والتاريخ");
    
    if (actStartTime && actEndTime) {
      if (actEndTime < actStartTime) {
        return alert("وقت الانتهاء لا يمكن أن يسبق وقت البدء");
      }
    }

    setSaving(true);
    try {
      let startDateMs = new Date(actDate).getTime();
      if (actStartTime) {
        startDateMs = new Date(`${actDate}T${actStartTime}`).getTime();
      }

      const data = {
        title: actTitle,
        type: actType,
        dayName: actDayName,
        hijriDate: actHijriDate,
        gregorianDate: actGregorianDate,
        startTime: actStartTime || null,
        endTime: actEndTime || null,
        description: actDesc,
        imageUrl: actImageUrl,
        startDate: startDateMs,
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
      setActType("");
      setActDate("");
      setActDayName("");
      setActHijriDate("");
      setActGregorianDate("");
      setActStartTime("");
      setActEndTime("");
      setActDesc("");
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
    setActTitle(act.title || "");
    setActType(act.type || "");
    if (act.startDate) {
      const d = new Date(act.startDate);
      setActDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    } else {
      setActDate("");
    }
    setActDayName(act.dayName || "");
    setActHijriDate(act.hijriDate || "");
    setActGregorianDate(act.gregorianDate || "");
    setActStartTime(act.startTime || "");
    setActEndTime(act.endTime || "");
    setActDesc(act.description || "");
    setActImageUrl(act.imageUrl || "");
  };

  const baseTypes = ["مسيرة", "وقفة", "أمسية", "مؤتمر", "ندوة", "مهرجان"];
  const uniqueTypes = Array.from(new Set([...baseTypes, ...activities.map(a => a.type).filter(Boolean)]));

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-6">
        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">
          {actEditingId ? "تعديل الفعالية" : "إضافة فعالية جديدة"}
        </h3>
        
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">عنوان الفعالية <span className="text-red-500">*</span></label>
          <input
            type="text"
            className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
            placeholder="اكتب عنوان الفعالية هنا..."
            value={actTitle}
            onChange={(e) => setActTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">نوع الفعالية <span className="text-red-500">*</span></label>
            <input
              type="text"
              list="activity-types"
              className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
              placeholder="مثال: مسيرة، وقفة، مؤتمر..."
              value={actType}
              onChange={(e) => setActType(e.target.value)}
              required
            />
            <datalist id="activity-types">
              {uniqueTypes.map((t, idx) => (
                <option key={idx} value={t} />
              ))}
            </datalist>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">تاريخ الفعالية <span className="text-red-500">*</span></label>
            <input
              type="date"
              className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
              value={actDate}
              onChange={(e) => handleDateChange(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">اليوم</label>
            <input
              type="text"
              className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
              value={actDayName}
              onChange={(e) => setActDayName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">التاريخ الهجري</label>
            <input
              type="text"
              className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
              value={actHijriDate}
              onChange={(e) => setActHijriDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">التاريخ الميلادي</label>
            <input
              type="text"
              className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
              value={actGregorianDate}
              onChange={(e) => setActGregorianDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">وقت البدء (اختياري)</label>
            <input
              type="time"
              className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
              value={actStartTime}
              onChange={(e) => setActStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">وقت الانتهاء (اختياري)</label>
            <input
              type="time"
              className="w-full p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl"
              value={actEndTime}
              onChange={(e) => setActEndTime(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">وصف الفعالية (اختياري)</label>
          <textarea
            className="w-full p-5 text-lg font-medium leading-relaxed bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-2xl h-64 focus:ring-2 focus:ring-blue-500 transition-all resize-y placeholder:text-gray-300"
            placeholder="اكتب وصفاً تفصيلياً للفعالية هنا..."
            value={actDesc}
            onChange={(e) => setActDesc(e.target.value)}
          />
        </div>

        <div>
          <ImageUpload
            label="صورة الفعالية (اختياري)"
            placeholder="اضغط لرفع صورة رئيسية للفعالية"
            value={actImageUrl}
            onChange={(url) => setActImageUrl(url)}
            onRemove={() => setActImageUrl("")}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition flex-1 shadow-lg shadow-blue-600/20"
          >
            {saving ? "جاري الحفظ..." : actEditingId ? "حفظ التعديلات" : "إضافة فعالية"}
          </button>
          {actEditingId && (
            <button
              onClick={() => {
                setActEditingId(null);
                setActTitle("");
                setActType("");
                setActDate("");
                setActDayName("");
                setActHijriDate("");
                setActGregorianDate("");
                setActStartTime("");
                setActEndTime("");
                setActDesc("");
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
          <div key={act.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm gap-4">
            <div className="flex items-center gap-4 flex-1">
              {act.imageUrl && (
                <img src={act.imageUrl} alt={act.title} className="w-16 h-16 rounded-lg object-cover" />
              )}
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">{act.title} <span className="text-sm font-normal text-gray-500">({act.type})</span></h4>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-2 font-bold">
                  <span className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-lg">{act.dayName}</span>
                  <span className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-lg">{act.hijriDate}</span>
                  <span className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-lg">{act.gregorianDate}</span>
                  {act.startTime && <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-2 py-1 rounded-lg">بدء: {act.startTime}</span>}
                  {act.endTime && <span className="bg-red-50 dark:bg-red-900/30 text-red-600 px-2 py-1 rounded-lg">انتهاء: {act.endTime}</span>}
                </div>
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
"""

content = content[:start_idx] + new_func + content[end_idx:]

with open("src/pages/Admin.tsx", "w") as f:
    f.write(content)
