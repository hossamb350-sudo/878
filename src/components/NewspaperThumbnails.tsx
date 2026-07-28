import React from 'react';
import { NewspaperIssue } from '../types';
import { X } from 'lucide-react';

interface Props {
  issue: NewspaperIssue;
  onSelectPage: (idx: number) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const NewspaperThumbnails: React.FC<Props> = ({ issue, onSelectPage, isOpen, setIsOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-64 bg-slate-900 text-white shadow-2xl z-[200] flex flex-col no-print border-l border-white/10 transition-transform">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
        <h3 className="font-bold text-sm">فهرس الصفحات</h3>
        <button onClick={() => setIsOpen(false)} className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(issue.pages || []).map((p, idx) => (
          <button
            key={p.id || idx}
            onClick={() => {
              onSelectPage(idx);
              // Option: Keep sidebar open or close it? Let's close it on mobile, but keep on desktop?
              // Let's just close it.
              setIsOpen(false);
            }}
            className="w-full flex flex-col gap-2 text-right group"
          >
            <div className="w-full aspect-[1/1.4] bg-white/5 border border-white/10 rounded-lg group-hover:border-amber-500 transition-colors flex flex-col">
               <div className="h-4 bg-white/10 w-full mb-1"></div>
               <div className="flex-1 flex gap-1 p-1">
                 <div className="flex-1 bg-white/5"></div>
                 <div className="flex-1 bg-white/5"></div>
               </div>
            </div>
            <span className="text-xs font-bold text-white/80 group-hover:text-amber-400 transition-colors">
              ص {p.pageNumber || idx + 1}: {p.title || `صفحة ${idx + 1}`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
