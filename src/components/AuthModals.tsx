import React, { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithCredential
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@southdevs/capacitor-google-auth";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";
import { UserProfile } from "../types";

interface AuthModalsProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab: "login" | "register";
  onSuccess: () => void;
}

export function AuthModals({ isOpen, onClose, initialTab, onSuccess }: AuthModalsProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setEmail("");
      setPassword("");
      setDisplayName("");
      setConfirmPassword("");
      setError(null);
      setLoading(false);
    }
  }, [isOpen, initialTab]);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        // Ensure initialized for Android fallback
        try {
          await GoogleAuth.initialize({
            clientId: '565624301516-17egbf55cbcp1vsdhd3mh024n2m5bqtp.apps.googleusercontent.com',
          });
        } catch (e) {
          console.log("GoogleAuth already initialized or skip:", e);
        }

        const googleUser = await (GoogleAuth.signIn as any)();
        if (googleUser && googleUser.authentication && googleUser.authentication.idToken) {
          const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
          const userCredential = await signInWithCredential(auth, credential);
          await syncUserProfile(userCredential.user);
        } else {
          console.error("Google Sign-In returned invalid user data:", googleUser);
          throw new Error(googleUser?.message || "فشل الحصول على رمز الهوية (ID Token) من جوجل");
        }
      } else {
        const userCredential = await signInWithPopup(auth, new GoogleAuthProvider());
        await syncUserProfile(userCredential.user);
      }
      onSuccess();
    } catch (err: any) {
      console.error("Google Auth error:", err);
      if (err.code === "auth/operation-not-allowed") {
        setError("تسجيل الدخول عبر جوجل غير مفعل حالياً. يرجى التواصل مع الإدارة.");
      } else {
        const detail = err.message || (typeof err === 'string' ? err : JSON.stringify(err));
        setError("حدث خطأ أثناء الاتصال بجوجل: " + detail);
      }
    } finally {
      setLoading(false);
    }
  };

  const syncUserProfile = async (firebaseUser: any) => {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || displayName || "مستخدم جديد",
          photoURL: firebaseUser.photoURL || undefined,
          role: "user",
          createdAt: Date.now(),
          lastLogin: Date.now()
        };
        await setDoc(userRef, newProfile);
      } else {
        await setDoc(userRef, { lastLogin: Date.now() }, { merge: true });
      }
    } catch (e) {
      console.warn("Could not sync Firestore user profile:", e);
    }
  };

  const validateForm = () => {
    if (!email || !email.includes("@")) {
      setError("يرجى إدخال بريد إلكتروني صحيح");
      return false;
    }
    if (password.length < 6) {
      setError("يجب أن تتكون كلمة المرور من 6 أحرف على الأقل");
      return false;
    }
    if (activeTab === "register") {
      const emailDomain = email.trim().toLowerCase().split("@")[1];
      if (!emailDomain || !emailDomain.includes(".")) {
        setError("يرجى استخدام بريد إلكتروني صحيح");
        return false;
      }

      const nameTrimmed = displayName.trim();
      const nameParts = nameTrimmed.split(/\s+/);
      const nameRegex = /^[a-zA-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+$/;

      if (!nameTrimmed) {
        setError("يرجى إدخال اسمك الكامل");
        return false;
      }
      if (nameParts.length < 2 || nameParts.some(part => part.length < 2)) {
        setError("يرجى إدخال اسمك الحقيقي الكامل (الاسم واللقب على الأقل)");
        return false;
      }
      if (!nameRegex.test(nameTrimmed)) {
        setError("يجب أن يحتوي الاسم على حروف فقط وبدون رموز أو أرقام");
        return false;
      }

      if (password !== confirmPassword) {
        setError("كلمات المرور غير متطابقة");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (activeTab === "login") {
        // Log in
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await syncUserProfile(userCredential.user);
        onSuccess();
      } else {
        // Register/Sign up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update auth profile display name
        await updateProfile(userCredential.user, {
          displayName: displayName
        });

        // Initialize Firestore profile doc
        const userRef = doc(db, "users", userCredential.user.uid);
        const newProfile: UserProfile = {
          uid: userCredential.user.uid,
          email: email.trim(),
          displayName: displayName.trim(),
          role: "user",
          createdAt: Date.now(),
          lastLogin: Date.now()
        };
        await setDoc(userRef, newProfile);
        
        onSuccess();
      }
    } catch (err: any) {
      console.error("Auth submit error:", err);
      // Translate popular errors to beautiful Arabic
      switch (err.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
          break;
        case "auth/email-already-in-use":
          setError("هذا البريد الإلكتروني مسجل بالفعل باسم حساب آخر");
          break;
        case "auth/invalid-email":
          setError("صيغة البريد الإلكتروني غير صحيحة");
          break;
        case "auth/weak-password":
          setError("كلمة المرور ضعيفة جداً");
          break;
        case "auth/operation-not-allowed":
          setError("طريقة الدخول هذه معطلة في خادم المنصة");
          break;
        case "auth/network-request-failed":
          setError("فشل الاتصال بالإنترنت، يرجى التحقق من الشبكة");
          break;
        default:
          setError(err.message || "حدث خطأ غير متوقع، يرجى المحاولة لاحقاً");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#07152B]/80 z-[110] backdrop-blur-[4px]"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#07152B] rounded-t-[2.5rem] shadow-[0_-8px_32px_rgba(7,21,43,0.6)] z-[120] border-t border-[#1e4275]/50 flex flex-col max-h-[92vh] overflow-hidden leading-relaxed text-right text-white"
            dir="rtl"
          >
            {/* Header / Grabber */}
            <div className="flex flex-col items-center pt-3 pb-2 select-none shrink-0 relative bg-[#10264A] border-b border-[#1e4275]/40">
              <div className="w-12 h-1 bg-[#1e4275]/80 rounded-full mb-3" />
              
              <button 
                onClick={onClose}
                className="absolute left-5 top-5 p-1.5 hover:bg-[#1e4275]/50 rounded-full text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex gap-1.5 mt-2 overflow-hidden rounded-xl border border-[#1e4275]/50 p-0.5 bg-[#07152B] shadow-inner select-none font-bold text-xs">
                <button
                  type="button"
                  onClick={() => { setActiveTab("login"); setError(null); }}
                  className={`px-6 py-2 rounded-lg transition-all cursor-pointer ${
                    activeTab === "login"
                      ? "bg-gradient-to-r from-[#eab355] to-[#d49a37] text-[#07152B] shadow-sm"
                      : "text-white/60 hover:text-white hover:bg-[#1e4275]/30"
                  }`}
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab("register"); setError(null); }}
                  className={`px-6 py-2 rounded-lg transition-all cursor-pointer ${
                    activeTab === "register"
                      ? "bg-gradient-to-r from-[#eab355] to-[#d49a37] text-[#07152B] shadow-sm"
                      : "text-white/60 hover:text-white hover:bg-[#1e4275]/30"
                  }`}
                >
                  إنشاء حساب جديد
                </button>
              </div>
            </div>

            {/* Scrollable Content Form Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
              <div className="text-center mb-6">
                <h3 className="text-lg font-black text-white leading-tight">
                  {activeTab === "login" 
                    ? "مرحباً بك مجدداً في منصة تعز الإعلامية" 
                    : "انضم إلى أسرة منصة تعز الإعلامية"}
                </h3>
                <p className="text-xs text-white/60 mt-1">
                  {activeTab === "login"
                    ? "سجل دخولك لتتمكن من حفظ تفضيلاتك والتفاعل بكل أمان"
                    : "أنشئ حساباً اليوم بلمح البصر للدروس الإخبارية والثقافية والمصاحف"}
                </p>
              </div>

              {/* Error messages */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs font-bold text-red-400"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === "register" && (
                  <div>
                    <label className="block text-xs font-bold text-[#eab355] mb-1.5 mr-1">الاسم الكامل</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="مثال: أحمد عبد الله"
                        className="w-full pl-3 pr-10 py-3 bg-[#10264A] hover:bg-[#1e4275]/70 focus:bg-[#10264A] border border-[#1e4275] focus:border-[#eab355] focus:ring-1 focus:ring-[#eab355] rounded-xl text-white text-sm focus:outline-none transition-all placeholder:text-white/30"
                      />
                      <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#eab355] mb-1.5 mr-1">البريد الإلكتروني</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="username@domain.com"
                      className="w-full pl-3 pr-10 py-3 bg-[#10264A] hover:bg-[#1e4275]/70 focus:bg-[#10264A] border border-[#1e4275] focus:border-[#eab355] focus:ring-1 focus:ring-[#eab355] rounded-xl text-white text-sm focus:outline-none transition-all ltr text-left placeholder:text-white/30"
                    />
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#eab355] mb-1.5 mr-1">كلمة المرور</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-[#10264A] hover:bg-[#1e4275]/70 focus:bg-[#10264A] border border-[#1e4275] focus:border-[#eab355] focus:ring-1 focus:ring-[#eab355] rounded-xl text-white text-sm focus:outline-none transition-all ltr text-left placeholder:text-white/30"
                    />
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {activeTab === "register" && (
                  <div>
                    <label className="block text-xs font-bold text-[#eab355] mb-1.5 mr-1">تأكيد كلمة المرور</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 bg-[#10264A] hover:bg-[#1e4275]/70 focus:bg-[#10264A] border border-[#1e4275] focus:border-[#eab355] focus:ring-1 focus:ring-[#eab355] rounded-xl text-white text-sm focus:outline-none transition-all ltr text-left placeholder:text-white/30"
                      />
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#eab355] to-[#d49a37] hover:from-[#f5c36a] hover:to-[#e0ab4a] active:scale-[0.99] text-[#07152B] py-3.5 rounded-xl font-bold border border-[#eab355]/20 shadow-lg shadow-amber-600/10 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 disabled:opacity-75 disabled:scale-100"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 border-2 border-[#07152B] border-t-transparent rounded-full animate-spin" />
                      جاري معالجة طلبك...
                    </span>
                  ) : (
                    <span>{activeTab === "login" ? "سجل الدخول" : "إنشاء حساب"}</span>
                  )}
                </button>
              </form>

              {/* Divider lines */}
              <div className="relative my-6 select-none shrink-0">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1e4275]/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#07152B] px-3 text-white/50 font-bold">أو تسجيل الدخول عبر</span>
                </div>
              </div>

              {/* Third party options */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full border border-[#1e4275] hover:bg-[#10264A] active:scale-[0.99] bg-[#07152B] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all text-xs cursor-pointer shadow-sm disabled:opacity-50"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4 shrink-0" alt="" />
                <span>تسجيل الدخول عبر حساب جوجل</span>
              </button>

              <div className="mt-8 text-center select-none shrink-0">
                <button
                  onClick={onClose}
                  className="text-white/50 font-bold hover:text-[#eab355] text-xs transition-colors underline decoration-dotted underline-offset-4 cursor-pointer"
                >
                  الدخول المباشر كزائر (تخطي)
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
