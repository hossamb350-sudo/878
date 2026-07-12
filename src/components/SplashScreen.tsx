import { useEffect, useState } from "react";
import { SplashScreen as CapSplashScreen } from "@capacitor/splash-screen";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Helper to hide native launch splash
  const hideNativeSplash = () => {
    CapSplashScreen.hide().catch((err) => {
      console.log("Not running on a native device or Capacitor SplashScreen plugin error", err);
    });
  };

  useEffect(() => {
    // Check local storage to see if this is the first launch of the app
    const alreadyLaunched = localStorage.getItem("taiz_app_already_launched");
    
    let selectedImage = "/splash_subsequent.png";
    let duration = 3000; // Subsequent launch duration: 3 seconds
    if (alreadyLaunched !== "true") {
      selectedImage = "/splash_first.png";
      duration = 5000; // First launch duration: 5 seconds
    }
    
    setImageSrc(selectedImage);

    // Auto-transition to home after the selected duration
    const timer = setTimeout(() => {
      if (alreadyLaunched !== "true") {
        // Record that the first launch has completed successfully
        localStorage.setItem("taiz_app_already_launched", "true");
      }
      onComplete();
    }, duration);

    // Fallback safety to ensure native splash screen is hidden eventually
    const safetyTimer = setTimeout(() => {
      hideNativeSplash();
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0b172a] flex items-center justify-center select-none overflow-hidden pb-safe">
      {imageSrc && (
        <img
          src={imageSrc}
          alt="شاشة البداية"
          className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => {
            setIsLoaded(true);
            hideNativeSplash();
          }}
          onError={(e) => {
            hideNativeSplash();
            // Fallback to /splash.png or /logo.png if the custom images are not yet uploaded or fail to load
            const target = e.target as HTMLImageElement;
            if (target.src.includes("splash_first") || target.src.includes("splash_subsequent")) {
              target.src = "/splash.png";
            }
          }}
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}
