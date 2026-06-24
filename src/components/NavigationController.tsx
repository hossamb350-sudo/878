import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";

export function NavigationController() {
  const location = useLocation();
  const navigate = useNavigate();
  const locationRef = useRef(location.pathname);

  useEffect(() => {
    locationRef.current = location.pathname;

    // Scroll to top
    window.scrollTo(0, 0);
    
    // Attempt to scroll the main container
    const mainContainer = document.querySelector("main");
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    
    // Also try root if it's scrollable
    const rootContainer = document.getElementById("root");
    if (rootContainer) {
      rootContainer.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [location.pathname]);

  useEffect(() => {
    let active = true;
    let listener: any = null;

    const setupListener = async () => {
      try {
        listener = await CapacitorApp.addListener("backButton", (info) => {
          if (!active) return;

          const currentPath = locationRef.current;
          
          // Check if we can navigate back using React Router's history index
          // React Router v6+ stores an 'idx' in history.state
          const historyState = window.history.state;
          const historyIdx = historyState && typeof historyState.idx === 'number' ? historyState.idx : 0;

          if (historyIdx > 0) {
            // We have history to go back to
            navigate(-1);
          } else {
            // No history to go back to
            if (currentPath === "/") {
              const confirmExit = window.confirm("هل ترغب في الخروج من التطبيق؟");
              if (confirmExit) {
                CapacitorApp.exitApp();
              }
            } else {
              // We are not on the root page but no history? Navigate to root just in case
              navigate("/", { replace: true });
            }
          }
        });
      } catch (err) {
        console.log("Capacitor App plugin not available", err);
      }
    };

    setupListener();

    return () => {
      active = false;
      if (listener) {
        listener.remove();
      }
    };
  }, [navigate]);

  return null;
}
