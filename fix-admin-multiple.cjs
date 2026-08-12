const fs = require('fs');

const componentCode = `function AdminUrgentNews() {
  interface DraftNews {
    id: string;
    text: string;
    displayType: "static" | "scrolling";
    durationMinutes: number;
    scrollingAfterStaticMinutes: number;
  }

  const defaultDraft = (): DraftNews => ({
    id: Math.random().toString(36).substring(7),
    text: "",
    displayType: "scrolling",
    durationMinutes: 1440,
    scrollingAfterStaticMinutes: 1440
  });

  const [drafts, setDrafts] = useState<DraftNews[]>([defaultDraft()]);
  
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
      } catch (e) {}
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

  const updateDraft = (id: string, updates: Partial<DraftNews>) => {
    setDrafts(drafts.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const addDraft = () => {
    setDrafts([...drafts, defaultDraft()]);
  };

  const removeDraft = (id: string) => {
    if (drafts.length > 1) {
      setDrafts(drafts.filter(d => d.id !== id));
    }
  };

  const saveNews = async () => {
    const validDrafts = drafts.filter(d => d.text.trim());
    if (validDrafts.length === 0) return alert("يرجى إدخال نص الخبر العاجل");
    if (validDrafts.some(d => d.durationMinutes <= 0)) return alert("يرجى إدخال مدة صحيحة لجميع الأخبار");
    
    setSaving(true);
    try {
      const now = Date.now();
      
      const staticDrafts = validDrafts.filter(d => d.displayType === "static");
      if (staticDrafts.length > 0) {
        const currentStatics = urgentItems.filter(i => i.isActive !== false && i.id !== editingId && i.staticExpiresAt > now);
        for (const item of currentStatics) {
          const currentScrollEnd = item.scrollingExpiresAt || item.expiresAt || (now + 1440 * 60000);
          await updateDoc(doc(db, "urgentNews", item.id), { staticExpiresAt: 0, scrollingExpiresAt: currentScrollEnd });
        }
      }

      if (editingId && validDrafts.length === 1) {
        const draft = validDrafts[0];
        let newStaticExpiresAt = 0;
        let newScrollingExpiresAt = 0;
        
        if (draft.displayType === "static") {
          newStaticExpiresAt = now + draft.durationMinutes * 60000;
          newScrollingExpiresAt = newStaticExpiresAt + draft.scrollingAfterStaticMinutes * 60000;
        } else {
          newScrollingExpiresAt = now + draft.durationMinutes * 60000;
        }

        await updateDoc(doc(db, "urgentNews", editingId), {
          text: draft.text,
          staticExpiresAt: newStaticExpiresAt,
          scrollingExpiresAt: newScrollingExpiresAt,
          expiresAt: newScrollingExpiresAt,
          isActive: true
        });
        alert(\`تم تعديل الخبر العاجل بنجاح\`);
        setEditingId(null);
      } else {
        let createdCount = 0;
        for (let i = 0; i < validDrafts.length; i++) {
          const draft = validDrafts[i];
          let newStaticExpiresAt = 0;
          let newScrollingExpiresAt = 0;
          
          if (draft.displayType === "static") {
            newStaticExpiresAt = now + draft.durationMinutes * 60000;
            newScrollingExpiresAt = newStaticExpiresAt + draft.scrollingAfterStaticMinutes * 60000;
          } else {
            newScrollingExpiresAt = now + draft.durationMinutes * 60000;
          }

          // Offset createdAt slightly to preserve exact input order (newest goes first, so we might want to offset negatively so they sort naturally)
          await addDoc(collection(db, "urgentNews"), {
            text: draft.text,
            isActive: true,
            createdAt: now - i, 
            staticExpiresAt: newStaticExpiresAt,
            scrollingExpiresAt: newScrollingExpiresAt,
            expiresAt: newScrollingExpiresAt,
          });
          createdCount++;
        }
        alert(\`تم إضافة \${createdCount} خبر عاجل بنجاح\`);
      }
      
      setDrafts([defaultDraft()]);
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
          staticExpiresAt: 0,
          scrollingExpiresAt: Date.now() + 60 * 60000,
          expiresAt: Date.now() + 60 * 60000
        });
      }
    } catch (e) {
      alert("خطأ في تحديث حالة الخبر العاجل");
    }
  };
  
  const moveToMarquee = async (item: any) => {
    if (!confirm("هل أنت متأكد من إنهاء المدة الثابتة للخبر ونقله للشريط المتحرك فوراً؟")) return;
    try {
      const scrollEnd = item.scrollingExpiresAt || item.expiresAt || (Date.now() + 1440 * 60000);
      await updateDoc(doc(db, "urgentNews", item.id), { 
        staticExpiresAt: 0, 
        scrollingExpiresAt: Math.max(scrollEnd, Date.now() + 60 * 60000) 
      });
    } catch (e) {
      alert("خطأ في النقل");
    }
  };

  const makeStatic = async (item: any) => {
    const mins = prompt("أدخل مدة بقاء الخبر كخبر ثابت (بالدقائق):", "60");
    if (!mins) return;
    const duration = parseInt(mins);
    if (isNaN(duration) || duration <= 0) return;
    
    try {
      const now = Date.now();
      const currentStatics = urgentItems.filter(i => i.isActive !== false && i.id !== item.id && i.staticExpiresAt > now);
      for (const other of currentStatics) {
        const scrollEnd = other.scrollingExpiresAt || other.expiresAt || (now + 1440 * 60000);
        await updateDoc(doc(db, "urgentNews", other.id), { staticExpiresAt: 0, scrollingExpiresAt: scrollEnd });
      }
      
      const newStaticExp = now + duration * 60000;
      const currentScroll = item.scrollingExpiresAt || item.expiresAt || now;
      await updateDoc(doc(db, "urgentNews", item.id), { 
        staticExpiresAt: newStaticExp,
        scrollingExpiresAt: Math.max(currentScroll, newStaticExp + 60 * 60000)
      });
      alert("تم تحويل الخبر إلى ثابت بنجاح");
    } catch(e) {
      alert("خطأ في تحديث الخبر");
    }
  };

  const makeScrolling = async (item: any) => {
    const mins = prompt("أدخل مدة بقاء الخبر في الشريط المتحرك (بالدقائق):", "1440");
    if (!mins) return;
    const duration = parseInt(mins);
    if (isNaN(duration) || duration <= 0) return;
    
    try {
      await updateDoc(doc(db, "urgentNews", item.id), { 
        staticExpiresAt: 0,
        scrollingExpiresAt: Date.now() + duration * 60000,
        expiresAt: Date.now() + duration * 60000
      });
      alert("تم تحويل الخبر إلى متحرك بنجاح");
    } catch(e) {
      alert("خطأ في تحديث الخبر");
    }
  };

  const editItem = (item: any) => {
    setEditingId(item.id);
    const now = Date.now();
    const isStatic = item.staticExpiresAt > now;
    
    let durationMinutes = 1440;
    let scrollingAfterStaticMinutes = 1440;
    
    if (isStatic) {
      durationMinutes = Math.max(0, Math.ceil((item.staticExpiresAt - now) / 60000));
      const scrollEnd = item.scrollingExpiresAt || item.expiresAt || now;
      scrollingAfterStaticMinutes = Math.max(0, Math.ceil((scrollEnd - item.staticExpiresAt) / 60000));
    } else {
      const scrollEnd = item.scrollingExpiresAt || item.expiresAt || now;
      durationMinutes = Math.max(0, Math.ceil((scrollEnd - now) / 60000));
    }
    
    setDrafts([{
      id: "edit",
      text: item.text,
      displayType: isStatic ? "static" : "scrolling",
      durationMinutes,
      scrollingAfterStaticMinutes
    }]);
    
    setActiveTab("add");
  };

  const republishItem = (item: any, type?: "static" | "scrolling") => {
    setEditingId(null);
    setDrafts([{
      id: Math.random().toString(36).substring(7),
      text: item.text,
      displayType: type || "scrolling",
      durationMinutes: type === "static" ? 60 : 1440,
      scrollingAfterStaticMinutes: 1440
    }]);
    setActiveTab("add");
  };

  const cancelAllActiveNews = async () => {
    const activeDocs = urgentItems.filter(i => i.isActive !== false && (i.staticExpiresAt > currentTime || i.scrollingExpiresAt > currentTime));
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

  const normalizeItem = (item: any) => ({
    ...item,
    staticExpiresAt: item.staticExpiresAt !== undefined ? item.staticExpiresAt : (item.expiresAt || 0),
    scrollingExpiresAt: item.scrollingExpiresAt !== undefined ? item.scrollingExpiresAt : (item.expiresAt || 0),
  });

  const normalizedItems = urgentItems.map(normalizeItem);
  const activeDocs = normalizedItems.filter(i => i.isActive !== false && (i.staticExpiresAt > currentTime || i.scrollingExpiresAt > currentTime));
  const staticNews = activeDocs.find(i => i.staticExpiresAt > currentTime); 
  const scrollingDocs = activeDocs.filter(i => i.scrollingExpiresAt > currentTime && i.id !== staticNews?.id);
  
  const filteredArchive = normalizedItems.filter(item => {
    const isExpired = item.staticExpiresAt <= currentTime && item.scrollingExpiresAt <= currentTime;
    const isCancelled = item.isActive === false;
    const isActive = !isExpired && !isCancelled;
    
    const matchesSearch = item.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
                          (filterStatus === "active" && isActive) ||
                          (filterStatus === "expired" && isExpired && !isCancelled) ||
                          (filterStatus === "cancelled" && isCancelled);
                          
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto font-cairo">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <span className="p-2.5 bg-red-100 text-red-600 rounded-xl">
              <Zap className="w-6 h-6" />
            </span>
            نظام الأخبار العاجلة (شريط الأخبار)
          </h2>
          <p className="text-gray-500 mt-2 font-bold text-sm">
            إدارة وتتبع الأخبار العاجلة، الشريط المتحرك، وإعدادات العرض الحية.
          </p>
        </div>
        {activeDocs.length > 0 && (
          <button
            onClick={cancelAllActiveNews}
            className="bg-white hover:bg-red-50 text-red-600 font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 border border-red-200 transition-all shadow-sm"
          >
            <XCircle className="w-4 h-4" />
            <span>إلغاء جميع الأخبار النشطة</span>
          </button>
        )}
      </div>

      {/* Master Tabs */}
      <div className="bg-gray-100/50 p-1.5 rounded-2xl flex flex-wrap gap-1.5 border border-gray-200">
        <button 
          onClick={() => setActiveTab("active")}
          className={\`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all \${activeTab === "active" ? "bg-white text-red-600 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"}\`}
        >
          <Activity className="w-4 h-4" /> النشطة الآن
        </button>
        <button 
          onClick={() => { setActiveTab("add"); setEditingId(null); setDrafts([defaultDraft()]); }}
          className={\`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all \${activeTab === "add" ? "bg-white text-red-600 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"}\`}
        >
          <Plus className="w-4 h-4" /> {editingId ? "تعديل الخبر" : "إضافة خبر"}
        </button>
        <button 
          onClick={() => setActiveTab("archive")}
          className={\`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all \${activeTab === "archive" ? "bg-white text-red-600 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"}\`}
        >
          <Archive className="w-4 h-4" /> الأرشيف الشامل
        </button>
      </div>

      {/* Tab Content: ACTIVE NEWS */}
      {activeTab === "active" && (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            الأخبار الجارية
          </h3>
          
          <div className="space-y-4">
            {activeDocs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-gray-900 mb-2">لا توجد أخبار نشطة</h4>
                <p className="text-gray-500 font-bold mb-6">لم يتم إضافة أي خبر عاجل ليظهر للمستخدمين حالياً.</p>
                <button onClick={() => setActiveTab("add")} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-red-500/20 transition-all">
                  إضافة خبر جديد
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {activeDocs.map((item) => {
                  const isStatic = staticNews?.id === item.id;
                  const isScrolling = !isStatic && item.scrollingExpiresAt > currentTime;
                  const remainingStatic = Math.max(0, Math.ceil((item.staticExpiresAt - currentTime) / 60000));
                  const remainingScrolling = Math.max(0, Math.ceil((item.scrollingExpiresAt - currentTime) / 60000));
                  
                  return (
                    <div key={item.id} className={\`bg-white p-5 rounded-2xl border \${isStatic ? 'border-red-300 shadow-md ring-2 ring-red-50' : 'border-gray-200 shadow-sm'} transition-all\`}>
                      <div className="flex flex-col md:flex-row gap-5 items-start">
                        <div className={\`p-3 rounded-xl shrink-0 flex flex-col items-center justify-center min-w-[80px] \${isStatic ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}\`}>
                          {isStatic ? <AlertTriangle className="w-7 h-7 mb-1" /> : <Activity className="w-7 h-7 mb-1" />}
                          <span className="text-[10px] font-black uppercase tracking-wider">{isStatic ? 'ثابت' : 'متحرك'}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {isStatic && (
                              <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                خبر ثابت حالياً (متبقي {remainingStatic} دقيقة)
                              </span>
                            )}
                            {isScrolling && (
                              <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                في الشريط المتحرك (متبقي {remainingScrolling} دقيقة)
                              </span>
                            )}
                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                              نشر: {new Date(item.createdAt).toLocaleTimeString('ar-YE', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <p className="font-bold text-base md:text-lg text-gray-900 leading-relaxed mt-3">
                            {item.text}
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                          <div className="flex flex-row gap-2">
                            {isStatic ? (
                              <button onClick={() => moveToMarquee(item)} className="flex-1 justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                                <ArrowLeftRight className="w-4 h-4" /> نقل للمتحرك فوراً
                              </button>
                            ) : (
                              <button onClick={() => makeStatic(item)} className="flex-1 justify-center bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                                <AlertTriangle className="w-4 h-4" /> جعله ثابتاً
                              </button>
                            )}
                            {!isScrolling && (
                              <button onClick={() => makeScrolling(item)} className="flex-1 justify-center bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                                <Activity className="w-4 h-4" /> جعله متحركاً
                              </button>
                            )}
                          </div>
                          <div className="flex flex-row gap-2">
                            <button onClick={() => editItem(item)} className="flex-1 justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                              <Edit2 className="w-4 h-4" /> تعديل
                            </button>
                            <button onClick={() => toggleCancelItem(item.id, true)} className="flex-1 justify-center bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                              <XCircle className="w-4 h-4" /> إيقاف
                            </button>
                          </div>
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
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Plus className="w-6 h-6 text-red-600" />
                  {editingId ? "تعديل الخبر العاجل" : "إنشاء أخبار عاجلة"}
                </h3>
                {editingId && (
                  <button onClick={() => { setEditingId(null); setDrafts([defaultDraft()]); }} className="text-gray-500 hover:text-red-600 text-sm font-bold flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <X className="w-4 h-4" /> إلغاء التعديل
                  </button>
                )}
                {!editingId && (
                  <button onClick={addDraft} className="text-red-600 bg-red-50 hover:bg-red-100 text-sm font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors">
                    <Plus className="w-4 h-4" /> إضافة خبر جديد ضمن الدفعة
                  </button>
                )}
              </div>
              
              <div className="space-y-8">
                {drafts.map((draft, idx) => (
                  <div key={draft.id} className="p-5 border border-gray-100 rounded-2xl bg-gray-50/50 space-y-5 relative">
                    {drafts.length > 1 && (
                      <button onClick={() => removeDraft(draft.id)} className="absolute top-4 left-4 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <h4 className="font-bold text-gray-700 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center">{idx + 1}</span>
                      إعدادات الخبر
                    </h4>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">النص الكامل للخبر:</label>
                      <textarea
                        className="w-full p-4 text-base font-bold bg-white border border-gray-200 rounded-xl h-28 focus:ring-2 focus:ring-red-500 transition-all resize-none shadow-sm"
                        placeholder="اكتب هنا الخبر الذي سيظهر للمستخدمين..."
                        value={draft.text}
                        onChange={(e) => updateDraft(draft.id, { text: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">طريقة العرض:</label>
                      <div className="flex gap-4">
                        <label className={\`flex-1 cursor-pointer p-3 rounded-xl border flex items-center gap-2 transition-all \${draft.displayType === 'static' ? 'bg-red-50 border-red-300 ring-1 ring-red-200' : 'bg-white border-gray-200'}\`}>
                          <input 
                            type="radio" 
                            checked={draft.displayType === 'static'}
                            onChange={() => updateDraft(draft.id, { displayType: 'static', durationMinutes: 60 })}
                            className="w-4 h-4 text-red-600"
                          />
                          <div>
                            <div className="font-bold text-gray-900 text-sm">خبر ثابت</div>
                          </div>
                        </label>
                        <label className={\`flex-1 cursor-pointer p-3 rounded-xl border flex items-center gap-2 transition-all \${draft.displayType === 'scrolling' ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-200' : 'bg-white border-gray-200'}\`}>
                          <input 
                            type="radio" 
                            checked={draft.displayType === 'scrolling'}
                            onChange={() => updateDraft(draft.id, { displayType: 'scrolling', durationMinutes: 1440 })}
                            className="w-4 h-4 text-amber-600"
                          />
                          <div>
                            <div className="font-bold text-gray-900 text-sm">خبر متحرك</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" /> 
                        {draft.displayType === 'static' ? 'مدة العرض كخبر ثابت (بالدقائق):' : 'مدة العرض في الشريط المتحرك (بالدقائق):'}
                      </label>
                      <input 
                        type="number"
                        className="w-full p-3 text-base font-bold bg-white border border-gray-200 rounded-xl shadow-sm"
                        value={draft.durationMinutes}
                        onChange={(e) => updateDraft(draft.id, { durationMinutes: Number(e.target.value) })}
                        min={1}
                      />
                    </div>

                    {draft.displayType === 'static' && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" /> 
                          مدة العرض في الشريط المتحرك لاحقاً (بالدقائق):
                        </label>
                        <input 
                          type="number"
                          className="w-full p-3 text-base font-bold bg-white border border-gray-200 rounded-xl shadow-sm"
                          value={draft.scrollingAfterStaticMinutes}
                          onChange={(e) => updateDraft(draft.id, { scrollingAfterStaticMinutes: Number(e.target.value) })}
                          min={0}
                        />
                      </div>
                    )}
                    
                    {!editingId && (
                      <div className="pt-2">
                        <button onClick={addDraft} className="w-full text-center py-3 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 hover:text-red-600 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
                          <Plus className="w-4 h-4" /> إضافة خبر جديد
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                
                <button
                  onClick={saveNews}
                  disabled={saving || drafts.every(d => !d.text.trim())}
                  className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-2 text-lg"
                >
                  {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                  {editingId ? "حفظ التعديلات" : "نشر الأخبار الآن"}
                </button>
              </div>
            </div>
          </div>
          
          {/* Settings & Preview */}
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-gray-500" />
                  إعدادات المظهر والشريط المتحرك
                </h3>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">شارة الشريط المتحرك:</label>
                  <input 
                    type="text"
                    className="w-full p-4 text-base font-bold bg-gray-50 border border-gray-200 rounded-2xl shadow-inner"
                    value={tickerTitle}
                    onChange={(e) => setTickerTitle(e.target.value)}
                    placeholder="مثال: خبر عاجل، بيان هام..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">سرعة الشريط المتحرك (أصغر = أسرع):</label>
                  <input 
                    type="number"
                    className="w-full p-4 text-base font-bold bg-gray-50 border border-gray-200 rounded-2xl shadow-inner"
                    value={tickerSpeed}
                    onChange={(e) => setTickerSpeed(Number(e.target.value))}
                    min={5}
                    max={120}
                  />
                </div>
                
                <button
                  onClick={saveSettings}
                  className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" /> حفظ الإعدادات
                </button>
              </div>
            </div>

            {/* Live Preview snippet */}
            {drafts.some(d => d.text.trim()) && (
              <div className="border border-red-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="bg-red-50 px-4 py-3 text-sm font-black text-red-600 border-b border-red-200 flex items-center justify-between">
                  <span>معاينة حية للأخبار</span>
                  <span className="animate-pulse">🔴</span>
                </div>
                <div className="bg-gray-50 p-4 space-y-2">
                  {drafts.filter(d => d.text.trim()).map((draft, i) => (
                    <div key={draft.id} className={\`w-full \${draft.displayType === 'static' ? 'bg-red-900' : 'bg-amber-900'} rounded-lg py-1.5 px-3 flex items-start shadow-inner\`}>
                      <span className={\`shrink-0 mt-0.5 inline-flex items-center justify-center px-2 py-0.5 bg-white \${draft.displayType === 'static' ? 'text-red-700' : 'text-amber-700'} font-black text-[10px] sm:text-xs rounded shadow-sm\`}>
                        {draft.displayType === 'static' ? 'عاجل' : 'متحرك'}
                      </span>
                      <p className="text-white font-bold text-xs sm:text-sm mr-2 break-words leading-relaxed w-full">
                        {draft.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: ARCHIVE */}
      {activeTab === "archive" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text"
                placeholder="ابحث في أرشيف الأخبار العاجلة..."
                className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-red-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="w-full sm:w-auto py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm text-gray-700 focus:ring-2 focus:ring-red-500"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
            >
              <option value="all">جميع الحالات</option>
              <option value="active">النشطة حالياً</option>
              <option value="expired">منتهية الصلاحية</option>
              <option value="cancelled">ملغاة يدويًا</option>
            </select>
          </div>
          
          <div className="space-y-3">
            {filteredArchive.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Archive className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-gray-900 mb-2">الأرشيف فارغ أو لا توجد نتائج</h4>
                <p className="text-gray-500 font-bold mb-6">جرب تغيير كلمات البحث أو الفلتر.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArchive.map((item) => {
                  const isExpired = item.staticExpiresAt <= currentTime && item.scrollingExpiresAt <= currentTime;
                  const isCancelled = item.isActive === false;
                  const isActive = !isExpired && !isCancelled;
                  const isStatic = isActive && item.staticExpiresAt > currentTime;

                  return (
                    <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col transition-all hover:shadow-md">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {isCancelled ? (
                            <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> تم الإيقاف
                            </span>
                          ) : isExpired ? (
                            <span className="text-[10px] font-black text-gray-600 bg-gray-100 px-2 py-1 rounded-md border border-gray-200 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> انتهت المدة
                            </span>
                          ) : isStatic ? (
                            <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> خبر ثابت
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> خبر متحرك
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-gray-400">
                            {new Date(item.createdAt).toLocaleDateString('ar-YE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                          </span>
                        </div>
                        <p className="font-bold text-sm text-gray-700 leading-relaxed mb-4 line-clamp-3">
                          {item.text}
                        </p>
                      </div>
                      
                      {/* Archive actions - direct republish as static or scrolling */}
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-auto">
                        <button onClick={() => republishItem(item, 'static')} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                          <AlertTriangle className="w-4 h-4" /> كخبر ثابت
                        </button>
                        <button onClick={() => republishItem(item, 'scrolling')} className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                          <Activity className="w-4 h-4" /> كخبر متحرك
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="حذف نهائي">
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
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');
const start = code.indexOf('function AdminUrgentNews() {');
const end = code.indexOf('\n// Simple Admin Components');
if (start > -1 && end > -1) {
  const piece = code.substring(start, end);
  code = code.replace(piece, componentCode);
  fs.writeFileSync('src/pages/Admin.tsx', code);
  console.log("Successfully replaced");
} else {
  console.log("Failed to find start and end");
}
