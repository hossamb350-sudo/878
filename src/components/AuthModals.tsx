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
        const googleUser = await (GoogleAuth.signIn as any)();
        if (googleUser.authentication.idToken) {
          const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
          const userCredential = await signInWithCredential(auth, credential);
          await syncUserProfile(userCredential.user);
        } else {
          throw new Error("No ID Token found");
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
        setError("حدث خطأ أثناء الاتصال بجوجل: " + (err.message || err));
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
      if (!displayName.trim()) {
        setError("يرجى إدخال اسمك الكامل");
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
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900 z-[110] backdrop-blur-[3px]"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] shadow-2xl z-[120] border-t border-stone-100 flex flex-col max-h-[92vh] overflow-hidden leading-relaxed text-right text-stone-800"
            dir="rtl"
          >
            {/* Header / Grabber */}
            <div className="flex flex-col items-center pt-3 pb-2 select-none shrink-0 relative bg-stone-50 border-b border-stone-100/60">
              <div className="w-12 h-1 bg-stone-200 rounded-full mb-3" />
              
              <button 
                onClick={onClose}
                className="absolute left-5 top-5 p-1.5 hover:bg-stone-200/50 rounded-full text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex gap-1.5 mt-2 overflow-hidden rounded-xl border border-stone-200 p-0.5 bg-white shadow-inner select-none font-bold text-xs">
                <button
                  type="button"
                  onClick={() => { setActiveTab("login"); setError(null); }}
                  className={`px-6 py-2 rounded-lg transition-all ${
                    activeTab === "login"
                      ? "bg-gradient-to-r from-[#d49a37] to-[#b37f2c] text-white shadow-sm"
                      : "text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab("register"); setError(null); }}
                  className={`px-6 py-2 rounded-lg transition-all ${
                    activeTab === "register"
                      ? "bg-gradient-to-r from-[#d49a37] to-[#b37f2c] text-white shadow-sm"
                      : "text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  إنشاء حساب جديد
                </button>
              </div>
            </div>

            {/* Scrollable Content Form Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
              <div className="text-center mb-6">
                <h3 className="text-lg font-black text-stone-900 leading-tight">
                  {activeTab === "login" 
                    ? "مرحباً بك مجدداً في منصة تعز الإعلامية" 
                    : "انضم إلى أسرة منصة تعز الإعلامية"}
                </h3>
                <p className="text-xs text-stone-400 mt-1">
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
                    className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2.5 text-xs font-bold text-red-600"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === "register" && (
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1.5 mr-1">الاسم الكامل</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="مثال: أحمد عبد الله"
                        className="w-full pl-3 pr-10 py-3 bg-stone-50 hover:bg-stone-100/50 focus:bg-white border border-stone-200 focus:border-[#d49a37] focus:ring-1 focus:ring-[#d49a37] rounded-xl text-stone-800 text-sm focus:outline-none transition-all"
                      />
                      <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1.5 mr-1">البريد الإلكتروني</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="username@domain.com"
                      className="w-full pl-3 pr-10 py-3 bg-stone-50 hover:bg-stone-100/50 focus:bg-white border border-stone-200 focus:border-[#d49a37] focus:ring-1 focus:ring-[#d49a37] rounded-xl text-stone-800 text-sm focus:outline-none transition-all ltr text-left"
                    />
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1.5 mr-1">كلمة المرور</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-stone-50 hover:bg-stone-100/50 focus:bg-white border border-stone-200 focus:border-[#d49a37] focus:ring-1 focus:ring-[#d49a37] rounded-xl text-stone-800 text-sm focus:outline-none transition-all ltr text-left"
                    />
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {activeTab === "register" && (
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1.5 mr-1">تأكيد كلمة المرور</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 bg-stone-50 hover:bg-stone-100/50 focus:bg-white border border-stone-200 focus:border-[#d49a37] focus:ring-1 focus:ring-[#d49a37] rounded-xl text-stone-800 text-sm focus:outline-none transition-all ltr text-left"
                      />
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#d49a37] to-[#b37f2c] hover:from-[#e3ab4a] hover:to-[#c48f33] active:scale-[0.99] text-white py-3.5 rounded-xl font-bold border border-[#d49e3c]/20 shadow-lg shadow-amber-600/10 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 disabled:opacity-75 disabled:scale-100"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                  <div className="w-full border-t border-stone-150" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-stone-400 font-bold">أو تسجيل الدخول عبر</span>
                </div>
              </div>

              {/* Third party options */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full border border-stone-200 hover:bg-stone-50 active:scale-[0.99] bg-white text-stone-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all text-xs cursor-pointer shadow-sm md:shadow-none disabled:opacity-50"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4 shrink-0" alt="" />
                <span>شريك جوجل (Google Auth)</span>
              </button>

              <div className="mt-8 text-center select-none shrink-0">
                <button
                  onClick={onClose}
                  className="text-stone-400 font-bold hover:text-[#c28d32] text-xs transition-colors underline decoration-dotted underline-offset-4 cursor-pointer"
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
