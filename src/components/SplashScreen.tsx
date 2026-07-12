import { useEffect, useState } from "react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

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

    return () => clearTimeout(timer);
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
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            // Fallback to /splash.png or /logo.png if the custom images are not yet uploaded
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
