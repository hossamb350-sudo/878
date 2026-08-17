import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ArrowRight, Edit, Trash2, Calendar, Clock, Image, Save, X, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit Form Fields
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDayName, setEditDayName] = useState("");
  const [editHijriDate, setEditHijriDate] = useState("");
  const [editGregorianDate, setEditGregorianDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchActivity = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "activities", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data: any = { id: docSnap.id, ...docSnap.data() };
          setActivity(data);
          
          // Prepopulate Edit Form Fields
          setEditTitle(data.title || "");
          setEditType(data.type || "");
          setEditDesc(data.description || "");
          setEditImageUrl(data.imageUrl || "");
          setEditStartTime(data.startTime || "");
          setEditEndTime(data.endTime || "");
          
          if (data.startDate) {
            const d = new Date(data.startDate);
            const iso = d.toISOString().split("T")[0];
            setEditDate(iso);
            setEditDayName(data.dayName || "");
            setEditHijriDate(data.hijriDate || "");
            setEditGregorianDate(data.gregorianDate || "");
          }
        } else {
          alert("الفعالية غير موجودة");
          navigate("/events");
        }
      } catch (err) {
        console.error("Error fetching activity:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [id, navigate]);

  const handleDateChange = (val: string) => {
    setEditDate(val);
    if (!val) return;
    const newDate = new Date(val);
    if (!isNaN(newDate.getTime())) {
      setEditDayName(new Intl.DateTimeFormat("ar-EG", { weekday: "long" }).format(newDate));
      setEditHijriDate(new Intl.DateTimeFormat("ar-SA-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(newDate) + " هـ");
      setEditGregorianDate(new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric" }).format(newDate));
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("هل أنت متأكد من حذف هذه الفعالية؟")) return;
    try {
      await deleteDoc(doc(db, "activities", id));
      alert("تم حذف الفعالية بنجاح");
      navigate("/events");
    } catch (e) {
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const handleSave = async () => {
    if (!id) return;
    if (!editTitle || !editType || !editDate) {
      return alert("يرجى إدخال عنوان ونوع الفعالية والتاريخ");
    }

    if (editStartTime && editEndTime) {
      if (editEndTime < editStartTime) {
        return alert("وقت الانتهاء لا يمكن أن يسبق وقت البدء");
      }
    }

    setSaving(true);
    try {
      let startDateMs = new Date(editDate).getTime();
      if (editStartTime) {
        startDateMs = new Date(`${editDate}T${editStartTime}`).getTime();
      }

      const updatedData = {
        title: editTitle,
        type: editType,
        dayName: editDayName,
        hijriDate: editHijriDate,
        gregorianDate: editGregorianDate,
        startTime: editStartTime || null,
        endTime: editEndTime || null,
        description: editDesc,
        imageUrl: editImageUrl,
        startDate: startDateMs,
        updatedAt: Date.now(),
      };

      await updateDoc(doc(db, "activities", id), updatedData);
      
      setActivity({
        id,
        ...updatedData
      });
      
      alert("تم تعديل الفعالية بنجاح");
      setIsEditing(false);
    } catch (e) {
      alert("حدث خطأ أثناء حفظ التعديلات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 bg-surface-main">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-taiz-navy/10 border-t-taiz-royal animate-spin"></div>
        </div>
        <p className="text-text-secondary text-xs font-bold">جاري تحميل البيانات...</p>
      </div>
    );
  }

  if (!activity) return null;

  // Split description by double newlines for matching the News formatting exactly
  const paragraphs = activity.description
    ? activity.description.split(/\r?\n\s*\r?\n/).map((p: string) => p.trim()).filter((p: string) => p.length > 0)
    : [];

  const defaultImage = "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&q=80&w=1000";
  const eventTitle = activity.title || "بدون عنوان";
  const categoryBadge = activity.type || "";
  const getStatusLabel = () => activity.status || "قادمة";

  return (
    <div className="max-w-3xl mx-auto w-full p-4 pb-20 space-y-6 font-sans" dir="rtl">
      {/* Back Button */}
      <button
        onClick={() => navigate("/events")}
        className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-all font-bold text-sm cursor-pointer select-none"
      >
        <ArrowRight className="w-5 h-5" />
        <span>العودة للخلف</span>
      </button>

      {/* Main Card carrying same design and shape as the card but expanded */}
      <div
        className="bg-white border border-gray-100 shadow-sm transition-all duration-300 text-right flex flex-col w-full overflow-hidden relative"
        style={{ direction: "rtl", borderRadius: 0 }}
      >
        {/* Cover image with dark gradient, top right category badge and top left status badge */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden shrink-0 bg-gray-50">
          <img
            src={activity.imageUrl || defaultImage}
            alt={eventTitle}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Dark Gradient Overlay for high text contrast */}
          <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-[#0b3a24]/95 via-[#0b3a24]/40 to-transparent opacity-90 pointer-events-none z-0" />

          {/* Top-Right: Category/Classification Badge */}
          {categoryBadge && (
            <div className="absolute top-4 right-4 bg-red-600 text-white px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black shadow-md flex items-center gap-1 shrink-0 z-10">
              <span>{categoryBadge}</span>
              <span className="text-white text-[10px] leading-none">←</span>
            </div>
          )}

          {/* Top-Left: Status/Action Badge */}
          <div className="absolute top-4 left-4 bg-[#0a8f5c] text-white px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-black shadow-md z-10">
            {getStatusLabel()}
          </div>

          {/* Title right-aligned in 3 lines max */}
          <h3 
            className="absolute bottom-6 right-6 left-6 text-right text-white text-[18px] sm:text-[22px] md:text-[26px] font-bold leading-[1.5] drop-shadow-md z-10 line-clamp-3"
            style={{ fontFamily: 'Cairo, Tajawal, "IBM Plex Sans Arabic", sans-serif' }}
          >
            {eventTitle}
          </h3>
        </div>

        {/* Underneath Content Section with Padding */}
        <div className="p-5 sm:p-6 flex flex-col flex-1">
          {/* 2. Information columns (RTL: Right = Day, Middle = Hijri, Left = Gregorian) with minimized typography */}
          <div className="grid grid-cols-3 gap-1 py-3 border-b border-gray-100 mt-1 mb-4 text-center">
            {/* Column 1 (Right): Day */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-[#0a8f5c]/5 border border-[#0a8f5c]/10 flex items-center justify-center text-[#0a8f5c] mb-1">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] md:text-[10px] font-bold text-[#0a8f5c] mb-0.5">اليوم</span>
              <span className="text-[11px] font-black text-gray-800 leading-tight">
                {activity.dayName || "—"}
              </span>
            </div>

            {/* Column 2 (Middle): Hijri Date */}
            <div className="flex flex-col items-center justify-center border-r border-l border-gray-100 px-1">
              <div className="w-8 h-8 rounded-full bg-[#b89047]/8 border border-[#b89047]/15 flex items-center justify-center text-[#b89047] mb-1">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] md:text-[10px] font-bold text-[#b89047] mb-0.5">التاريخ الهجري</span>
              <span className="text-[11px] font-black text-gray-800 leading-tight">
                {activity.hijriDate || "—"}
              </span>
            </div>

            {/* Column 3 (Left): Gregorian Date */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-[#0a8f5c]/5 border border-[#0a8f5c]/10 flex items-center justify-center text-[#0a8f5c] mb-1">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] md:text-[10px] font-bold text-[#0a8f5c] mb-0.5">التاريخ الميلادي</span>
              <span className="text-[11px] font-black text-gray-800 leading-tight">
                {activity.gregorianDate || "—"}
              </span>
            </div>
          </div>

          {/* Times if available */}
          {activity.startTime && (
            <div className="flex justify-center gap-4 text-xs font-bold text-gray-600 mb-6">
              <span className="bg-[#0a8f5c]/5 text-[#0a8f5c] px-3 py-1 rounded-full border border-[#0a8f5c]/10 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>يبدأ: {activity.startTime}</span>
              </span>
            </div>
          )}

          {/* 3. Event Description matching the News detail page formatting exactly */}
          <div className="border-t border-gray-100 pt-5 mt-2">
            <div 
              className="prose prose-stone dark:prose-invert max-w-none text-gray-800 dark:text-stone-100 text-justify font-ibm [&_p]:mb-4 [&_p]:mt-0 [&_p]:leading-relaxed"
              style={{ 
                fontSize: "15px", 
                lineHeight: 1.8,
              }}
            >
              {paragraphs.length > 0 ? (
                paragraphs.map((p: string, idx: number) => (
                  <p key={idx} className="whitespace-pre-line">{p}</p>
                ))
              ) : (
                <p className="text-text-muted italic">لا يوجد وصف تفصيلي متوفر.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Elegant Edit Slide-over/Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <button
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 cursor-default bg-transparent w-full h-full border-none"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-surface-card rounded-2xl border border-border-light p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto text-right"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border-light">
                <h3 className="text-base font-black text-text-primary">تعديل بيانات الفعالية</h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 rounded-lg bg-surface-main text-text-muted hover:text-text-primary transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-bold text-text-primary">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="block text-text-secondary">عنوان الفعالية</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-surface-main border border-border-light rounded-xl px-3 py-2.5 focus:outline-none focus:border-taiz-royal"
                    placeholder="أدخل عنوان الفعالية"
                  />
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <label className="block text-text-secondary">نوع الفعالية</label>
                  <input
                    type="text"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full bg-surface-main border border-border-light rounded-xl px-3 py-2.5 focus:outline-none focus:border-taiz-royal"
                    placeholder="مثال: فعالية دينية، ندوة، إلخ"
                  />
                </div>

                {/* Date Picker */}
                <div className="space-y-1.5">
                  <label className="block text-text-secondary">تاريخ الفعالية</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full bg-surface-main border border-border-light rounded-xl px-3 py-2.5 focus:outline-none focus:border-taiz-royal text-right"
                  />
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-text-secondary">وقت البدء (اختياري)</label>
                    <input
                      type="time"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full bg-surface-main border border-border-light rounded-xl px-3 py-2.5 focus:outline-none focus:border-taiz-royal text-right"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-text-secondary">وقت الانتهاء (اختياري)</label>
                    <input
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full bg-surface-main border border-border-light rounded-xl px-3 py-2.5 focus:outline-none focus:border-taiz-royal text-right"
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div className="space-y-1.5">
                  <label className="block text-text-secondary">رابط صورة الفعالية (اختياري)</label>
                  <input
                    type="text"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    className="w-full bg-surface-main border border-border-light rounded-xl px-3 py-2.5 focus:outline-none focus:border-taiz-royal text-left"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block text-text-secondary">تفاصيل ووصف الفعالية</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={4}
                    className="w-full bg-surface-main border border-border-light rounded-xl px-3 py-2.5 focus:outline-none focus:border-taiz-royal resize-none"
                    placeholder="أدخل الوصف الكامل للفعالية..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-border-light">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-xs font-black shadow-md transition duration-200 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "جاري الحفظ..." : "حفظ التعديلات"}</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="flex-1 bg-surface-main hover:bg-surface-hover text-text-primary border border-border-light py-3 rounded-xl text-xs font-black transition cursor-pointer text-center"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
