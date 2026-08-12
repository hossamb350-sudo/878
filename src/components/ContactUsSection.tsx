import React, { useState, useEffect } from "react";
import { SocialLink } from "../types";
import { SyncService } from "../services/SyncService";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { Share2, Send, MonitorPlay, MessageSquare, Radio, Globe } from "lucide-react";

export const ContactUsSection = () => {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [imageError, setImageError] = useState(false);
  const [footerImage, setFooterImage] = useState<string>(() => {
    return localStorage.getItem("custom_footer_cached_image") || "/custom_footer.png";
  });

  useEffect(() => {
    let active = true;
    const unsubPromise = SyncService.syncCollection<SocialLink>(
      "social_links",
      (data) => {
        if (!active) return;
        setLinks(data);
      },
      { orderByField: "order", orderDirection: "asc" }
    );

    // Load and cache custom footer image from Firestore
    const loadAndCacheFooterImage = async () => {
      try {
        const cachedTime = localStorage.getItem("custom_footer_cached_time") || "0";
        const docRef = doc(db, "settings", "custom_footer");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const imageUrl = data.imageUrl;
          const updatedAt = data.updatedAt || 0;
          
          if (imageUrl && (String(updatedAt) !== cachedTime || !localStorage.getItem("custom_footer_cached_image"))) {
            localStorage.setItem("custom_footer_cached_image", imageUrl);
            localStorage.setItem("custom_footer_cached_time", String(updatedAt));
            if (active) {
              setFooterImage(imageUrl);
              setImageError(false);
            }
          }
        }
      } catch (e) {
        console.warn("Failed to load custom footer image from Firestore, using cache if available:", e);
      }
    };
    loadAndCacheFooterImage();

    return () => {
      active = false;
      unsubPromise.then((unsub) => unsub());
    };
  }, []);

  const displayLinks =
    links.length > 0
      ? links
      : [
          {
            id: "1",
            platform: "whatsapp" as const,
            label: "قناة الواتساب",
            url: "https://whatsapp.com/channel/0029Vahhp6S7z4kYmZrjNf3W",
            description: "انضم لقناتنا للمتابعة أولاً بأول",
            order: 1,
            createdAt: 0,
          },
          {
            id: "2",
            platform: "telegram" as const,
            label: "قناة التيليجرام الأولى",
            url: "https://t.me/taizgio",
            description: "@taizgio",
            order: 2,
            createdAt: 0,
          },
          {
            id: "3",
            platform: "telegram" as const,
            label: "قناة التيليجرام الثانية",
            url: "https://t.me/TaizOI",
            description: "@TaizOI",
            order: 3,
            createdAt: 0,
          },
          {
            id: "4",
            platform: "meyon" as const,
            label: "منصة ميون",
            url: "https://meyon.com.ye/c/taizgio/",
            description: "مشاهدة الفيديوهات والتقارير الحصرية",
            order: 4,
            createdAt: 0,
          },
        ];

  const allItems = [
    ...displayLinks,
    {
      id: "sms-service",
      platform: "sms" as const,
      label: "خدمة رسائل SMS",
      url: "sms:5552?body=%D8%AA%D8%B9%D8%B2",
      description: "أرسل تعز برسالة نصية إلى الرقم 5552",
      order: 10,
      createdAt: 0,
    },
    {
      id: "radio-broadcast",
      platform: "radio" as const,
      label: "البث الإذاعي لإذاعة تعز",
      url: "#",
      description: "على موجة FM 88.1",
      order: 11,
      createdAt: 0,
    }
  ];

  return (
    <div className="space-y-4">
      <div className="p-6 md:p-8 bg-taiz-gradient text-white rounded-[2rem] text-right relative overflow-hidden shadow-[0_15px_40px_-10px_rgba(3,47,105,0.2)]">
        {/* Subtle pattern to match branding */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage:
              'url("https://www.transparenttextures.com/patterns/natural-paper.png")',
          }}
        />

        <h3
          className="relative z-10 text-xl font-black text-white mb-6 flex items-center justify-end gap-2"
          dir="rtl"
        >
          <span>تابعنا</span>
          <Share2 className="w-5 h-5 text-white/80" />
        </h3>
        <div
          className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4"
          dir="rtl"
        >
          {allItems.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target={link.id === "radio-broadcast" ? undefined : "_blank"}
              onClick={link.id === "radio-broadcast" ? (e) => e.preventDefault() : undefined}
              rel="referrerPolicy"
              className={`p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition flex items-center justify-between ${
                link.platform === "whatsapp" || link.platform === "meyon" || link.platform === "sms" || link.platform === "radio"
                  ? "sm:col-span-2"
                  : ""
              } hover:shadow-md active:scale-[0.98] transition-all`}
              style={{
                borderRightWidth: "4px",
                borderRightColor:
                  link.platform === "whatsapp"
                    ? "#22c55e"
                    : link.platform === "telegram"
                    ? "#0ea5e9"
                    : link.platform === "meyon"
                    ? "#ef4444"
                    : link.platform === "sms"
                    ? "#a855f7"
                    : link.platform === "radio"
                    ? "#f97316"
                    : "#6366f1",
              }}
            >
              <div className="flex-1 text-right">
                <span
                  className={`font-extrabold ${
                    link.platform === "whatsapp"
                      ? "text-green-600"
                      : link.platform === "telegram"
                      ? "text-sky-500"
                      : link.platform === "meyon"
                      ? "text-red-600"
                      : link.platform === "sms"
                      ? "text-purple-600"
                      : link.platform === "radio"
                      ? "text-orange-600"
                      : "text-indigo-600"
                  }`}
                >
                  {link.label}
                </span>
                {link.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-bold">
                    {link.description}
                  </p>
                )}
              </div>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  link.platform === "whatsapp"
                    ? "bg-green-50 dark:bg-green-900/20 text-green-600"
                    : link.platform === "telegram"
                    ? "bg-sky-50 dark:bg-sky-900/20 text-sky-500"
                    : link.platform === "meyon"
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600"
                    : link.platform === "sms"
                    ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600"
                    : link.platform === "radio"
                    ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600"
                    : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600"
                }`}
              >
                {link.platform === "whatsapp" ? (
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>
                ) : link.platform === "telegram" ? (
                  <Send className="w-5 h-5" />
                ) : link.platform === "meyon" ? (
                  <MonitorPlay className="w-5 h-5" />
                ) : link.platform === "sms" ? (
                  <MessageSquare className="w-5 h-5" />
                ) : link.platform === "radio" ? (
                  <Radio className="w-5 h-5" />
                ) : (
                  <Globe className="w-5 h-5" />
                )}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* قسم الصورة المخصصة في الأسفل */}
      <div className="w-full flex flex-col items-center justify-center pt-4 pb-2 px-2">
        <div className="w-full max-w-md bg-[#0c1933]/40 dark:bg-gray-800/40 border border-white/5 dark:border-gray-700/50 rounded-[2rem] p-5 flex flex-col items-center shadow-lg relative overflow-hidden backdrop-blur-sm">
          <div className="w-full flex flex-col items-center">
            <img
              src={footerImage}
              alt="المحتوى الخاص"
              className="w-full h-auto rounded-2xl object-contain opacity-95 hover:opacity-100 transition-all duration-500 shadow-md"
              onError={() => {
                if (footerImage !== "/custom_footer.png") {
                  setFooterImage("/custom_footer.png");
                } else {
                  setImageError(true);
                }
              }}
            />
            <div className="text-center pt-3 opacity-60">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                تصميم وإعداد خاص بالمنصة
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
