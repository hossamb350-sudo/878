import re

with open("src/pages/watch/[slug].tsx", "r") as f:
    content = f.read()

# Add import if missing
if "LeaderCustomPlayer" not in content:
    import_statement = 'import { LeaderCustomPlayer } from "../../components/leader/LeaderCustomPlayer";\n'
    content = content.replace('import { motion, AnimatePresence } from "motion/react";', import_statement + 'import { motion, AnimatePresence } from "motion/react";')

# Find the start of the return block
# We know it starts with '  return (\n    <div className="min-h-screen'
pattern = re.compile(r'  return \(\n    <div className="min-h-screen bg-white font-sans rtl select-none".*', re.DOTALL)

# Let's extract formatPublishInfo from leader
leader_code = """
  // Date Formatter
  const formatPublishInfo = (timestamp: number) => {
    const d = new Date(timestamp || Date.now());
    const mDate = format(d, "dd MMMM yyyy", { locale: ar });
    let hDate = "";
    try {
      const formatted = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(d).trim();
      hDate = formatted.endsWith("هـ") ? formatted : `${formatted} هـ`;
    } catch {
      hDate = "";
    }
    return { mDate, hDate };
  };
  const { mDate, hDate } = formatPublishInfo(video?.createdAt || Date.now());
"""

new_return = """  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="min-h-screen bg-[#f8fafc] text-slate-900 py-3 sm:py-5 px-3 sm:px-4 md:px-6 font-cairo pb-20 transition-colors duration-300 relative select-none"
      dir="rtl"
    >
      <SEO 
        title={video.title}
        description={video.description || video.title}
        imageUrl={video.thumbnailUrl || ""}
        type="video.other"
        path={window.location.pathname}
      />

      <div className="max-w-4xl mx-auto w-full space-y-3.5">
        
        {/* Navigation Breadcrumb Bar */}
        <div className="flex items-center justify-between bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-soft text-xs">
          <Link
            to={routes.watch()}
            className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-taiz-sky transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 text-taiz-sky" />
            <span>قسم ميديا</span>
            <span className="text-slate-400">/</span>
            <span className="text-taiz-royal font-bold truncate max-w-[200px] sm:max-w-xs">
              عرض مرئي
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleBookmark}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isFavorited
                  ? "bg-taiz-sky text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
              title="حفظ"
            >
              <Bookmark className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 1. VIDEO VIEW COMPONENT (Single Unified Card) */}
        {/* ============================================================== */}
        <div className="relative rounded-[20px] sm:rounded-[24px] bg-white border border-slate-200 overflow-hidden shadow-soft mb-6 sm:mb-8">
          {/* Embedded Custom Video Player */}
          <LeaderCustomPlayer
            videoUrl={video.url}
            thumbnailUrl={video.thumbnailUrl}
            title={video.title}
            onPlay={handlePlayVideo}
            isEmbedded={true}
          />

          {/* Video Metadata & Details inside same card */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{mDate}</span>
                </span>
                {hDate && <span className="text-slate-500">{hDate}</span>}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                <Eye className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                <span>{(video.views || 0).toLocaleString("ar-EG")} مشاهدة</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-base sm:text-xl font-bold leading-snug text-slate-900 font-cairo">
              {video.title}
            </h1>

            {/* Description */}
            {video.description && (
              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs sm:text-sm font-tajawal leading-relaxed whitespace-pre-line">
                {video.description}
              </div>
            )}
            
            {/* Social Sharing Bar */}
            <div className="bg-[#fafafa] border border-slate-200/70 rounded-full px-3.5 sm:px-5 py-2 sm:py-2.5 shadow-xs flex items-center justify-between max-w-full mx-auto backdrop-blur-sm mt-4">
              <button 
                onClick={toggleBookmark}
                className={`p-2 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${isFavorited ? 'text-taiz-sky' : 'text-slate-400 hover:text-slate-700'}`}
                title="حفظ"
              >
                <Bookmark className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>

              <div className="flex items-center gap-2" dir="ltr">
                <button 
                  onClick={() => handleShare("telegram")} 
                  className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-sky-400 transition-all duration-200 cursor-pointer shadow-2xs"
                  title="مشاركة عبر تليجرام"
                >
                  <Send className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleShare("facebook")} 
                  className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-all duration-200 cursor-pointer shadow-2xs"
                  title="مشاركة عبر فيسبوك"
                >
                  <Facebook className="w-4.5 h-4.5" />
                </button>
                <button 
                  onClick={() => handleShare("twitter")} 
                  className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-black transition-all duration-200 cursor-pointer shadow-2xs"
                  title="مشاركة عبر إكس"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                <button 
                  onClick={() => handleShare("whatsapp")} 
                  className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-emerald-500 transition-all duration-200 cursor-pointer shadow-2xs"
                  title="مشاركة عبر واتساب"
                >
                  <MessageCircle className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* "See Also" Section */}
        {recentVideos.length > 0 && (
          <div className="pb-12">
            <div className="flex gap-3 mb-6 px-1">
              <h2 className="text-lg font-black text-slate-900 font-ibm">شاهد أيضاً</h2>
              <div className="w-1 bg-red-600 rounded-full h-5 mt-1.5"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentVideos.map((vid) => (
                <Link 
                  key={vid.id}
                  to={routes.watchItem(generateSlug(vid.title || "", vid.id))} 
                  className="group relative w-full rounded-[16px] overflow-hidden bg-white border border-slate-200/90 hover:border-taiz-sky/50 shadow-soft hover:shadow-medium flex flex-col md:flex-row items-stretch transition-all duration-300 block"
                >
                  <div className="relative w-full md:w-[42%] shrink-0 aspect-video md:aspect-auto min-h-[140px] overflow-hidden bg-slate-900 flex items-center justify-center border-b md:border-b-0 md:border-l border-slate-100">
                    {vid.thumbnailUrl ? (
                      <img 
                        src={vid.thumbnailUrl} 
                        alt={vid.title} 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                    ) : (
                      <VideoIcon className="w-8 h-8 text-white/20" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-taiz-sky shadow-md transition-all border border-white/40">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                    {vid.duration && (
                      <div className="absolute bottom-2 left-2 z-10 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold text-white font-mono border border-white/10">
                        {vid.duration}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col justify-between p-3.5 flex-1 w-full bg-white">
                    <h3 className="font-bold text-slate-800 text-[13px] leading-[1.6] line-clamp-2 group-hover:text-taiz-sky transition-colors font-cairo">
                      {vid.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(vid.createdAt || Date.now(), "dd MMM yyyy", { locale: ar })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
"""

if "return (" in content:
    # Let's insert the formatPublishInfo just before the final return
    # Find the line '  return (\n    <div className="min-h-screen'
    
    parts = content.split('  return (\n    <div className="min-h-screen bg-white font-sans rtl select-none" dir="rtl">')
    if len(parts) == 2:
        new_content = parts[0] + leader_code + new_return
        with open("src/pages/watch/[slug].tsx", "w") as f:
            f.write(new_content)
        print("Success")
    else:
        print("Could not split file correctly")
else:
    print("Return not found")
