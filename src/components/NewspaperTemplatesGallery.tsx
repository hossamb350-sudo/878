import React, { useState } from 'react';
import { LayoutTemplate, X, CheckCircle } from 'lucide-react';
import { NewspaperPage, NewspaperArticleRef } from '../types';

interface NewspaperTemplatesGalleryProps {
  onApplyTemplate: (template: NewspaperPage) => void;
  onClose: () => void;
}

export const NewspaperTemplatesGallery: React.FC<NewspaperTemplatesGalleryProps> = ({ onApplyTemplate, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const templates: { id: string; category: string; name: string; description: string; page: Partial<NewspaperPage> }[] = [
    {
      id: "cover-classic",
      category: "cover",
      name: "غلاف كلاسيكي",
      description: "صورة بانورامية ضخمة، عمود جانبي، وأخبار فرعية",
      page: {
        pageType: "cover",
        title: "الغلاف الرئيسي",
        gridColumns: 6,
        layoutTemplate: "cover-classic",
        items: [
          { id: "ph-1", title: "المانشيت العريض", content: "نص افتراضي للمانشيت", importance: "high", imageSize: "pano", colSpan: 6, rowSpan: 2, columns: 6, sourceType: "news", order: 0 } as NewspaperArticleRef,
          { id: "ph-2", title: "خبر هام", content: "تفاصيل الخبر الهام", importance: "medium", imageSize: "rect", colSpan: 4, rowSpan: 1, columns: 4, sourceType: "news", order: 1 } as NewspaperArticleRef,
          { id: "ph-3", title: "إعلان", content: "مساحة إعلانية", importance: "low", colSpan: 2, rowSpan: 1, columns: 2, sourceType: "ad", order: 2 } as NewspaperArticleRef,
        ]
      }
    },
    {
      id: "internal-news-1",
      category: "news",
      name: "أخبار محلية - 6 أعمدة",
      description: "توزيع مثالي لأخبار متعددة بصور متوسطة",
      page: {
        pageType: "news",
        title: "الأخبار والشؤون المحلية",
        gridColumns: 6,
        layoutTemplate: "internal-news-1",
        items: [
          { id: "ph-4", title: "خبر رئيسي", content: "نص", importance: "medium", imageSize: "half", colSpan: 4, rowSpan: 1, columns: 4, sourceType: "news", order: 0 } as NewspaperArticleRef,
          { id: "ph-5", title: "خبر جانبي", content: "نص", importance: "low", imageSize: "inline", colSpan: 2, rowSpan: 1, columns: 2, sourceType: "news", order: 1 } as NewspaperArticleRef,
          { id: "ph-6", title: "خبر آخر", content: "نص", importance: "low", colSpan: 3, rowSpan: 1, columns: 3, sourceType: "news", order: 2 } as NewspaperArticleRef,
          { id: "ph-7", title: "تقرير", content: "نص", importance: "low", colSpan: 3, rowSpan: 1, columns: 3, sourceType: "article", order: 3 } as NewspaperArticleRef,
        ]
      }
    },
    {
      id: "editorial-1",
      category: "articles",
      name: "رأي ومقالات - 4 أعمدة",
      description: "مقالات طويلة مع اقتباسات وكوادر مميزة",
      page: {
        pageType: "articles",
        title: "آراء ومقالات",
        gridColumns: 4,
        layoutTemplate: "editorial-1",
        items: [
          { id: "ph-8", title: "مقال افتتاحي", content: "نص المقال", importance: "high", colSpan: 2, rowSpan: 2, columns: 2, featuredBox: true, quote: "اقتباس هام", sourceType: "article", order: 0 } as NewspaperArticleRef,
          { id: "ph-9", title: "عمود رأي", content: "نص العمود", importance: "medium", colSpan: 2, rowSpan: 1, columns: 2, sourceType: "article", order: 1 } as NewspaperArticleRef,
          { id: "ph-10", title: "إعلان", content: "مساحة إعلانية", importance: "low", colSpan: 2, rowSpan: 1, columns: 2, sourceType: "ad", order: 2 } as NewspaperArticleRef,
        ]
      }
    },
    {
      id: "reports-full",
      category: "reports",
      name: "تحقيق شامل - صفحة كاملة",
      description: "موضوع واحد يغطي كامل الصفحة بـ 8 أعمدة",
      page: {
        pageType: "reports",
        title: "تحقيقات",
        gridColumns: 8,
        layoutTemplate: "reports-full",
        items: [
          { id: "ph-11", title: "عنوان التحقيق الشامل", content: "محتوى التحقيق", importance: "high", imageSize: "full", colSpan: 8, rowSpan: 2, columns: 8, sourceType: "article", order: 0 } as NewspaperArticleRef,
        ]
      }
    }
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2">
              <LayoutTemplate className="w-6 h-6 text-amber-500" />
              <span>مكتبة القوالب الإخراجية (Templates Gallery)</span>
            </h2>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
              اختر تخطيطاً مسبق الصنع من بين عشرات الأنماط المصممة لمعايير الطباعة الاحترافية.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {['all', 'cover', 'news', 'articles', 'reports'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat 
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' 
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {cat === 'all' ? 'الكل' : cat === 'cover' ? 'أغلفة' : cat === 'news' ? 'أخبار' : cat === 'articles' ? 'مقالات' : 'تحقيقات'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-amber-500 transition-colors group cursor-pointer flex flex-col justify-between">
                <div>
                  <div className="aspect-[3/4] bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-4 border border-slate-100 dark:border-slate-800 p-2 flex flex-col gap-2">
                    {/* Visual representation of the layout */}
                    <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded-md w-3/4 mx-auto mb-2 opacity-50"></div>
                    <div className="flex gap-2 flex-1">
                      {template.page.gridColumns === 6 && (
                        <>
                          <div className="w-2/3 bg-slate-200 dark:bg-slate-800 rounded-md flex-1"></div>
                          <div className="w-1/3 bg-slate-200 dark:bg-slate-800 rounded-md flex-1"></div>
                        </>
                      )}
                      {template.page.gridColumns === 4 && (
                        <>
                          <div className="w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md flex-1"></div>
                          <div className="w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md flex-1"></div>
                        </>
                      )}
                      {template.page.gridColumns === 8 && (
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-md flex-1"></div>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-black">{template.name}</h3>
                  <p className="text-xs font-bold opacity-70 mt-1">{template.description}</p>
                </div>
                
                <button
                  onClick={() => onApplyTemplate(template.page as NewspaperPage)}
                  className="w-full mt-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl transition-colors flex justify-center items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>تطبيق هذا التخطيط</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
