import { useState, useEffect } from "react";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { LogOut, FileText, Video, Radio, Shield, BookOpen, Calendar as CalendarIcon } from "lucide-react";

export function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("news");
  
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  const login = () => signInWithPopup(auth, new GoogleAuthProvider());
  const logout = () => signOut(auth);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
         <Shield className="w-16 h-16 text-blue-600 mb-6" />
         <h1 className="text-2xl font-bold mb-6">لوحة الإدارة</h1>
         <button onClick={login} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
           تسجيل الدخول
         </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 pb-12 flex flex-col md:flex-row gap-6">
       {/* Admin Sidebar */}
       <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-4">
             <div className="text-sm text-gray-500 mb-1">حساب الإدارة</div>
             <div className="font-bold truncate">{user.email}</div>
             <button onClick={logout} className="mt-4 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded transition">
               <LogOut className="w-4 h-4" /> تسجيل خروج
             </button>
          </div>
          
          <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
             {[
               { id: "news", icon: FileText, label: "إدارة الأخبار" },
               { id: "videos", icon: Video, label: "إدارة الفيديوهات" },
               { id: "live", icon: Radio, label: "البث المباشر" },
               { id: "leader", icon: Shield, label: "السيد القائد" },
               { id: "quran", icon: BookOpen, label: "من هدي القرآن" },
               { id: "events", icon: CalendarIcon, label: "المناسبات" }
             ].map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`flex flex-col md:flex-row items-center gap-3 p-3 rounded-xl transition-colors whitespace-nowrap ${activeTab === tab.id ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent dark:border-gray-700"}`}
               >
                  <tab.icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm md:text-base font-medium">{tab.label}</span>
               </button>
             ))}
          </nav>
       </div>

       {/* Admin Content Area */}
       <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 md:p-6 shadow-sm overflow-hidden">
          {activeTab === "news" && <AdminNews />}
          {activeTab === "videos" && <AdminVideos />}
          {activeTab === "live" && <AdminLive />}
          {activeTab === "leader" && <AdminLeader />}
          {activeTab === "quran" && <AdminQuran />}
          {activeTab === "events" && <AdminEvents />}
       </div>
    </div>
  );
}

// Simple Admin Components

function AdminNews() {
  const [title, setTitle] = useState("");
  const [short, setShort] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [cat, setCat] = useState("عامة");
  const [isBreaking, setIsBreaking] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if(!title || !short || !content) return alert("يرجى تعبئة الحقول الأساسية");
    setSaving(true);
    try {
      await addDoc(collection(db, "news"), {
        title, shortDescription: short, content, imageUrl,
        category: cat, isBreaking,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      alert("تم إضافة الخبر!");
      setTitle(""); setShort(""); setContent(""); setImageUrl(""); setIsBreaking(false);
    } catch(e) {
      console.error(e); alert("خطأ!");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">إضافة خبر جديد</h2>
      <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="عنوان الخبر" value={title} onChange={e=>setTitle(e.target.value)} />
      <textarea className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="ملخص الخبر" value={short} onChange={e=>setShort(e.target.value)} />
      <textarea className="w-full p-2 border rounded h-32 dark:bg-gray-700 dark:border-gray-600" placeholder="المحتوى الكامل" value={content} onChange={e=>setContent(e.target.value)} />
      <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="رابط الصورة (اختياري)" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} />
      <select className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={cat} onChange={e=>setCat(e.target.value)}>
         {["عامة", "محلية", "اقتصادية", "رياضية", "خدمات", "ثقافية"].map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <label className="flex items-center gap-2 cursor-pointer">
         <input type="checkbox" checked={isBreaking} onChange={e=>setIsBreaking(e.target.checked)} className="w-4 h-4" />
         <span className="font-bold text-red-500">خبر عاجل</span>
      </label>
      <button onClick={save} disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded">
         {saving ? "جاري الحفظ..." : "نشر الخبر"}
      </button>
    </div>
  );
}

function AdminVideos() {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [thumb, setThumb] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if(!title || !url) return alert("بيانات ناقصة");
    setSaving(true);
    try {
      await addDoc(collection(db, "videos"), {
         title, url, thumbnailUrl: thumb, views: 0, createdAt: Date.now()
      });
      alert("تم الحفظ"); setTitle(""); setUrl(""); setThumb("");
    } catch(e) { console.error(e); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">إضافة فيديو</h2>
      <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="العنوان" value={title} onChange={e=>setTitle(e.target.value)} />
      <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="رابط الفيديو" value={url} onChange={e=>setUrl(e.target.value)} />
      <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="رابط الصورة المصغرة" value={thumb} onChange={e=>setThumb(e.target.value)} />
      <button onClick={save} disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded">حفظ</button>
    </div>
  );
}

function AdminLive() {
  const [url, setUrl] = useState("");
  const [active, setActive] = useState(false);

  const save = async () => {
     try {
        await updateDoc(doc(db, "settings", "livestream"), { url, isActive: active, updatedAt: Date.now() }).catch(async (e) => {
           // Create if not exists
           const { setDoc } = await import("firebase/firestore");
           await setDoc(doc(db, "settings", "livestream"), { url, isActive: active, updatedAt: Date.now() });
        });
        alert("تم الحفظ");
     } catch(e) { console.error(e); }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">إدارة البث المباشر</h2>
      <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="رابط بث iFrame" value={url} onChange={e=>setUrl(e.target.value)} />
      <label className="flex items-center gap-2 cursor-pointer">
         <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} className="w-4 h-4" />
         <span className="font-bold text-red-500">تفعيل البث المباشر</span>
      </label>
      <button onClick={save} className="bg-blue-600 text-white px-6 py-2 rounded">حفظ الإعدادات</button>
    </div>
  );
}

function AdminLeader() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("text");
  const [content, setContent] = useState("");

  const save = async () => {
    if(!title || !content) return;
    try {
      await addDoc(collection(db, "leader"), { title, type, content, createdAt: Date.now() });
      alert("تم الإضافة"); setTitle(""); setContent("");
    } catch(e) { console.error(e); }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">إضافة لمنهج السيد القائد</h2>
      <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="العنوان" value={title} onChange={e=>setTitle(e.target.value)} />
      <select className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={type} onChange={e=>setType(e.target.value)}>
         <option value="text">نص (مقال / درس)</option>
         <option value="video">رابط فيديو (Embed)</option>
      </select>
      <textarea className="w-full p-2 border rounded h-32 dark:bg-gray-700 dark:border-gray-600" placeholder={type === 'text' ? "المحتوى" : "رابط الفيديو"} value={content} onChange={e=>setContent(e.target.value)} />
      <button onClick={save} className="bg-blue-600 text-white px-6 py-2 rounded">إضافة</button>
    </div>
  );
}

function AdminQuran() {
  const [link, setLink] = useState("");
  const [active, setActive] = useState(false);

  const save = async () => {
     try {
        const { setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "settings", "quran"), { link, isActive: active });
        alert("تم الحفظ");
     } catch(e) { console.error(e); }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">إعدادات قسم القرآن</h2>
      <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="الرابط الخارجي" value={link} onChange={e=>setLink(e.target.value)} />
      <label className="flex items-center gap-2 cursor-pointer">
         <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} className="w-4 h-4" />
         <span className="font-bold text-emerald-500">تفعيل القسم</span>
      </label>
      <button onClick={save} className="bg-blue-600 text-white px-6 py-2 rounded">حفظ</button>
    </div>
  );
}

function AdminEvents() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("official");
  const [date, setDate] = useState("");

  const save = async () => {
    if(!title || !date) return;
    try {
      await addDoc(collection(db, "events"), { title, description: desc, type, date: new Date(date).getTime() });
      alert("تم الإضافة"); setTitle(""); setDesc(""); setDate("");
    } catch(e) { console.error(e); }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">إضافة فعالية</h2>
      <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="اسم الفعالية" value={title} onChange={e=>setTitle(e.target.value)} />
      <textarea className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="وصف للفعالية (اختياري)" value={desc} onChange={e=>setDesc(e.target.value)} />
      <input type="datetime-local" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={date} onChange={e=>setDate(e.target.value)} />
      <select className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={type} onChange={e=>setType(e.target.value)}>
         <option value="official">رسمية</option>
         <option value="local">محلية</option>
         <option value="cultural">ثقافية</option>
         <option value="religious">دينية</option>
      </select>
      <button onClick={save} className="bg-blue-600 text-white px-6 py-2 rounded">إضافة الفعالية</button>
    </div>
  );
}
