import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { routes } from '../utils/routes';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl font-black text-slate-300">404</span>
      </div>
      <h1 className="text-2xl font-black text-slate-800 mb-2 font-cairo">الصفحة غير موجودة</h1>
      <p className="text-sm text-slate-500 mb-8 max-w-sm">
        عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. ربما تم حذفها أو تم تغيير رابطها.
      </p>
      <Link 
        to={routes.home()} 
        className="flex items-center gap-2 bg-[#D32027] text-white px-6 py-3 rounded-xl font-bold font-cairo hover:bg-[#b01a20] transition-colors"
      >
        <Home className="w-5 h-5" />
        العودة للرئيسية
      </Link>
    </div>
  );
}
