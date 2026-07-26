const fs = require('fs');

let layoutCode = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const regex = /function UrgentNewsBanner\(\) \{[\s\S]*?export function Layout/m;

const replacement = `function UrgentNewsBanner() {
  const [urgentNewsList, setUrgentNewsList] = useState<UrgentNews[]>([]);
  const [tickerSpeed, setTickerSpeed] = useState(25);
  const [tickerTitle, setTickerTitle] = useState("خبر عاجل");
  const [isVisible, setIsVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const audioContextReft = useRef<AudioContext | null>(null);

  const playAlertSound = () => {
    try {
      if (!audioContextReft.current) {
        audioContextReft.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextReft.current;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log("Audio play failed", e);
    }
  };

  useEffect(() => {
    let active = true;

    // Sync active urgent news (filtering out manually cancelled items) using real-time listener
    const q = query(
      collection(db, "urgentNews"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubUrgent = onSnapshot(q, (snap) => {
      if (!active) return;
      const validItems = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UrgentNews))
        .filter(item => item.isActive !== false);
      
      setUrgentNewsList(validItems);
      
      // Notify for very fresh news
      if (validItems.length > 0) {
        const now = Date.now();
        const latest = validItems[0];
        if (latest.createdAt && now - latest.createdAt < 15000) {
          playAlertSound();
        }
      }
    }, (error) => {
      console.error("Error fetching urgent news:", error);
    });

    // Load speed settings
    const loadSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "urgentNews"));
        if (docSnap.exists()) {
          setTickerSpeed(docSnap.data().speed || 25);
          setTickerTitle(docSnap.data().title || "خبر عاجل");
        }
      } catch (e) {}
    };

    loadSettings();

    // Re-render periodically to handle expiration
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000);

    return () => {
      active = false;
      unsubUrgent();
      clearInterval(interval);
    };
  }, []);

  if (!isVisible || urgentNewsList.length === 0) return null;

  // Find the static item: the newest active item that hasn't expired
  const staticItem = urgentNewsList.find(item => item.expiresAt && item.expiresAt > currentTime);
  
  // The rest go to the scrolling marquee
  const scrollingItems = urgentNewsList.filter(item => item.id !== staticItem?.id);

  // If there's nothing to show in the marquee and no static item, return null
  if (scrollingItems.length === 0 && !staticItem) return null;

  // Prepare marquee items
  const reversedNews = [...scrollingItems].reverse();
  const displayItems = [...reversedNews, ...reversedNews, ...reversedNews, ...reversedNews];
  const baseChars = reversedNews.reduce((acc, item) => acc + (item.text?.length || 0), 0);
  const effectiveLength = baseChars + reversedNews.length * 20; // 20 chars equivalent for separator
  const totalLengthToAnimate = 2 * effectiveLength;
  const calculatedDuration = Math.max(5, (totalLengthToAnimate / 100) * tickerSpeed);

  return (
    <AnimatePresence>
      <motion.div 
        key="urgent-news-ticker-container"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="relative z-50 w-full flex flex-col select-none"
        dir="rtl"
      >
        {/* The Scrolling Marquee */}
        {scrollingItems.length > 0 && (
          <div className="bg-gradient-to-r from-red-800 via-red-700 to-red-900 text-white shadow-2xl border-b-2 sm:border-b-4 border-red-900 overflow-hidden w-full">
            <div className="w-full flex flex-col relative pt-0.5 pb-0">
              <div className="flex items-center justify-between px-3 sm:px-5 z-20 shrink-0 font-cairo">
                <div className="flex items-center">
                  <span className="font-black text-sm sm:text-base text-amber-400 uppercase tracking-wider whitespace-nowrap drop-shadow-md">
                    {tickerTitle}
                  </span>
                </div>
                
                <button 
                  onClick={() => setIsVisible(false)} 
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white"
                  title="إغلاق الشريط"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="w-full overflow-hidden relative flex items-center group px-0 -mt-2 sm:-mt-2.5 mb-1" dir="ltr">
                <motion.div
                  className="flex items-center whitespace-nowrap min-w-max"
                  animate={{ x: ["-50%", "0%"] }}
                  transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration: calculatedDuration,
                  }}
                >
                  {displayItems.map((newsItem, index) => (
                    <React.Fragment key={\`\${newsItem.id}-\${index}\`}>
                      <span className="font-bold text-sm sm:text-base md:text-lg lg:text-xl text-white tracking-wide leading-relaxed font-cairo whitespace-nowrap px-2 sm:px-3 drop-shadow-md" dir="rtl">
                        {newsItem.text}
                      </span>
                      <div className="inline-flex items-center px-1 sm:px-2 shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-center group-hover:scale-110 transition-transform">
                          <img 
                            src="/tape.png" 
                            alt="شعار منصة تعز" 
                            className="w-6 h-6 sm:w-7 sm:h-7 object-contain drop-shadow-lg mx-0.5 sm:mx-1" 
                          />
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        )}

        {/* The Static Breaking News Bar */}
        {staticItem && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-red-900/95 backdrop-blur-md border-b border-red-500/20 py-1.5 px-3 sm:px-5 flex items-center shadow-inner"
          >
            <div className="flex items-center gap-3 w-full max-w-[2000px] mx-auto overflow-hidden">
              <span className="shrink-0 inline-flex items-center justify-center px-2 py-0.5 bg-white text-red-700 font-black text-[10px] sm:text-xs rounded shadow-sm animate-pulse font-cairo">
                عاجل
              </span>
              <p className="text-white font-bold text-xs sm:text-sm md:text-base font-cairo truncate leading-tight w-full">
                {staticItem.text}
              </p>
            </div>
            
            {/* If there's NO scrolling items, show the close button here */}
            {scrollingItems.length === 0 && (
              <button 
                onClick={() => setIsVisible(false)} 
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white shrink-0 mr-2"
                title="إغلاق الشريط"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export function Layout`;

layoutCode = layoutCode.replace(regex, replacement);
fs.writeFileSync('src/components/Layout.tsx', layoutCode);
