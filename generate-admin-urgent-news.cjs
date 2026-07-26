const fs = require('fs');

const componentCode = `function AdminUrgentNews() {
  const [text, setText] = useState("");
  const [expiryMinutes, setExpiryMinutes] = useState(60);
  const [tickerSpeed, setTickerSpeed] = useState(25);
  const [tickerTitle, setTickerTitle] = useState("خبر عاجل");
  const [saving, setSaving] = useState(false);
  const [urgentItems, setUrgentItems] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Tabs and Filters
  const [activeTab, setActiveTab] = useState<"add" | "active" | "archive">("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired" | "cancelled">("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "urgentNews"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUrgentItems(items);
    });

    const loadSettings = async () => {
      try {
        const docRef = doc(db, "settings", "urgentNews");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTickerSpeed(docSnap.data().speed || 25);
          setTickerTitle(docSnap.data().title || "خبر عاجل");
        }
      } catch (e) {
        console.error("Error loading ticker settings:", e);
      }
    };
    loadSettings();

    const interval = setInterval(() => setCurrentTime(Date.now()), 10000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const saveSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "urgentNews"), { speed: tickerSpeed, title: tickerTitle }, { merge: true });
      alert("تم حفظ إعدادات الشريط بنجاح");
    } catch (e) {
      alert("خطأ في الحفظ");
    }
  };

  const saveNews = async () => {
    if (!text) return alert("يرجى إدخال نص الخبر العاجل");
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "urgentNews", editingId), {
          text,
          expiresAt: Date.now() + expiryMinutes * 60000,
          isActive: true
        });
        alert(\`تم تعديل الخبر العاجل بنجاح\`);
        setEditingId(null);
      } else {
        await addDoc(collection(db, "urgentNews"), {
          text,
          isActive: true,
          createdAt: Date.now(),
          expiresAt: Date.now() + expiryMinutes * 60000,
        });
        alert(\`تم إضافة الخبر العاجل بنجاح\`);
      }
      setText("");
      setExpiryMinutes(60);
      setActiveTab("active");
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء النشر");
    } finally {
      setSaving(false);
    }
  };

  const toggleCancelItem = async (id: string, currentIsActive: boolean) => {
    try {
      if (currentIsActive) {
        await updateDoc(doc(db, "urgentNews", id), { isActive: false });
      } else {
        await updateDoc(doc(db, "urgentNews", id), { 
          isActive: true, 
          expiresAt: Date.now() + 60 * 60000 
        });
      }
    } catch (e) {
      alert("خطأ في تحديث حالة الخبر العاجل");
    }
  };
  
  const moveToMarquee = async (id: string) => {
    if (!confirm("هل أنت متأكد من إنهاء المدة الثابتة للخبر ونقله للشريط المتحرك فوراً؟")) return;
    try {
      await updateDoc(doc(db, "urgentNews", id), { expiresAt: Date.now() - 1000 });
    } catch (e) {
      alert("خطأ في النقل");
    }
  };

  const editItem = (item: any) => {
    setEditingId(item.id);
    setText(item.text);
    const remainingMins = Math.max(1, Math.ceil((item.expiresAt - Date.now()) / 60000));
    setExpiryMinutes(remainingMins);
    setActiveTab("add");
  };

  const republishItem = (item: any) => {
    setEditingId(null);
    setText(item.text);
    setExpiryMinutes(60);
    setActiveTab("add");
  };

  const cancelAllActiveNews = async () => {
    const activeDocs = urgentItems.filter(i => i.isActive !== false && i.expiresAt > Date.now());
    if (activeDocs.length === 0) return alert("لا توجد أخبار عاجلة نشطة حالياً لإلغائها.");
    if (!confirm(\`هل أنت متأكد من إلغاء جميع الأخبار العاجلة النشطة (\${activeDocs.length} خبر) فوراً؟\`)) return;
    try {
      for (const item of activeDocs) {
        await updateDoc(doc(db, "urgentNews", item.id), { isActive: false });
      }
      alert("تم إلغاء عرض جميع الأخبار العاجلة");
    } catch (e) {
      alert("خطأ في إلغاء الأخبار");
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الخبر نهائياً؟ لا يمكن التراجع.")) return;
    try {
      await deleteDoc(doc(db, "urgentNews", id));
    } catch (e) {
      alert("خطأ في الحذف");
    }
  };

  // Stats Logic
  const activeDocs = urgentItems.filter(i => i.isActive !== false && i.expiresAt > currentTime);
  const staticNews = activeDocs.length > 0 ? activeDocs[0] : null; 
  const scrollingDocs = urgentItems.filter(i => i.isActive !== false && i.id !== staticNews?.id);
  const expiredDocs = urgentItems.filter(i => i.expiresAt <= currentTime && i.isActive !== false);
  const cancelledDocs = urgentItems.filter(i => i.isActive === false);

  const stats = [
    { label: "خبر ثابت الآن", value: staticNews ? 1 : 0, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-100 dark:border-red-900/30", icon: <AlertTriangle className="w-6 h-6" /> },
    { label: "في الشريط المتحرك", value: scrollingDocs.length, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-100 dark:border-amber-900/30", icon: <Activity className="w-6 h-6" /> },
    { label: "الأرشيف (منتهية/ملغية)", value: expiredDocs.length + cancelledDocs.length, color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-900/50", border: "border-slate-200 dark:border-slate-800", icon: <Archive className="w-6 h-6" /> }
  ];

  // Filtering for archive tab
  const filteredArchive = urgentItems.filter(item => {
    const isExpired = item.expiresAt <= currentTime;
    const isCancelled = item.isActive === false;
    const isArchived = isExpired || isCancelled;
    
    if (!isArchived) return false;
    
    const matchesSearch = item.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
                          (filterStatus === "expired" && isExpired && !isCancelled) ||
                          (filterStatus === "cancelled" && isCancelled);
                          
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto font-cairo">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <span className="p-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl">
              <Zap className="w-6 h-6" />
            </span>
            نظام الأخبار العاجلة (شريط الأخبار)
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-bold text-sm">
            إدارة وتتبع الأخبار العاجلة، الشريط المتحرك، وإعدادات العرض الحية.
          </p>
        </div>
        {activeDocs.length > 0 && (
          <button
            onClick={cancelAllActiveNews}
            className="bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 border border-red-200 dark:border-red-900/50 transition-all shadow-sm"
          >
            <XCircle className="w-4 h-4" />
            <span>إلغاء جميع الأخبار النشطة</span>
          </button>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className={\`p-6 rounded-2xl border \${stat.border} \${stat.bg} flex items-center gap-4 transition-all hover:scale-[1.02]\`}>
            <div className={\`p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm \${stat.color}\`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
              <h3 className={\`text-3xl font-black \${stat.color}\`}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Master Tabs */}
      <div className="bg-gray-100/50 dark:bg-gray-900/50 p-1.5 rounded-2xl flex flex-wrap gap-1.5 border border-gray-200 dark:border-gray-800">
        <button 
          onClick={() => setActiveTab("active")}
          className={\`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all \${activeTab === "active" ? "bg-white dark:bg-gray-800 text-red-600 shadow-sm border border-gray-200 dark:border-gray-700" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}\`}
        >
          <Activity className="w-4 h-4" /> النشطة الآن
        </button>
        <button 
          onClick={() => { setActiveTab("add"); setEditingId(null); setText(""); setExpiryMinutes(60); }}
          className={\`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all \${activeTab === "add" ? "bg-white dark:bg-gray-800 text-red-600 shadow-sm border border-gray-200 dark:border-gray-700" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}\`}
        >
          <Plus className="w-4 h-4" /> {editingId ? "تعديل الخبر" : "إضافة/إعدادات"}
        </button>
        <button 
          onClick={() => setActiveTab("archive")}
          className={\`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all \${activeTab === "archive" ? "bg-white dark:bg-gray-800 text-red-600 shadow-sm border border-gray-200 dark:border-gray-700" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}\`}
        >
          <Archive className="w-4 h-4" /> الأرشيف
        </button>
      </div>

      {/* Tab Content: ACTIVE NEWS */}
      {activeTab === "active" && (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            الأخبار الجارية
          </h3>
          
          <div className="space-y-4">
            {urgentItems.filter(i => i.isActive !== false).length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <AlertTriangle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">لا توجد أخبار نشطة</h4>
                <p className="text-gray-500 font-bold mb-6">لم يتم إضافة أي خبر عاجل ليظهر للمستخدمين حالياً.</p>
                <button onClick={() => setActiveTab("add")} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-red-500/20 transition-all">
                  إضافة خبر جديد
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {urgentItems.filter(i => i.isActive !== false).map((item) => {
                  const isStatic = staticNews?.id === item.id;
                  const isScrolling = !isStatic;
                  const remainingTime = Math.max(0, Math.ceil((item.expiresAt - currentTime) / 60000));
                  
                  return (
                    <div key={item.id} className={\`bg-white dark:bg-gray-800 p-5 rounded-2xl border \${isStatic ? 'border-red-300 dark:border-red-700 shadow-md ring-2 ring-red-50 dark:ring-red-900/20' : 'border-gray-200 dark:border-gray-700 shadow-sm'} transition-all\`}>
                      <div className="flex flex-col md:flex-row gap-5 items-start">
                        {/* Status Icon */}
                        <div className={\`p-3 rounded-xl shrink-0 flex flex-col items-center justify-center min-w-[80px] \${isStatic ? 'bg-red-100 dark:bg-red-900/40 text-red-600' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600'}\`}>
                          {isStatic ? <AlertTriangle className="w-7 h-7 mb-1" /> : <Activity className="w-7 h-7 mb-1" />}
                          <span className="text-[10px] font-black uppercase tracking-wider">{isStatic ? 'ثابت' : 'متحرك'}</span>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {isStatic && (
                              <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                خبر ثابت حالياً
                              </span>
                            )}
                            {isScrolling && (
                              <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                في الشريط المتحرك
                              </span>
                            )}
                            <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700">
                              نشر: {new Date(item.createdAt).toLocaleTimeString('ar-YE', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            {item.expiresAt > currentTime && (
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> ينتهي بعد {remainingTime} دقيقة
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-base md:text-lg text-gray-900 dark:text-white leading-relaxed mt-3">
                            {item.text}
                          </p>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-700">
                          {isStatic && (
                            <button onClick={() => moveToMarquee(item.id)} className="flex-1 md:flex-none justify-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                              <ArrowLeftRight className="w-4 h-4" /> نقل للمتحرك
                            </button>
                          )}
                          <button onClick={() => editItem(item)} className="flex-1 md:flex-none justify-center bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                            <Edit2 className="w-4 h-4" /> تعديل
                          </button>
                          <button onClick={() => toggleCancelItem(item.id, true)} className="flex-1 md:flex-none justify-center bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                            <XCircle className="w-4 h-4" /> إيقاف
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: ADD & SETTINGS */}
      {activeTab === "add" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          {/* News Entry Form */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-6 h-6 text-red-600" />
                  {editingId ? "تعديل الخبر العاجل" : "إنشاء خبر عاجل جديد"}
                </h3>
                {editingId && (
                  <button onClick={() => { setEditingId(null); setText(""); setExpiryMinutes(60); }} className="text-gray-500 hover:text-red-600 text-sm font-bold flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <X className="w-4 h-4" /> إلغاء التعديل
                  </button>
                )}
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">النص الكامل للخبر:</label>
                  <textarea
                    className="w-full p-5 text-lg font-bold bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl h-40 focus:ring-2 focus:ring-red-500 transition-all resize-none shadow-inner"
                    placeholder="اكتب هنا الخبر الذي سيظهر للمستخدمين..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" /> مدة البقاء في الشريط الثابت (بالدقائق):
                  </label>
                  <input 
                    type="number"
                    className="w-full p-4 text-lg font-bold bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-inner"
                    value={expiryMinutes}
                    onChange={(e) => setExpiryMinutes(Number(e.target.value))}
                    min={1}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-bold leading-relaxed">
                    سيظل الخبر ثابتاً أسفل الشريط المتحرك لهذه المدة (ما لم يتم استبداله بخبر أحدث). بعد انتهائها، سينتقل الخبر تلقائياً لدورة الشريط المتحرك.
                  </p>
                </div>
                
                <button
                  onClick={saveNews}
                  disabled={saving || !text}
                  className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-2 text-lg"
                >
                  {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                  {editingId ? "حفظ التعديلات" : "نشر الخبر الآن"}
                </button>
              </div>
            </div>
          </div>
          
          {/* Settings Form */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
              <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-6 h-6 text-gray-500" />
                  إعدادات المظهر والشريط المتحرك
                </h3>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">شارة الشريط المتحرك:</label>
                  <input 
                    type="text"
                    className="w-full p-4 text-base font-bold bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-inner"
                    value={tickerTitle}
                    onChange={(e) => setTickerTitle(e.target.value)}
                    placeholder="مثال: خبر عاجل، بيان هام..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">سرعة الشريط المتحرك (أصغر = أسرع):</label>
                  <input 
                    type="number"
                    className="w-full p-4 text-base font-bold bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-inner"
                    value={tickerSpeed}
                    onChange={(e) => setTickerSpeed(Number(e.target.value))}
                    min={5}
                    max={120}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-bold">السرعة الافتراضية 25، وتتكيف تلقائياً مع طول النصوص.</p>
                </div>
                
                <button
                  onClick={saveSettings}
                  className="w-full bg-gray-900 hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" /> حفظ الإعدادات
                </button>
              </div>
            </div>
            
            {/* Live Preview snippet */}
            {text && (
              <div className="border border-red-200 dark:border-red-900 rounded-3xl overflow-hidden shadow-sm">
                <div className="bg-red-50 dark:bg-red-900/40 px-4 py-3 text-sm font-black text-red-600 dark:text-red-400 border-b border-red-200 dark:border-red-900 flex items-center justify-between">
                  <span>معاينة حية للمظهر</span>
                  <span className="animate-pulse">🔴</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4">
                  {/* Mock static bar */}
                  <div className="w-full bg-red-900 rounded-lg border border-red-500/20 py-1.5 px-3 flex items-start shadow-inner mb-2">
                    <span className="shrink-0 mt-0.5 inline-flex items-center justify-center px-2 py-0.5 bg-white text-red-700 font-black text-[10px] sm:text-xs rounded shadow-sm">عاجل</span>
                    <p className="text-white font-bold text-xs sm:text-sm mr-2 break-words leading-relaxed w-full">
                      {text}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: ARCHIVE */}
      {activeTab === "archive" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text"
                placeholder="ابحث في أرشيف الأخبار العاجلة..."
                className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm focus:ring-2 focus:ring-red-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="w-full sm:w-auto py-3 px-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-red-500"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
            >
              <option value="all">جميع الحالات</option>
              <option value="expired">منتهية الصلاحية</option>
              <option value="cancelled">ملغاة يدويًا</option>
            </select>
          </div>
          
          <div className="space-y-3">
            {filteredArchive.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <Archive className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">الأرشيف فارغ أو لا توجد نتائج</h4>
                <p className="text-gray-500 font-bold mb-6">جرب تغيير كلمات البحث أو الفلتر.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArchive.map((item) => {
                  const isCancelled = item.isActive === false;
                  return (
                    <div key={item.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col transition-all hover:shadow-md">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {isCancelled ? (
                            <span className="text-[10px] font-black text-amber-700 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-md border border-amber-200 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> تم الإيقاف
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-gray-600 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md border border-gray-200 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> انتهت المدة
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-gray-400">
                            {new Date(item.createdAt).toLocaleDateString('ar-YE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                          </span>
                        </div>
                        <p className="font-bold text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4 line-clamp-3">
                          {item.text}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700 mt-auto">
                        <button onClick={() => republishItem(item)} className="flex-1 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                          <RotateCcw className="w-4 h-4" /> إعادة نشر
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all" title="حذف نهائي">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
`;

let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');
const replaceRegex = /function AdminUrgentNews\(\) \{[\s\S]*?\n\} \/\/ Simple Admin Components/m;

// wait, the previous regex was modified. Let's find exactly the boundaries.
let match = content.match(/function AdminUrgentNews\(\) \{[\s\S]*?^\}(?=\n\n\/\/ Simple Admin Components|\n\nfunction AdminNews)/m);
if (match) {
  content = content.replace(match[0], componentCode);
  fs.writeFileSync('src/pages/Admin.tsx', content);
  console.log("Successfully replaced");
} else {
  console.log("Failed to match AdminUrgentNews");
}
