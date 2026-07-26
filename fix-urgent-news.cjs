const fs = require('fs');

let layoutCode = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const urgentNewsBannerCode = `function UrgentNewsBanner() {
  const [urgentNewsList, setUrgentNewsList] = useState<UrgentNews[]>([]);
  const [tickerSpeed, setTickerSpeed] = useState(25);
  const [tickerTitle, setTickerTitle] = useState("خبر عاجل");
  const [isVisible, setIsVisible] = useState(true);

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
      setUrgentNewsList([...validItemsRef.current]); // Just to trigger a re-render
    }, 10000);

    return () => {
      active = false;
      unsubUrgent();
      clearInterval(interval);
    };
  }, []);
`;

// Wait, the regular set interval above refers to validItemsRef which isn't there. 
// Let's implement it correctly using an effect that updates 'now'.
