import React, { useState, useRef } from "react";
import {
  NewspaperIssue,
  NewspaperPage,
  NewspaperArticleRef,
} from "../types";
import { NewspaperLayoutEngine } from "./NewspaperLayoutEngine";
import { LazyPage } from "./LazyPage";
import { NewspaperThumbnails } from "./NewspaperThumbnails";
import {
  Printer,
  Download,
  Share2,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Calendar,
  FileText,
  User,
  Quote,
  Sparkles,
  Eye,
  CheckCircle,
  Copy,
  LayoutGrid,
  Layers,
  ArrowRight,
  ExternalLink,
  List,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface NewspaperReaderProps {
  issue: NewspaperIssue;
  onClose?: () => void;
  isStandalonePage?: boolean;
}

export const NewspaperReader: React.FC<NewspaperReaderProps> = ({
  issue,
  onClose,
  isStandalonePage = false,
}) => {
  const [zoomScale, setZoomScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const scrollToPage = (idx: number) => {
    const pageElement = document.getElementById(`newspaper-page-${idx}`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Dynamic Size Resolution
  const getPageDimensions = () => {
    switch (issue.pageSize) {
      case "broadsheet": return { width: "380mm", height: "578mm" };
      case "berliner": return { width: "315mm", height: "470mm" };
      case "tabloid": return { width: "280mm", height: "430mm" };
      case "a3": return { width: "297mm", height: "420mm" };
      case "a4": return { width: "210mm", height: "297mm" };
      default: return { width: "380mm", height: "578mm" };
    }
  };
  const dimensions = getPageDimensions();

  const getMarginStyles = () => {
    return {
      paddingTop: `${issue.marginTop || 20}mm`,
      paddingBottom: `${issue.marginBottom || 20}mm`,
      paddingLeft: `${issue.marginLeft || 15}mm`,
      paddingRight: `${issue.marginRight || 15}mm`,
    };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true);

    // Wait for DOM to update and force all LazyPages to render
    setTimeout(async () => {
      try {
        const element = printRef.current;
        if (!element) return;
        
        const canvas = await html2canvas(element, {
        scale: 4, // High resolution for print (CMYK-ready equivalent)
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          // Replace oklch and oklab color expressions in all style elements to prevent html2canvas parsing errors
          const styleElements = clonedDoc.querySelectorAll("style");
          styleElements.forEach((style) => {
            if (style.textContent && (style.textContent.includes("oklch") || style.textContent.includes("oklab"))) {
              style.textContent = style.textContent.replace(/oklch\([^)]+\)/g, "#333333").replace(/oklab\([^)]+\)/g, "#333333");
            }
          });

          // Clean up inline styles if any contain oklch or oklab
          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style) {
              const styleCss = htmlEl.style.cssText;
              if (styleCss && (styleCss.includes("oklch") || styleCss.includes("oklab"))) {
                htmlEl.style.cssText = styleCss.replace(/oklch\([^)]+\)/g, "#333333").replace(/oklab\([^)]+\)/g, "#333333");
              }
            }
          });
        },
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0); // Highest quality JPEG
      
      // Map pageSize string to jsPDF formats, defaulting to a3 or a4 if not standard
      let format: string | number[] = "a4";
      if (issue.pageSize === "broadsheet") format = [380, 578]; // mm
      else if (issue.pageSize === "berliner") format = [315, 470];
      else if (issue.pageSize === "tabloid") format = [280, 430];
      else if (issue.pageSize === "a3") format = "a3";
      else if (issue.pageSize === "a4") format = "a4";
      else format = [380, 578]; // default to broadsheet

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: format,
        compress: true
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, "JPEG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${issue.title || "newspaper"}_${issue.issueNumber || "1"}.pdf`);
    } catch (err) {
      console.error("PDF Export error:", err);
      alert("تعذر تصدير الملف كـ PDF مباشرة، يمكنك استخدام زر الطباعة وحفظ الصفحة كـ PDF.");
    } finally {
      setIsExporting(false);
    }
    }, 500); // 500ms delay to allow DOM render and image loading
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/newspaper?issue=${issue.id}`;
    if (navigator.share) {
      navigator.share({
        title: `${issue.title} - ${issue.issueNumber}`,
        text: issue.mainHeadline || "اقرأ أحدث إصدار من الصحيفة الإلكترونية",
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Theme styling configurations
  const getThemeStyles = () => {
    switch (issue.theme) {
      case "dark_luxury":
        return {
          bg: "bg-slate-950 text-slate-100",
          paper: "bg-slate-900 border-slate-800 text-slate-100",
          accent: "text-[#d49a37]",
          headerBg: "bg-slate-900/90 border-slate-800",
          badge: "bg-[#d49a37]/20 text-[#d49a37] border-[#d49a37]/30",
        };
      case "modern":
        return {
          bg: "bg-slate-100 text-slate-900",
          paper: "bg-white border-slate-200 text-slate-900 shadow-xl",
          accent: "text-blue-700 dark:text-blue-400",
          headerBg: "bg-blue-900 text-white",
          badge: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "minimal":
        return {
          bg: "bg-stone-50 text-stone-900",
          paper: "bg-white border-stone-200 text-stone-900 shadow-md",
          accent: "text-stone-900",
          headerBg: "bg-stone-900 text-white",
          badge: "bg-stone-100 text-stone-800 border-stone-300",
        };
      case "tabloid":
        return {
          bg: "bg-zinc-100 text-zinc-900",
          paper: "bg-white border-zinc-300 text-zinc-900 shadow-2xl",
          accent: "text-red-700",
          headerBg: "bg-red-700 text-white",
          badge: "bg-red-100 text-red-800 border-red-200",
        };
      case "classic":
      default:
        return {
          bg: "bg-amber-50/50 text-neutral-900",
          paper: "bg-[#fffdfa] border-amber-900/20 text-neutral-900 shadow-2xl",
          accent: "text-amber-900",
          headerBg: "bg-[#2c1d11] text-amber-50",
          badge: "bg-amber-100 text-amber-900 border-amber-300",
        };
    }
  };

  const themeStyle = getThemeStyles();

  return (
    <div className={`min-h-screen ${themeStyle.bg} dir-rtl print:bg-white print:text-black`}>
      {/* Printable CSS rules */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-full-page { width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
          .page-break { page-break-after: always; }
        }
      `}</style>

      {/* Top Bar Navigation (Hidden in Print) */}
      <header className={`no-print sticky top-0 z-50 backdrop-blur-md ${themeStyle.headerBg} border-b px-4 py-3 shadow-lg flex items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-current transition-all flex items-center gap-1 font-bold text-xs"
            >
              <ArrowRight className="w-4 h-4" />
              <span>إغلاق المعاينة</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#d49a37] to-[#966b1a] flex items-center justify-center text-white shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight leading-tight">
                {issue.title || "الصحيفة الإلكترونية"}
              </h1>
              <p className="text-[10px] opacity-75 font-semibold">
                {issue.issueNumber} • {issue.publishDate}
              </p>
            </div>
          </div>
        </div>

        {/* Zoom Controls & Actions */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="hidden md:flex items-center gap-1 bg-black/10 dark:bg-white/10 p-1 rounded-xl border border-white/10 mr-4">
            <button
              onClick={() => setShowThumbnails(true)}
              className="px-3 py-1.5 rounded-lg hover:bg-white/20 text-current transition-colors font-bold text-xs flex items-center gap-1.5"
              title="فهرس الصفحات"
            >
              <List className="w-4 h-4" />
              <span>الفهرس</span>
            </button>
            <div className="w-px h-5 bg-white/20 mx-1"></div>
            <button
              onClick={() => setZoomScale(s => Math.max(0.5, s - 0.1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 text-current transition-colors font-bold"
              title="تصغير"
            >
              -
            </button>
            <span className="text-xs font-bold w-12 text-center select-none">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale(s => Math.min(2, s + 0.1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 text-current transition-colors font-bold"
              title="تكبير"
            >
              +
            </button>
          </div>

          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all font-bold text-xs flex items-center gap-1.5"
            title="مشاركة الإصدار"
          >
            {copiedLink ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{copiedLink ? "تم النسخ!" : "مشاركة"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all font-bold text-xs flex items-center gap-1.5"
            title="طباعة الإصدار"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">طباعة</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#d49a37] to-[#b37f2c] text-white hover:brightness-110 transition-all font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "جاري التصدير..." : "تحميل PDF"}</span>
          </button>
        </div>
      </header>

      <NewspaperThumbnails issue={issue} isOpen={showThumbnails} setIsOpen={setShowThumbnails} onSelectPage={scrollToPage} />

      {/* Main Newspaper Container */}
      <main className="max-w-full overflow-x-auto mx-auto px-2 sm:px-4 py-6 flex justify-center bg-slate-200 dark:bg-slate-950">
        {/* Newspaper Pages Printable Wrapper */}
        <div 
          ref={printRef} 
          className="space-y-8 pb-24 flex flex-col items-center"
          style={{ zoom: zoomScale }}
        >
          {(issue.pages || []).map((page, pIdx) => {
            if (!page) return null;
            const isCover = page.pageType === "cover" || pIdx === 0;

            return (
              <LazyPage
                key={page.id || pIdx}
                className={`print-full-page page-break border ${themeStyle.paper} relative overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-2xl`}
                width={dimensions.width}
                minHeight={dimensions.height}
                forceLoad={isExporting}
                id={`newspaper-page-${pIdx}`}
                style={{
                  ...getMarginStyles(),
                  fontFamily: issue.fontFamily || "'IBM Plex Sans Arabic', sans-serif",
                }}
              >
                {/* Traditional Broadsheet Header Header Banner */}
                <div>
                  <header className="border-b-4 border-double border-current pb-4 mb-6">
                    {/* Top Metadata Bar */}
                    <div className="flex flex-wrap items-center justify-between text-xs font-extrabold border-b border-current/20 pb-2 mb-3 gap-2 opacity-80">
                      <div className="flex items-center gap-3">
                        <span>{issue.issueNumber}</span>
                        <span>•</span>
                        <span>{issue.hijriDate || "1447 هـ"}</span>
                        <span>•</span>
                        <span>{issue.publishDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="uppercase tracking-widest">{issue.subTitle || "منصة تعز الإعلامية"}</span>
                        <span>•</span>
                        <span>صفحة {page.pageNumber || pIdx + 1} من {issue.pages?.length || 1}</span>
                      </div>
                    </div>

                    {/* Master Newspaper Title Box */}
                    {isCover ? (
                      <div className="text-center my-4 space-y-2">
                        <div className="flex items-center justify-center gap-4 mb-2">
                          {issue.logoUrl && (
                            <img
                              src={issue.logoUrl}
                              alt="Logo"
                              className="h-16 w-auto object-contain"
                            />
                          )}
                          <h1 className="text-5xl sm:text-7xl font-black tracking-tight uppercase drop-shadow-sm" style={{ fontSize: '100pt', lineHeight: 1.1 }}>
                            {issue.title || "صحيفة تعز الإعلامية"}
                          </h1>
                        </div>
                        <p className="text-sm font-bold opacity-80 max-w-2xl mx-auto" style={{ fontSize: '16pt' }}>
                          {issue.subTitle || "صحيفة إلكترونية متكاملة تصدر عن منصة تعز الإعلامية"}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between border-b-2 border-current/30 pb-2">
                        <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2" style={{ fontSize: '30pt' }}>
                          <span className={`w-3 h-3 rounded-full ${themeStyle.accent}`} />
                          <span>{page.title}</span>
                          {page.subtitle && (
                            <span className="text-sm font-normal opacity-70 border-r border-current/40 pr-2 mr-2">
                              {page.subtitle}
                            </span>
                          )}
                        </h2>
                        <span className="text-sm font-bold opacity-75">{issue.title}</span>
                      </div>
                    )}
                  </header>

                  {/* Front Cover Special Section: Chief Editor Note / Main Headline */}
                  {isCover && (issue.mainHeadline || issue.editorNoteContent) && (
                    <section className="mb-8 p-5 bg-black/5 dark:bg-white/5 rounded-2xl border border-current/15 grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Main Headline Hero Banner */}
                      {issue.mainHeadline && (
                        <div className={`${issue.editorNoteContent ? "lg:col-span-2" : "lg:col-span-3"} space-y-3`}>
                          <span className={`inline-block text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${themeStyle.badge}`}>
                            مانشيت العدد الرئيسي
                          </span>
                          <h2 className="font-black leading-tight text-balance" style={{ fontSize: '56pt' }}>
                            {issue.mainHeadline}
                          </h2>
                          {issue.mainHeadlineSummary && (
                            <p className="font-semibold opacity-90 leading-relaxed" style={{ fontSize: '18pt' }}>
                              {issue.mainHeadlineSummary}
                            </p>
                          )}
                          {issue.coverImage && (
                            <div className="mt-4 rounded-xl overflow-hidden border border-current/20 shadow-md max-h-[400px]">
                              <img
                                src={issue.coverImage}
                                alt="Main Cover"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Chief Editor Note Box */}
                      {issue.editorNoteContent && (
                        <div className="p-5 bg-amber-500/10 dark:bg-amber-500/5 rounded-xl border border-amber-500/30 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-sm uppercase mb-3">
                              <Quote className="w-5 h-5" />
                              <span>{issue.editorNoteTitle || "افتتاحية العدد"}</span>
                            </div>
                            <p className="font-medium leading-relaxed italic whitespace-pre-line opacity-95" style={{ fontSize: '12pt', lineHeight: 1.6 }}>
                              "{issue.editorNoteContent}"
                            </p>
                          </div>
                          <div className="mt-4 pt-4 border-t border-current/20 text-left">
                            <p className="font-black" style={{ fontSize: '14pt' }}>{issue.chiefEditorName || "رئيس التحرير"}</p>
                            <p className="opacity-75" style={{ fontSize: '11pt' }}>{issue.chiefEditorTitle || "منصة تعز الإعلامية"}</p>
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  {/* Articles / Items Newspaper Grid Layout */}
                  <NewspaperLayoutEngine page={page} issue={issue} themeStyle={themeStyle} />
                </div>

                {/* Classic Newspaper Footer */}
                <footer className="mt-12 pt-3 border-t-2 border-current/30 flex items-center justify-between text-[10px] font-extrabold opacity-70">
                  <div>تصدر عن منصة تعز الإعلامية • جميع الحقوق محفوظة</div>
                  <div>صفحة {page.pageNumber || pIdx + 1}</div>
                </footer>
              </LazyPage>
            );
          })}
        </div>
      </main>
    </div>
  );
};
