import { useState, useEffect } from "react";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, deleteDoc, orderBy, query, limit, onSnapshot, writeBatch, setDoc, getDoc } from "firebase/firestore";
import { LogOut, FileText, Video, Radio, Shield, BookOpen, Calendar as CalendarIcon, Trash2, Plus, List, Edit, AlertTriangle, Clock, User, Settings, Heart } from "lucide-react";
import { NewsItem, VideoItem, LiveStream, EventItem, UserProfile, LeaderContent } from "../types";

export function Admin() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("news");
  
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await checkProfile(firebaseUser);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const checkProfile = async (firebaseUser: FirebaseUser) => {
    setLoading(true);
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        setProfile(data);
        // Update last login using setDoc with merge to be more robust
        try {
          await setDoc(userRef, { lastLogin: Date.now() }, { merge: true });
        } catch (updateErr) {
          console.warn("Could not update last login timestamp:", updateErr);
        }
      } else {
        // Create new profile for common user
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "مستخدم",
          photoURL: firebaseUser.photoURL || undefined,
          role: "user",
          createdAt: Date.now(),
          lastLogin: Date.now()
        };
        await setDoc(userRef, newProfile);
        setProfile(newProfile);
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error: any) {
       if (error.code === 'auth/operation-not-allowed') {
         alert("تسجيل الدخول عبر جوجل غير مفعل حالياً. يرجى التواصل مع الإدارة.");
       } else {
         alert("حدث خطأ أثناء تسجيل الدخول: " + error.message);
       }
    }
  };
  const logout = () => signOut(auth);

  if (loading && user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold">جاري التحقق من صلاحيات الدخول...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
         <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
            <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />
         </div>
         <h1 className="text-3xl font-black mb-2 text-gray-900 dark:text-white">مرحباً بك في منصة تعز</h1>
         <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">سجل دخولك عبر حساب جوجل للوصول إلى تفضيلاتك وإدارة حسابك الشخصي.</p>
         
         <button 
           onClick={login} 
           className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white px-8 py-4 rounded-2xl font-bold hover:shadow-lg transition-all flex items-center gap-3 active:scale-95"
         >
           <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" />
           تسجيل الدخول عبر جوجل
         </button>
      </div>
    );
  }

  // If user is logged in but not an admin
  if (profile?.role === 'user') {
    return <UserProfileView user={user} profile={profile} logout={logout} />;
  }

  // Admin View
  return (
    <div className="max-w-6xl mx-auto p-4 pb-12 flex flex-col md:flex-row gap-6 animate-fade-in">
       {/* Admin Sidebar */}
       <div className="w-full md:w-72 shrink-0 flex flex-col gap-2">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm mb-4">
             <div className="flex items-center gap-3 mb-4">
                <img src={user.photoURL || ""} className="w-12 h-12 rounded-full border-2 border-blue-600 p-0.5" alt="" />
                <div className="min-w-0">
                   <div className="font-extrabold truncate text-gray-900 dark:text-white">{user.displayName}</div>
                   <div className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full inline-block">مدير المنصة</div>
                </div>
             </div>
             <div className="text-xs text-gray-400 truncate mb-4">{user.email}</div>
             <button onClick={logout} className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 py-2.5 rounded-xl transition">
               <LogOut className="w-4 h-4" /> تسجيل الخروج
             </button>
          </div>
          
          <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
             {[
               { id: "news", icon: FileText, label: "إدارة الأخبار" },
               { id: "urgent", icon: AlertTriangle, label: "الأخبار العاجلة والمباشرة" },
               { id: "videos", icon: Video, label: "إدارة الفيديوهات" },
               { id: "live", icon: Radio, label: "البث المباشر" },
               { id: "leader", icon: Shield, label: "السيد القائد" },
               { id: "quran", icon: BookOpen, label: "من هدي القرآن" },
               { id: "events", icon: CalendarIcon, label: "المناسبات" }
             ].map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`flex flex-col md:flex-row items-center gap-3 p-3 rounded-xl transition-colors whitespace-nowrap ${activeTab === tab.id ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent dark:border-gray-700"} ${tab.id === 'urgent' && activeTab !== 'urgent' ? 'text-red-500 hover:text-red-600' : ''}`}
               >
                  <tab.icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm md:text-base font-medium">{tab.label}</span>
               </button>
             ))}
          </nav>
       </div>

       {/* Admin Content Area */}
       <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 md:p-6 shadow-sm overflow-hidden min-h-[600px]">
          {activeTab === "news" && <AdminNews />}
          {activeTab === "urgent" && <AdminUrgentNews />}
          {activeTab === "videos" && <AdminVideos />}
          {activeTab === "live" && <AdminLive />}
          {activeTab === "leader" && <AdminLeader />}
          {activeTab === "quran" && <AdminQuran />}
          {activeTab === "events" && <AdminEvents />}
       </div>
    </div>
  );
}

function UserProfileView({ user, profile, logout }: { user: FirebaseUser, profile: UserProfile, logout: () => void }) {
  return (
    <div className="max-w-4xl mx-auto p-4 py-12 animate-fade-in">
       <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-none">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          <div className="px-6 pb-10">
             <div className="relative -mt-16 mb-6 flex justify-between items-end">
                <img src={user.photoURL || ""} className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-lg object-cover bg-gray-100" alt="" />
                <button onClick={logout} className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-600 transition-colors">
                   <LogOut className="w-4 h-4" /> تسجيل الخروج
                </button>
             </div>
             
             <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{profile.displayName}</h2>
                <div className="flex items-center gap-2 mb-6">
                   <span className="text-xs font-bold text-gray-400 dark:text-gray-500">{profile.email}</span>
                   <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                   <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full inline-block">حساب قارئ</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                   <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3 mb-4">
                         <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Settings className="w-5 h-5" />
                         </div>
                         <h3 className="font-bold text-lg">إدارة الحساب</h3>
                      </div>
                      <p className="text-sm text-gray-500 mb-6">يمكنك التحكم في إعدادات خصوصيتك وكيفية ظهور حسابك في التعليقات والتنبيهات.</p>
                      <button className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition opacity-50 cursor-not-allowed">
                         قريباً: تعديل الملف الشخصي
                      </button>
                   </div>
                   
                   <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3 mb-4">
                         <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center text-pink-600 dark:text-pink-400">
                            <Heart className="w-5 h-5" />
                         </div>
                         <h3 className="font-bold text-lg">المفضلة</h3>
                      </div>
                      <p className="text-sm text-gray-500 mb-6">الأخبار والمقالات التي قمت بحفظها للرجوع إليها لاحقاً ستظهر في هذا القسم.</p>
                      <button className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition opacity-50 cursor-not-allowed">
                         لا توجد مفضلات حالياً
                      </button>
                   </div>
                </div>
                
                <div className="mt-12 p-8 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl text-center">
                   <AlertTriangle className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                   <h3 className="font-bold text-gray-400 dark:text-gray-600">منطقة للمديرين فقط</h3>
                   <p className="text-xs text-gray-400 dark:text-gray-600 mt-2 max-w-xs mx-auto">عذراً، هذا الحساب ليس لديه صلاحيات الوصول إلى لوحة الإدارة. يمكنك الاستمتاع بتصفح المنصة من الواجهة العامة.</p>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

function AdminUrgentNews() {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!text) return alert("يرجى إدخال نص الخبر العاجل");
    setSaving(true);
    try {
      await addDoc(collection(db, "urgentNews"), {
        text,
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000 // 1 minute
      });
      alert("تم نشر الخبر العاجل بنجاح (سيختفي تلقائياً بعد دقيقة)");
      setText("");
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء النشر");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3 border-b dark:border-gray-700 pb-3">
         <AlertTriangle className="w-6 h-6 text-red-600" />
         <h2 className="text-xl font-bold text-red-600">نظام الأخبار العاجلة والمباشرة</h2>
      </div>

      <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/30">
        <h3 className="font-bold text-red-800 dark:text-red-400 mb-2">تعليمات هامة:</h3>
        <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1 font-medium">
          <li>سيظهر هذا الخبر بشكل فوري وتلقائي في جميع أقسام المنصة.</li>
          <li>سيختفي الخبر تلقائياً بعد مرور <strong>دقيقة واحدة</strong> فقط.</li>
          <li>نشر خبر جديد سيستبدل على الفور أي خبر عاجل سابق.</li>
          <li>سيتم إرسال إشعار للمتصفحين وإصدار تنبيه صوتي.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <label className="block font-bold">نص الخبر العاجل:</label>
        <textarea 
          className="w-full p-4 text-xl font-bold bg-white dark:bg-gray-800 border-2 border-red-200 dark:border-red-800 rounded-xl h-32 focus:outline-none focus:border-red-500" 
          placeholder="أدخل الخبر العاجل هنا..." 
          value={text} 
          onChange={e => setText(e.target.value)} 
        />
        
        <button 
          onClick={save} 
          disabled={saving || !text} 
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold px-8 py-4 rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 text-lg"
        >
           {saving ? "جاري النشر..." : "نشر كخبر عاجل الآن"}
        </button>
      </div>
    </div>
  );
}

// Simple Admin Components

function AdminNews() {
  const [newsMode, setNewsMode] = useState<"add" | "list" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Fields
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [additionalImagesText, setAdditionalImagesText] = useState("");
  const [cat, setCat] = useState("محلية");
  const [customCat, setCustomCat] = useState("");
  const [isBreaking, setIsBreaking] = useState(false);
  const [liveUpdatesText, setLiveUpdatesText] = useState("");
  
  const [saving, setSaving] = useState(false);
  
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // formatting helper
  const insertText = (before: string, after: string) => {
    const textarea = document.getElementById("content-textarea") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = before + selectedText + after;
    setContent(content.substring(0, start) + replacement + content.substring(end));
    // Focus and restore selection in a real app, simplified here
  };

  const fetchNewsList = async () => {
    setLoadingList(true);
    try {
      const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setNewsList(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NewsItem)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (newsMode === "list") {
      fetchNewsList();
    }
  }, [newsMode]);

  const parseLiveUpdates = (text: string) => {
    if (!text.trim()) return [];
    return text.split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((line, idx) => {
        const parts = line.split("|");
        const utext = parts[0]?.trim() || "";
        const utimeString = parts[1]?.trim() || "";
        const uimage = parts[2]?.trim() || undefined;
        
        // If time is provided use it, otherwise use current timestamp
        let updateTime: string | number = Date.now();
        if (utimeString) {
          updateTime = utimeString;
        }

        const updateObj: any = {
          id: `${Date.now()}-${idx}-${Math.random()}`,
          text: utext,
          time: updateTime,
          timestamp: Date.now()
        };
        if (uimage) {
          updateObj.imageUrl = uimage;
        }
        return updateObj;
      });
  };

  const resetForm = () => {
    setTitle("");
    setShortDesc("");
    setContent("");
    setAuthor("");
    setImageUrl("");
    setAdditionalImagesText("");
    setCat("محلية");
    setCustomCat("");
    setIsBreaking(false);
    setLiveUpdatesText("");
    setEditingId(null);
  };

  const handleEditClick = (item: NewsItem) => {
    setTitle(item.title || "");
    setShortDesc(item.shortDescription || "");
    setContent(item.content || "");
    setAuthor(item.author || "");
    setImageUrl(item.imageUrl || "");
    if (item.additionalImages) {
      setAdditionalImagesText(item.additionalImages.join("\n"));
    } else {
      setAdditionalImagesText("");
    }
    
    // Check if category is standard or custom
    const standardCats = ["محلية", "تعبئة عامة", "اجتماعية", "أنشطة وزيارات", "مشاريع", "مقال"];
    if (standardCats.includes(item.category || "")) {
      setCat(item.category || "محلية");
      setCustomCat("");
    } else {
      setCat("custom");
      setCustomCat(item.category || "");
    }
    
    setIsBreaking(!!item.isBreaking);
    
    if (item.liveUpdates && Array.isArray(item.liveUpdates)) {
      setLiveUpdatesText(item.liveUpdates.map(u => {
        let line = `${u.text}`;
        if (u.time) line += ` | ${u.time}`;
        if (u.imageUrl) line += ` | ${u.imageUrl}`;
        return line;
      }).join("\n"));
    } else {
      setLiveUpdatesText("");
    }
    
    setEditingId(item.id);
    setNewsMode("edit");
  };

  const save = async () => {
    if (!title || !content) return alert("يرجى تعبئة الحقول الأساسية (العنوان والمحتوى)");
    const finalCat = cat === "custom" ? customCat : cat;
    if (!finalCat) return alert("يرجى إدخال تصنيف الخبر");
    
    setSaving(true);
    const parsedUpdates = parseLiveUpdates(liveUpdatesText);
    
    // Auto-generate snippet if empty
    let finalSnippet = shortDesc.trim();
    if (!finalSnippet) {
      const strippedContent = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
      finalSnippet = strippedContent.substring(0, 150) + (strippedContent.length > 150 ? "..." : "");
    }

    const additionalImages = additionalImagesText.split("\n").map(l => l.trim()).filter(l => l.length > 0);

    const payload: any = {
      title,
      content,
      shortDescription: finalSnippet,
      author: author || null,
      imageUrl: imageUrl || null,
      additionalImages: additionalImages || null,
      category: finalCat,
      isBreaking,
      liveUpdates: parsedUpdates || null,
      updatedAt: Date.now()
    };
    
    try {
      if (newsMode === "edit" && editingId) {
        await updateDoc(doc(db, "news", editingId), payload);
        alert("تم تعديل الخبر بنجاح!");
      } else {
        await addDoc(collection(db, "news"), {
          ...payload,
          createdAt: Date.now()
        });
        alert("تم إضافة الخبر بنجاح!");
      }
      resetForm();
      setNewsMode("list");
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء الحفظ!");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (newsId: string) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا الخبر نهائياً؟")) return;
    try {
      await deleteDoc(doc(db, "news", newsId));
      setNewsList(prev => prev.filter(item => item.id !== newsId));
      alert("تم حذف الخبر بنجاح");
    } catch (e) {
      console.error(e);
      alert("فشل في حذف الخبر");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b dark:border-gray-700 pb-3 gap-4">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة الأخبار</h2>
         <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1 w-full sm:w-auto">
            <button 
              onClick={() => setNewsMode("list")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-sm font-bold transition-all ${newsMode === "list" ? "bg-white dark:bg-gray-800 text-blue-600 shadow" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"}`}
            >
               <List className="w-4 h-4" />
               القائمة ({newsList.length})
            </button>
            <button 
              onClick={() => { resetForm(); setNewsMode("add"); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-sm font-bold transition-all ${newsMode === "add" ? "bg-white dark:bg-gray-800 text-blue-600 shadow" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"}`}
            >
               <Plus className="w-4 h-4" />
               إضافة خبر
            </button>
         </div>
      </div>

      {newsMode === "add" || newsMode === "edit" ? (
        <div className="space-y-6 bg-gray-50/50 dark:bg-gray-900/20 p-4 sm:p-8 rounded-2xl border border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-extrabold text-blue-600 dark:text-amber-400 mb-6">
            {newsMode === "edit" ? "تعديل الخبر المشهور" : "إنشاء خبر جديد"}
          </h3>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">عنوان الخبر الأساسي *</label>
              <input className="w-full p-3 text-lg font-bold bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl focus:outline-blue-500" placeholder="اكتب العنوان هنا..." value={title} onChange={e=>setTitle(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">مقتطف مختصر (اختياري)</label>
              <p className="text-xs text-gray-500 mb-2">سيتم استخراجه تلقائياً من النص إذا تُرك فارغاً.</p>
              <textarea className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl h-20 focus:outline-blue-500" placeholder="وصف قصير للخبر يظهر في القوائم..." value={shortDesc} onChange={e=>setShortDesc(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">محتوى الخبر الكامل *</label>
              <div className="flex flex-wrap items-center gap-2 mb-2 p-2 bg-gray-200 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
                 <button onClick={() => insertText("<b>", "</b>")} className="px-3 py-1 bg-white dark:bg-gray-700 rounded shadow-sm text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-600">عريض (Bold)</button>
                 <button onClick={() => insertText("<i>", "</i>")} className="px-3 py-1 bg-white dark:bg-gray-700 rounded shadow-sm text-sm italic hover:bg-gray-50 dark:hover:bg-gray-600">مائل (Italic)</button>
                 <button onClick={() => insertText("<mark>", "</mark>")} className="px-3 py-1 bg-white dark:bg-gray-700 rounded shadow-sm text-sm bg-yellow-200 dark:bg-yellow-900/30 hover:bg-yellow-300 dark:hover:bg-yellow-800">تمييز بخلفية ملونة</button>
                 <button onClick={() => insertText("<br/>", "")} className="px-3 py-1 bg-white dark:bg-gray-700 rounded shadow-sm text-sm hover:bg-gray-50 dark:hover:bg-gray-600">سطر جديد</button>
              </div>
              <textarea id="content-textarea" className="w-full p-4 text-base font-medium leading-loose bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl h-64 focus:outline-blue-500" placeholder="المحتوى الكامل للمقال..." value={content} onChange={e=>setContent(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">اسم الكاتب / المحرر</label>
                <input className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl focus:outline-blue-500" placeholder="مثال: أحمد محمد (اختياري)" value={author} onChange={e=>setAuthor(e.target.value)} />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">تصنيف الخبر *</label>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl focus:outline-blue-500 font-bold" 
                    value={cat} 
                    onChange={e=>setCat(e.target.value)}
                  >
                     {["محلية", "تعبئة عامة", "اجتماعية", "أنشطة وزيارات", "مشاريع", "مقال"].map(c => <option key={c} value={c}>{c}</option>)}
                     <option value="custom">تصنيف مخصص (أخرى)...</option>
                  </select>
                  {cat === "custom" && (
                    <input 
                      className="flex-1 p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl focus:outline-blue-500" 
                      placeholder="اكتب التصنيف هنا..." 
                      value={customCat} 
                      onChange={e=>setCustomCat(e.target.value)} 
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="border border-blue-100 dark:border-blue-900/30 p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10">
               <h4 className="font-extrabold text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">الصور والميديا</h4>
               <p className="text-xs text-blue-600 dark:text-blue-300 mb-4 bg-white dark:bg-gray-800 p-2 rounded-lg border border-blue-100 dark:border-blue-800">
                  لرفع الصور يرجى زيارة موقع <a href="https://postimages.org/" target="_blank" rel="noopener noreferrer" className="font-bold underline text-blue-700 dark:text-amber-400">postimages.org</a>، قم برفع الصور، ثم انسخ "الرابط المباشر" (Direct Link) والصقه هنا.
               </p>
               
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">الصورة الرئيسية (غلاف الخبر)</label>
                   <input className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl focus:outline-blue-500" placeholder="https://i.postimg.cc/..." value={imageUrl} onChange={e=>setImageUrl(e.target.value)} />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">صور إضافية (معرض الصور)</label>
                   <textarea 
                     className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl h-24 focus:outline-blue-500 text-sm" 
                     placeholder="رابط الصورة 1&#10;رابط الصورة 2..." 
                     value={additionalImagesText} 
                     onChange={e=>setAdditionalImagesText(e.target.value)} 
                   />
                 </div>
               </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl cursor-pointer" onClick={() => setIsBreaking(!isBreaking)}>
               <input type="checkbox" checked={isBreaking} onChange={e=>setIsBreaking(e.target.checked)} className="w-5 h-5 text-red-600 rounded" />
               <span className="font-bold text-lg text-red-600 dark:text-red-500">تمكين التغطية المباشرة (تثبيت أعلى الصفحة وتسليط الضوء)</span>
            </div>
            
            {isBreaking && (
              <div className="space-y-2 mt-4 border border-red-200 dark:border-red-800 p-4 rounded-xl">
                <label className="block text-sm font-bold text-red-600 dark:text-red-400 mb-2">إضافة تحديثات للتغطية المباشرة (اختياري)</label>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 space-y-1">
                   <p>اكتب كل تحديث في سطر منفصل.</p>
                   <p>لإدراج وقت محدد أو صورة، استخدم الفاصل الزمني <code>|</code>.</p>
                   <p className="font-mono bg-gray-100 dark:bg-gray-700 p-1 rounded inline-block">تحديث النص | 10:30 صباحاً | رابط الصورة</p>
                </div>
                <textarea 
                  className="w-full p-3 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-xl h-32 focus:outline-red-500 text-sm leading-relaxed" 
                  placeholder="تصريح هام ومباشر من المتحدث... | 11:00 صباحاً | https://i.postimg.cc/image1.jpg&#10;وصول التعزيزات إلى المواقع الأمامية" 
                  value={liveUpdatesText} 
                  onChange={e=>setLiveUpdatesText(e.target.value)} 
                />
              </div>
            )}

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={save} 
                disabled={saving} 
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-extrabold text-lg px-8 py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                 {saving ? "جاري الحفظ..." : newsMode === "edit" ? "تحديث التعديلات" : "نشر الخبر رسمياً"}
              </button>
              <button 
                onClick={() => { resetForm(); setNewsMode("list"); }} 
                className="w-full sm:w-auto bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-bold px-8 py-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              >
                 إلغاء والعودة
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {loadingList ? (
            <div className="text-center py-10 text-gray-500 font-bold">جاري جلب قائمة الأخبار ...</div>
          ) : newsList.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/40 rounded-2xl text-gray-400">
               <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
               <p className="font-bold text-lg">لا توجد أخبار مضافة حالياً</p>
               <p className="text-sm mt-2 opacity-70">قم بإضافة الخبر الأول عبر الضغط على (إضافة خبر).</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
               {newsList.map((item) => (
                 <div key={item.id} className="flex flex-col sm:flex-row gap-4 p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:shadow-md transition-shadow">
                    {item.imageUrl ? (
                      <div className="w-full sm:w-[160px] h-[120px] rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-700 border border-gray-50 dark:border-gray-700">
                         <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full sm:w-[160px] h-[120px] rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 shrink-0">
                         <FileText className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                       <div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                             <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-sm ${item.isBreaking ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                                {item.isBreaking ? 'تغطية عاجلة ومباشرة' : item.category}
                             </span>
                             <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                                {new Date(item.createdAt).toLocaleDateString('ar-YE', { day: 'numeric', month: 'short', year: 'numeric' })}
                             </span>
                             {item.author && (
                               <span className="text-xs font-bold text-blue-600 dark:text-amber-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-sm">
                                  {item.author}
                               </span>
                             )}
                          </div>
                          
                          <h4 className="font-extrabold text-lg text-gray-900 dark:text-white leading-tight mb-2">
                             {item.title}
                          </h4>
                          
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium line-clamp-2 leading-relaxed">
                            {item.shortDescription}
                          </p>
                       </div>
                       
                       <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
                          <button 
                            onClick={() => handleEditClick(item)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-blue-900/30 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" /> تعديل الخبر
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" /> حذف
                          </button>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminVideos() {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [thumb, setThumb] = useState("");
  const [saving, setSaving] = useState(false);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() } as VideoItem)));
    }, (error) => console.error("Error fetching admin videos:", error));
    return () => unsub();
  }, []);

  const save = async () => {
    if(!title || !url) return alert("بيانات ناقصة");
    setSaving(true);
    try {
      if (editingId) {
         await updateDoc(doc(db, "videos", editingId), {
            title, url, thumbnailUrl: thumb
         });
         alert("تم تعديل الفيديو بنجاح");
      } else {
         await addDoc(collection(db, "videos"), {
            title, url, thumbnailUrl: thumb, views: 0, createdAt: Date.now()
         });
         alert("تم إضافة الفيديو بنجاح"); 
      }
      setTitle(""); setUrl(""); setThumb(""); setEditingId(null);
    } catch(e) { console.error(e); alert("حدث خطأ"); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "videos", id));
      alert("تم حذف الفيديو بنجاح");
      setDeletingId(null);
    } catch(error) {
      console.error(error);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const handleEdit = (video: VideoItem) => {
    setTitle(video.title);
    setUrl(video.url);
    setThumb(video.thumbnailUrl || "");
    setEditingId(video.id);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold text-[#111827] dark:text-white flex items-center gap-2"><Video className="w-5 h-5 text-red-600"/> {editingId ? "تعديل فيديو" : "إضافة فيديو"}</h2>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-lg text-sm border border-blue-100 dark:border-blue-900">
           <strong className="block mb-1 text-blue-800 dark:text-blue-200">تعليمات هامة:</strong>
           لرفع الفيديو، يرجى زيارة موقع <a href="https://catbox.moe" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-blue-500 transition-colors">Catbox</a>، ثم رفع ملف الفيديو ونسخ الرابط المباشر (Direct Link) ولصقه في الحقل المخصص داخل النظام.
        </div>
        
        <input className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50" placeholder="العنوان" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50" placeholder="رابط الفيديو (YouTube, MP4...)" value={url} onChange={e=>setUrl(e.target.value)} />
        <input className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50" placeholder="رابط الصورة المصغرة (اختياري)" value={thumb} onChange={e=>setThumb(e.target.value)} />
        <div className="flex gap-3">
          <button onClick={save} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg transition-colors font-bold w-full sm:w-auto">
            {saving ? "جاري الحفظ..." : (editingId ? "حفظ التعديلات" : "حفظ الفيديو")}
          </button>
          {editingId && (
            <button onClick={() => {setTitle(""); setUrl(""); setThumb(""); setEditingId(null);}} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-2.5 rounded-lg font-bold">
               إلغاء التعديل
            </button>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4 text-[#111827] dark:text-white flex items-center gap-2"><List className="w-5 h-5 text-gray-500"/> الفيديوهات المضافة</h3>
        <div className="space-y-3">
          {videos.map(video => (
            <div key={video.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex gap-4 items-center">
                {video.thumbnailUrl ? (
                   <img src={video.thumbnailUrl} alt="" className="w-16 h-12 object-cover rounded-md bg-gray-100 dark:bg-gray-900" />
                ) : (
                   <div className="w-16 h-12 bg-gray-100 dark:bg-gray-900 rounded-md flex items-center justify-center">
                     <Video className="w-6 h-6 text-gray-400" />
                   </div>
                )}
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-[#111827] dark:text-white line-clamp-1">{video.title}</span>
                  <div className="text-xs text-gray-500 flex gap-2">
                    <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{video.views || 0} مشاهدة</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {deletingId === video.id ? (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-1.5 rounded-lg">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 px-2">تأكيد الحذف؟</span>
                    <button onClick={() => handleDelete(video.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors">نعم</button>
                    <button onClick={() => setDeletingId(null)} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded text-sm font-bold transition-colors">لا</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => handleEdit(video)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium">
                      <Edit className="w-4 h-4"/> تعديل
                    </button>
                    <button 
                      onClick={() => setDeletingId(video.id)}
                      className="text-red-500 hover:text-red-700 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 font-bold text-sm transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4"/> حذف
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {videos.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">لا توجد فيديوهات مضافة بعد.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminLive() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "livestreams"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setStreams(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveStream)));
    }, (error) => console.error("Error fetching livestreams on admin:", error));
    return () => unsub();
  }, []);

  const save = async () => {
     if(!name || !url) return alert("الرجاء إدخال اسم القناة ورابط البث");
     setSaving(true);
     try {
        // Transform YouTube URL to embed format if needed
        let finalUrl = url;
        if (url.includes("youtube.com/watch?v=") || url.includes("youtu.be/") || url.includes("youtube.com/live/")) {
          const videoIdMatch = url.match(/(?:v=|youtu\.be\/|live\/)([a-zA-Z0-9_-]{11})/);
          if (videoIdMatch && videoIdMatch[1]) {
            finalUrl = `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1&mute=1`;
          }
        } else if (url.includes("/w/") || url.includes("/videos/watch/")) {
          // Handle PeerTube instances like meyon.com.ye
          finalUrl = url.replace("/w/", "/videos/embed/").replace("/videos/watch/", "/videos/embed/");
        }

        const payload = { name, url: finalUrl, iconUrl, isActive: active, updatedAt: Date.now() };
        if (editingId) {
          await updateDoc(doc(db, "livestreams", editingId), payload);
          alert("تم تعديل البث بنجاح");
        } else {
          await addDoc(collection(db, "livestreams"), { ...payload, createdAt: Date.now() });
          alert("تم إضافة البث بنجاح");
        }
        
        // Reset form
        setName(""); setUrl(""); setIconUrl(""); setActive(true); setEditingId(null);
     } catch(e) { console.error(e); alert("حدث خطأ"); } finally { setSaving(false); }
  };

  const handleEdit = (stream: LiveStream) => {
    setName(stream.name || "");
    setUrl(stream.url || "");
    setIconUrl(stream.iconUrl || "");
    setActive(stream.isActive);
    setEditingId(stream.id || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "livestreams", id));
      alert("تم حذف البث بنجاح");
      setDeletingId(null);
    } catch(err) {
      console.error(err);
      alert("خطأ أثناء الحذف");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold text-[#111827] dark:text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-600"/> 
          {editingId ? "تعديل بث مباشر" : "إضافة بث مباشر جديد"}
        </h2>
        <input className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50" placeholder="اسم القناة" value={name} onChange={e=>setName(e.target.value)} />
        <input className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50" placeholder="رابط البث (YouTube, M3U8, أو iFrame)" value={url} onChange={e=>setUrl(e.target.value)} />
        <p className="text-[10px] text-gray-400 -mt-2 pr-1">يمكنك وضع رابط يوتيوب مباشر أو رابط تضمين (Embed) أو رابط M3U8.</p>
        <input className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50" placeholder="رابط أيقونة القناة (صورة مربعة - رمي رابط الصورة هنا)" value={iconUrl} onChange={e=>setIconUrl(e.target.value)} />
        
        <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-fit">
           <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} className="w-5 h-5 accent-red-600 rounded" />
           <span className="font-bold text-gray-800 dark:text-gray-200 select-none">القناة مفعلة حالياً وتظهر للزوار</span>
        </label>
        
        <div className="flex flex-wrap gap-3 pt-2">
           <button onClick={save} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white px-8 py-2.5 rounded-lg transition-colors font-bold shrink-0">
             {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة البث المباشر"}
           </button>
           {editingId && (
             <button onClick={() => { setName(""); setUrl(""); setIconUrl(""); setActive(true); setEditingId(null); }} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-black dark:text-white px-8 py-2.5 rounded-lg font-bold shrink-0 transition-colors">
               إلغاء التعديل
             </button>
           )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4 text-[#111827] dark:text-white flex items-center gap-2"><List className="w-5 h-5 text-gray-500"/> القنوات المضافة في النظام</h3>
        <div className="space-y-3">
          {streams.map(stream => (
            <div key={stream.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:border-gray-300 dark:hover:border-gray-600">
               <div className="flex items-center gap-4">
                 {stream.iconUrl ? (
                   <img src={stream.iconUrl} alt={stream.name} className="w-12 h-12 rounded object-cover bg-white shadow-sm border border-gray-100 dark:border-gray-700" />
                 ) : (
                   <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 font-bold text-sm shadow-inner hidden sm:flex">
                     <Radio className="w-6 h-6 opacity-50" />
                   </div>
                 )}
                 <div>
                   <h4 className="font-bold text-[#111827] dark:text-white">{stream.name}</h4>
                   <span className={`text-[11px] font-bold px-2 py-0.5 rounded-sm mt-1.5 inline-block ${stream.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400"}`}>
                     {stream.isActive ? "مفعل (يظهر للزوار)" : "معطل (مخفي)"}
                   </span>
                 </div>
               </div>
               <div className="flex flex-wrap items-center gap-2 shrink-0">
                 <button onClick={() => handleEdit(stream)} className="text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-1">
                   <Edit className="w-4 h-4" /> تعديل
                 </button>

                 {deletingId === stream.id ? (
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-1.5 rounded-lg border border-red-100 dark:border-red-900/30">
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 px-1">تأكيد؟</span>
                      <button onClick={() => handleDelete(stream.id!)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors">نعم</button>
                      <button onClick={() => setDeletingId(null)} className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 px-3 py-1.5 rounded text-sm font-bold transition-colors">لا</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeletingId(stream.id!)} className="text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-1">
                      <Trash2 className="w-4 h-4"/> حذف
                    </button>
                 )}
               </div>
            </div>
          ))}
          {streams.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">لا توجد قنوات بث مضافة في النظام.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminLeader() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"video" | "text">("video");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [leaderContents, setLeaderContents] = useState<LeaderContent[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "leader"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setLeaderContents(snap.docs.map(d => ({ id: d.id, ...d.data() } as LeaderContent)));
    }, (error) => console.error("Error fetching leader content:", error));
    return () => unsub();
  }, []);

  const quickFix = () => {
    setTitle("كلمة السيد القائد حول آخر التطورات - الخميس 18 يونيو 2026م");
    setType("video");
    setContent("https://almasirah.net.ye/video?id=297027");
  };

  const save = async () => {
    if(!title || !content) return alert("يرجى تعبئة جميع الحقول");
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "leader", editingId), { title, type, content });
        alert("تم التعديل بنجاح!"); 
      } else {
        await addDoc(collection(db, "leader"), { 
          title, 
          type, 
          content,
          views: 0,
          createdAt: Date.now() 
        });
        alert("تمت الإضافة بنجاح!"); 
      }
      resetForm();
    } catch(e) { 
      console.error(e); 
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };
  
  const resetForm = () => {
    setTitle(""); 
    setContent("");
    setType("video");
    setEditingId(null);
  }
  
  const handleEdit = (item: LeaderContent) => {
    setTitle(item.title);
    setContent(item.content);
    setType(item.type);
    setEditingId(item.id);
  };
  
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "leader", id));
      alert("تم الحذف بنجاح");
      setDeletingId(null);
    } catch (e) {
      console.error(e);
      alert("خطأ في الحذف");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between border-b dark:border-gray-700 pb-3">
         <h2 className="text-xl font-bold">{editingId ? "تعديل محتوى السيد القائد" : "إضافة محتوى السيد القائد"}</h2>
         <button 
           onClick={quickFix}
           className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1.5 rounded-full font-bold hover:bg-emerald-200 transition"
         >
           تحميل بيانات الرابط المرسل (297027)
         </button>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2">العنوان:</label>
          <input 
            className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl focus:outline-blue-500" 
            placeholder="مثال: كلمة السيد القائد حول آخر التطورات" 
            value={title} 
            onChange={e=>setTitle(e.target.value)} 
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">النوع:</label>
          <select 
            className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl focus:outline-blue-500" 
            value={type} 
            onChange={e=>setType(e.target.value as "video" | "text")}
          >
             <option value="text">نص (مقال / درس)</option>
             <option value="video">فيديو (YouTube / Al-Masirah)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">{type === 'text' ? "المحتوى:" : "رابط الفيديو:"}</label>
          <textarea 
            className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl h-32 focus:outline-blue-500" 
            placeholder={type === 'text' ? "اكتب المحتوى هنا..." : "ضع رابط الفيديو هنا (almasirah.net.ye/video?id=...)"} 
            value={content} 
            onChange={e=>setContent(e.target.value)} 
          />
          {type === 'video' && content.includes('almasirah.net.ye') && (
            <p className="text-[11px] text-emerald-600 mt-2 font-medium">سيتم تحويل الرابط تلقائياً إلى مشغل الفيديو عند العرض.</p>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <button 
            onClick={save} 
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {saving ? "جاري الحفظ..." : (editingId ? "حفظ التعديلات" : "إضافة المحتوى الآن")}
          </button>
          {editingId && (
            <button onClick={resetForm} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-2.5 rounded-xl font-bold">
               إلغاء
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><List className="w-5 h-5 text-gray-500"/> المحتوى المضاف</h3>
        <div className="space-y-3">
          {leaderContents.map(item => (
            <div key={item.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[#111827] dark:text-white line-clamp-1">{item.title}</span>
                <div className="text-xs text-gray-500 flex gap-2">
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{item.type === 'video' ? 'فيديو' : 'مقال/نص'}</span>
                  <span>•</span>
                  <span>{item.views || 0} مشاهدة</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {deletingId === item.id ? (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-1.5 rounded-lg">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 px-2">تأكيد الحذف؟</span>
                    <button onClick={() => handleDelete(item.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors">نعم</button>
                    <button onClick={() => setDeletingId(null)} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded text-sm font-bold transition-colors">لا</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium">
                      <Edit className="w-4 h-4"/> تعديل
                    </button>
                    <button 
                      onClick={() => setDeletingId(item.id)}
                      className="text-red-500 hover:text-red-700 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 font-bold text-sm transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4"/> حذف
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {leaderContents.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">لا يوجد محتوى مضاف بعد.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminQuran() {
  const [link, setLink] = useState("");
  const [active, setActive] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const d = await getDoc(doc(db, "settings", "quran"));
      if (d.exists()) {
        const data = d.data();
        setLink(data.link || "");
        setActive(data.isActive || false);
      }
    };
    fetch();
  }, []);

  const save = async () => {
     try {
        await setDoc(doc(db, "settings", "quran"), { link, isActive: active });
        alert("تم الحفظ بنجاح");
     } catch(e) { console.error(e); alert("حدث خطأ أثناء الحفظ"); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2 border-b dark:border-gray-700 pb-3">
         <BookOpen className="w-5 h-5 text-emerald-600" />
         <h2 className="text-xl font-bold">إعدادات قسم القرآن</h2>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-5 rounded-2xl border border-blue-100 dark:border-blue-900 text-sm leading-relaxed">
         <strong className="block mb-2 text-blue-800 dark:text-blue-200 text-base">تحويل تطبيق الأندرويد إلى رابط:</strong>
         إذا كان لديك تطبيق "من هدي القرآن" بصيغة APK، يمكنك رفعه على <a href="https://catbox.moe" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-blue-500">موقع Catbox</a>، ثم نسخ "الرابط المباشر" ووضعه في الحقل أدناه ليتمكن المستخدمون من تحميل التطبيق مباشرة من موقعك.
      </div>

      <div className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
         <div>
            <label className="block text-sm font-bold mb-2">رابط التطبيق أو المادة:</label>
            <input 
               className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-emerald-500" 
               placeholder="قم بلصق رابط الـ APK أو الموقع هنا" 
               value={link} 
               onChange={e=>setLink(e.target.value)} 
            />
         </div>

         <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl cursor-pointer border border-gray-100 dark:border-gray-800 hover:border-emerald-500/50 transition-colors">
            <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} className="w-5 h-5 accent-emerald-600 rounded" />
            <span className="font-bold text-gray-700 dark:text-gray-200">تفعيل القسم وعرضه للمستخدمين</span>
         </label>

         <button 
            onClick={save} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
         >
            حفظ الإعدادات
         </button>
      </div>
    </div>
  );
}

function AdminEvents() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dayName, setDayName] = useState("");
  const [hijriDate, setHijriDate] = useState("");
  const [gregorianDate, setGregorianDate] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [category, setCategory] = useState<"religious" | "national" | "historical" | "all">("all");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "events"), orderBy("timestamp", "asc")), (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as EventItem)));
    });
    return unsub;
  }, []);

  const save = async () => {
    if (!title || !timestamp) return alert("يرجى إدخال العنوان والتاريخ");
    setSaving(true);
    const data = {
      title,
      description,
      dayName,
      hijriDate,
      gregorianDate,
      timestamp: new Date(timestamp).getTime(),
      category,
      type: category // for compatibility
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "events", editingId), data);
        alert("تم التعديل");
      } else {
        await addDoc(collection(db, "events"), data);
        alert("تمت الإضافة");
      }
      reset();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setDayName("");
    setHijriDate("");
    setGregorianDate("");
    setTimestamp("");
    setCategory("all");
  };

  const edit = (e: EventItem) => {
    setEditingId(e.id);
    setTitle(e.title);
    setDescription(e.description || "");
    setDayName(e.dayName);
    setHijriDate(e.hijriDate);
    setGregorianDate(e.gregorianDate);
    setCategory(e.category);
    setTimestamp(new Date(e.timestamp).toISOString().split('T')[0] + 'T00:00');
  };

  const remove = async (id: string) => {
    if (confirm("هل أنت متأكد من الحذف؟")) {
      await deleteDoc(doc(db, "events", id));
    }
  };

  const seed = async () => {
    if (!confirm("سيتم إضافة 24 مناسبة أساسية إلى النظام. هل تستمر؟")) return;
    setSaving(true);
    const basicEvents = [
      { title: "ذكرى الهجرة النبوية", day: "الثلاثاء", hijri: "1 محرم", greg: "16 يونيو", month: 6, dayNum: 16, cat: "religious" },
      { title: "عاشوراء (استشهاد الإمام الحسين)", day: "الخميس", hijri: "10 محرم", greg: "25 يونيو", month: 6, dayNum: 25, cat: "religious" },
      { title: "ذكرى استشهاد الإمام زيد عليه السلام", day: "الجمعة", hijri: "25 محرم", greg: "10 يوليو", month: 7, dayNum: 10, cat: "religious" },
      { title: "قدوم الإمام الهادي إلى اليمن", day: "الإثنين", hijri: "6 صفر", greg: "20 يوليو", month: 7, dayNum: 20, cat: "religious" },
      { title: "المولد النبوي الشريف", day: "الثلاثاء", hijri: "12 ربيع الأول", greg: "25 أغسطس", month: 8, dayNum: 25, cat: "religious" },
      { title: "ذكرى مجزرة القاعة الكبرى", day: "الثلاثاء", hijri: "28 صفر", greg: "11 سبتمبر", month: 9, dayNum: 11, cat: "historical" },
      { title: "ثورة 21 سبتمبر", day: "الإثنين", hijri: "10 ربيع الثاني", greg: "21 سبتمبر", month: 9, dayNum: 21, cat: "national" },
      { title: "ثورة 26 سبتمبر", day: "السبت", hijri: "15 ربيع الثاني", greg: "26 سبتمبر", month: 9, dayNum: 26, cat: "national" },
      { title: "عملية طوفان الأقصى", day: "الأربعاء", hijri: "26 ربيع الثاني", greg: "7 أكتوبر", month: 10, dayNum: 7, cat: "national" },
      { title: "ثورة 14 أكتوبر", day: "الأربعاء", hijri: "3 جمادى الأولى", greg: "14 أكتوبر", month: 10, dayNum: 14, cat: "national" },
      { title: "الذكرى السنوية للشهيد", day: "24-30 نوفمبر", hijri: "13-19 جمادى الأولى", greg: "24-30 نوفمبر", month: 11, dayNum: 24, cat: "national" },
      { title: "عيد الجلاء (30 نوفمبر)", day: "الإثنين", hijri: "20 جمادى الآخرة", greg: "30 نوفمبر", month: 11, dayNum: 30, cat: "national" },
      { title: "مولد فاطمة الزهراء (عليها السلام)", day: "الإثنين", hijri: "20 جمادى الآخرة", greg: "30 نوفمبر", month: 11, dayNum: 30, cat: "religious" },
      { title: "جمعة رجب (عيد اليمنيين)", day: "الجمعة", hijri: "أول جمعة من رجب", greg: "11 ديسمبر", month: 12, dayNum: 11, cat: "religious" },
      { title: "استشهاد السيد حسين بدر الدين الحوثي", day: "الإثنين", hijri: "26 رجب", greg: "4 يناير", month: 1, dayNum: 4, cat: "religious" },
      { title: "ذكرى استشهاد الشهيد الصماد", day: "الخميس", hijri: "3 شعبان", greg: "22 يناير", month: 1, dayNum: 22, cat: "national" },
      { title: "ذكرى غزوة بدر الكبرى", day: "الأربعاء", hijri: "17 رمضان", greg: "24 فبراير", month: 2, dayNum: 24, cat: "religious" },
      { title: "استشهاد الإمام علي بن أبي طالب", day: "الأحد", hijri: "21 رمضان", greg: "28 فبراير", month: 2, dayNum: 28, cat: "religious" },
      { title: "يوم القدس العالمي", day: "الجمعة", hijri: "آخر جمعة من رمضان", greg: "5 مارس", month: 3, dayNum: 5, cat: "religious" },
      { title: "يوم الصمود الوطني (26 مارس)", day: "الجمعة", hijri: "18 شوال", greg: "26 مارس", month: 3, dayNum: 26, cat: "national" },
      { title: "ذكرى الصرخة", day: "الجمعة", hijri: "آخر جمعة من شوال", greg: "2 أبريل", month: 4, dayNum: 2, cat: "religious" },
      { title: "عيد الوحدة اليمنية", day: "السبت", hijri: "16 ذو الحجة", greg: "22 مايو", month: 5, dayNum: 22, cat: "national" },
      { title: "ذكرى عيد الغدير (يوم الولاية)", day: "الإثنين", hijri: "18 ذو الحجة", greg: "24 مايو", month: 5, dayNum: 24, cat: "religious" },
      { title: "رحيل السيد العلامة بدر الدين الحوثي", day: "الخميس", hijri: "21 ذو الحجة", greg: "27 مايو", month: 5, dayNum: 27, cat: "religious" },
    ];

    try {
      const batch = writeBatch(db);
      const year = new Date().getFullYear();
      
      for (const b of basicEvents) {
        let finalYear = year;
        // If the month has already passed this year, set it for next year
        const eventDateThisYear = new Date(year, b.month - 1, b.dayNum);
        if (eventDateThisYear < new Date()) {
          finalYear += 1;
        }
        
        const newDocRef = doc(collection(db, "events"));
        batch.set(newDocRef, {
          title: b.title,
          dayName: b.day,
          hijriDate: b.hijri,
          gregorianDate: b.greg,
          timestamp: new Date(finalYear, b.month - 1, b.dayNum).getTime(),
          category: b.cat,
          type: b.cat,
          createdAt: Date.now()
        });
      }
      
      await batch.commit();
      alert("تمت إضافة 24 مناسبة بنجاح إلى النظام.");
    } catch (e) {
      console.error("Seed Error:", e);
      alert("خطأ أثناء الإضافة: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
           <CalendarIcon className="w-6 h-6 text-blue-600" />
           إدارة المناسبات والفعاليات
         </h2>
         <button 
           onClick={seed}
           disabled={saving}
           className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50"
         >
           إضافة المناسبات الأساسية (24 مناسبة)
         </button>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4">
        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">{editingId ? "تعديل مناسبة" : "إضافة مناسبة جديدة"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <input className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition" placeholder="اسم المناسبة" value={title} onChange={e=>setTitle(e.target.value)} />
           <input className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition" placeholder="اليوم (مثلاً: الثلاثاء)" value={dayName} onChange={e=>setDayName(e.target.value)} />
           <input className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition" placeholder="التاريخ الهجري (مثلاً: 1 محرم)" value={hijriDate} onChange={e=>setHijriDate(e.target.value)} />
           <input className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition" placeholder="التاريخ الميلادي (مثلاً: 16 يونيو)" value={gregorianDate} onChange={e=>setGregorianDate(e.target.value)} />
           <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 mr-2">تاريخ المناسبة (للحسابات الزمنية):</label>
              <input type="datetime-local" className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition" value={timestamp} onChange={e=>setTimestamp(e.target.value)} />
           </div>
           <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 mr-2">التصنيف:</label>
              <select className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition" value={category} onChange={e=>setCategory(e.target.value as any)}>
                 <option value="all">عام</option>
                 <option value="religious">دينية</option>
                 <option value="national">وطنية</option>
                 <option value="historical">تاريخية</option>
              </select>
           </div>
        </div>
        <textarea className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition h-24" placeholder="وصف تفصيلي للمناسبة" value={description} onChange={e=>setDescription(e.target.value)} />
        
        <div className="flex items-center gap-3 pt-2">
           <button onClick={save} disabled={saving} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 disabled:opacity-50">
             {saving ? "جاري الحفظ..." : (editingId ? "تحديث المناسبة" : "حفظ المناسبة")}
           </button>
           {editingId && (
             <button onClick={reset} className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition">إلغاء</button>
           )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><List className="w-5 h-5" /> المناسبات المضافة ({events.length})</h3>
        <div className="space-y-3">
          {events.map(event => (
            <div key={event.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex justify-between items-center group hover:border-blue-500/30 transition-all">
               <div>
                  <div className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                    {event.title}
                    <span className="text-[10px] bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded text-gray-500">{event.category}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{event.dayName} • {event.hijriDate} • {event.gregorianDate}</div>
               </div>
               <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => edit(event)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit className="w-4 h-4"/></button>
                  <button onClick={() => remove(event.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
               </div>
            </div>
          ))}
          {events.length === 0 && <p className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">لا توجد مناسبات مضافة حالياً.</p>}
        </div>
      </div>
    </div>
  );
}
