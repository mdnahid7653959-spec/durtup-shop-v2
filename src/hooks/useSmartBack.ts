import { useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const STORAGE_KEY = "durtup_nav_history_stack";

function getHistoryStack(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function setHistoryStack(stack: string[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stack.slice(-50)));
  } catch {}
}

/**
 * Global tracker to record internal route navigations into sessionStorage.
 * Mount this once inside <BrowserRouter> (e.g. in App.tsx or AppLayout.tsx).
 */
export function useAppHistoryTracker() {
  const location = useLocation();

  useEffect(() => {
    const currentUrl = location.pathname + location.search + location.hash;
    const stack = getHistoryStack();
    const lastUrl = stack[stack.length - 1];

    if (lastUrl !== currentUrl) {
      stack.push(currentUrl);
      setHistoryStack(stack);
    }
  }, [location.pathname, location.search, location.hash]);
}

/**
 * Smart Back hook that seamlessly navigates to the previous page within the site
 * (e.g. Product B -> Product A), or gracefully falls back to Home ('/') if the user
 * landed directly on the page without prior navigation.
 */
export function useSmartBack(fallbackPath: string = "/") {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = useCallback(() => {
    const stack = getHistoryStack();
    const currentUrl = location.pathname + location.search + location.hash;

    // Remove any trailing duplicates matching current URL
    while (stack.length > 0 && stack[stack.length - 1] === currentUrl) {
      stack.pop();
    }

    if (stack.length > 0) {
      const targetPreviousUrl = stack.pop();
      setHistoryStack(stack);
      
      // If browser history has entries, navigate(-1) gives native smooth transition
      if (typeof window !== "undefined" && window.history.length > 1) {
        navigate(-1);
      } else if (targetPreviousUrl) {
        navigate(targetPreviousUrl);
      } else {
        navigate(fallbackPath);
      }
    } else {
      // Fallback for direct entrance
      if (typeof window !== "undefined" && window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(fallbackPath);
      }
    }
  }, [navigate, location.pathname, location.search, location.hash, fallbackPath]);

  return handleBack;
}
