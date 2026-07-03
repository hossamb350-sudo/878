const fs = require('fs');

let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

// Replace the Quran Tabs to only have Syllabuses and Excerpts
content = content.replace(
  /const \[activeTab, setActiveTab\] = useState<'series' \| 'lessons' \| 'syllabuses' \| 'excerpts'>\('series'\);/g,
  `const [activeTab, setActiveTab] = useState<'syllabuses' | 'excerpts'>('syllabuses');`
);

content = content.replace(
  /\{\s*id:\s*'series',\s*label:\s*'السلاسل'\s*\},\s*\{\s*id:\s*'lessons',\s*label:\s*'الدروس'\s*\},\s*/g,
  ''
);

content = content.replace(
  /\{activeTab === 'series' && <AdminQuranSeries \/>\}\s*\{activeTab === 'lessons' && <AdminQuranLessons \/>\}/g,
  ''
);

// We'll replace AdminQuranSyllabuses and AdminQuranExcerpts entirely using a regex
content = content.replace(/function AdminQuranSyllabuses\(\) \{[\s\S]*?function AdminQuranExcerpts\(\) \{[\s\S]*?(?=function AdminEvents)/g, 
`function AdminQuranSyllabuses() {
  const [list, setList] = useState<QuranSyllabus[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [localLessons, setLocalLessons] = useState<QuranLesson[]>([]);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [eventId, setEventId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load local lessons
    try {
      const saved = localStorage.getItem("quran_imported_lessons");
      if (saved) {
        setLocalLessons(JSON.parse(saved));
      }
    } catch(e) {}

    const unsub = onSnapshot(query(collection(db, "quran_syllabuses"), orderBy("createdAt", "desc")), (snap) => {
       setList(snap.docs.map(d => ({ id: d.id, ...d.data() } as QuranSyllabus)));
    });
    const unsubEvents = onSnapshot(query(collection(db, "events"), orderBy("timestamp", "desc")), (snap) => {
       setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as EventItem)));
    });
    return () => { unsub(); unsubEvents(); };
  }, []);

  const save = async () => {
    if (!lessonId || !startDate || !endDate) return alert("الرجاء تحديد الدرس وتاريخ البداية والنهاية");
    setSaving(true);
    try {
      const payload = { 
        lessonId, 
        startDate: new Date(startDate).getTime(), 
        endDate: new Date(endDate).getTime(), 
        eventId: eventId || null,
        createdAt: editingId ? undefined : Date.now() 
      };
      
      if (editingId) {
        // @ts-ignore
        await updateDoc(doc(db, "quran_syllabuses", editingId), payload);
      } else {
        await addDoc(collection(db, "quran_syllabuses"), payload);
      }
      setEditingId(null); setLessonId(""); setStartDate(""); setEndDate(""); setEventId("");
    } catch(e) {
      console.error(e);
      alert("حدث خطأ");
    } finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (confirm("تأكيد الحذف؟")) {
      await deleteDoc(doc(db, "quran_syllabuses", id));
      await SyncService.trackDeletion("quran_syllabuses", id);
    }
  };

  return (
    <div className="space-y-6">
       <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded-xl text-sm leading-relaxed border border-blue-200 dark:border-blue-800">
         يتم اختيار المقرر من الدروس الموجودة محلياً. عند انتهاء فترة العرض سيتم إخفاء المقرر تلقائياً.
       </div>
       <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">{editingId ? "تعديل مقرر" : "اعتماد مقرر جديد"}</h3>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 pr-1">الدرس المقرر</label>
            <select className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg font-bold dark:text-white" value={lessonId} onChange={e=>setLessonId(e.target.value)}>
               <option value="">-- اختر الدرس --</option>
               {localLessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
            {localLessons.length === 0 && <p className="text-xs text-red-500 mt-1">يجب أولاً استيراد أو تحميل دروس هدي القرآن محلياً لكي تتمكن من اختيارها.</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 pr-1">تاريخ البداية</label>
              <input type="date" className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white" value={startDate} onChange={e=>setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 pr-1">تاريخ النهاية</label>
              <input type="date" className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white" value={endDate} onChange={e=>setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 pr-1">ربط بمناسبة (اختياري)</label>
            <select className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white" value={eventId} onChange={e=>setEventId(e.target.value)}>
               <option value="">-- بدون ربط --</option>
               {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold transition-colors">{saving ? "جاري..." : "حفظ"}</button>
            {editingId && <button onClick={()=>{setEditingId(null); setLessonId(""); setStartDate(""); setEndDate(""); setEventId("");}} className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-bold transition-colors">إلغاء</button>}
          </div>
       </div>
       <div className="space-y-2 mt-4">
         {list.map(s => {
           const l = localLessons.find(x => x.id === s.lessonId);
           return (
           <div key={s.id} className="flex justify-between items-center p-4 bg-white dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-emerald-500/30 transition-colors group">
              <div>
                <span className="font-bold dark:text-white">{l ? l.title : 'درس غير معروف'}</span> 
                <div className="text-xs text-gray-500 mt-1">
                  من: {new Date(s.startDate).toLocaleDateString()} إلى: {new Date(s.endDate).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                 <button onClick={()=>{
                   setEditingId(s.id); 
                   setLessonId(s.lessonId);
                   setStartDate(new Date(s.startDate).toISOString().split('T')[0]);
                   setEndDate(new Date(s.endDate).toISOString().split('T')[0]);
                   setEventId(s.eventId || "");
                 }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit className="w-4 h-4"/></button>
                 <button onClick={()=>del(s.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
              </div>
           </div>
         )})}
       </div>
    </div>
  );
}

function AdminQuranExcerpts() {
  const [list, setList] = useState<QuranExcerpt[]>([]);
  const [localLessons, setLocalLessons] = useState<QuranLesson[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [lessonId, setLessonId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("quran_imported_lessons");
      if (saved) setLocalLessons(JSON.parse(saved));
    } catch(e) {}

    const unsub = onSnapshot(query(collection(db, "quran_excerpts"), orderBy("createdAt", "desc")), (snap) => {
       setList(snap.docs.map(d => ({ id: d.id, ...d.data() } as QuranExcerpt)));
    });
    return unsub;
  }, []);

  const save = async () => {
    if (!lessonId || !title || !content) return alert("أكمل البيانات المطلوبة (الدرس، العنوان، النص)");
    setSaving(true);
    try {
      const payload = { lessonId, title, content, mediaUrl, createdAt: editingId ? undefined : Date.now() };
      if (editingId) {
        // @ts-ignore
        await updateDoc(doc(db, "quran_excerpts", editingId), payload);
      } else {
        await addDoc(collection(db, "quran_excerpts"), payload);
      }
      setEditingId(null); setLessonId(""); setTitle(""); setContent(""); setMediaUrl("");
    } catch(e) {
      console.error(e);
      alert("حدث خطأ");
    } finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (confirm("تأكيد الحذف؟")) {
      await deleteDoc(doc(db, "quran_excerpts", id));
      await SyncService.trackDeletion("quran_excerpts", id);
    }
  };

  return (
    <div className="space-y-6">
       <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">{editingId ? "تعديل مقتطف" : "إضافة مقتطف جديد"}</h3>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 pr-1">الدرس (إلزامي)</label>
            <select className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg font-bold dark:text-white" value={lessonId} onChange={e=>setLessonId(e.target.value)}>
               <option value="">-- اختر الدرس --</option>
               {localLessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 pr-1">عنوان المقتطف</label>
            <input className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white" value={title} onChange={e=>setTitle(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 pr-1">النص</label>
            <textarea className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg h-32 leading-loose dark:text-white" value={content} onChange={e=>setContent(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 pr-1">الوسائط (اختياري - رابط)</label>
            <input className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white" value={mediaUrl} onChange={e=>setMediaUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold transition-colors">{saving ? "جاري..." : "حفظ"}</button>
            {editingId && <button onClick={()=>{setEditingId(null); setLessonId(""); setTitle(""); setContent(""); setMediaUrl("");}} className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-bold transition-colors">إلغاء</button>}
          </div>
       </div>
       <div className="space-y-2 mt-4">
         {list.map(s => {
           const l = localLessons.find(x => x.id === s.lessonId);
           return (
           <div key={s.id} className="flex justify-between items-center p-4 bg-white dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-emerald-500/30 transition-colors group">
              <div>
                <span className="font-bold dark:text-white">{s.title}</span> 
                <div className="text-xs text-gray-500 mt-1">الدرس: {l ? l.title : 'غير معروف'}</div>
              </div>
              <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                 <button onClick={()=>{setEditingId(s.id); setLessonId(s.lessonId); setTitle(s.title); setContent(s.content); setMediaUrl(s.mediaUrl||"");}} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit className="w-4 h-4"/></button>
                 <button onClick={()=>del(s.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
              </div>
           </div>
         )})}
       </div>
    </div>
  );
}
`
);

fs.writeFileSync('src/pages/Admin.tsx', content);
console.log('Done rewriting Admin.tsx');
