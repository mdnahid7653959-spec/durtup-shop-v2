import { useEffect } from "react";

// Preload route modules in idle background time so user clicks are instant (0ms delay)
const criticalRoutes = [
  () => import("@/pages/Products"),
  () => import("@/pages/ProductDetail"),
  () => import("@/pages/Search"),
  () => import("@/pages/Cart"),
  () => import("@/pages/CategoryPage"),
  () => import("@/pages/Checkout"),
  () => import("@/pages/Account"),
];

export function RoutePrefetcher() {
  useEffect(() => {
    // Only prefetch after the initial page has settled (1.8s delay) and during browser idle
    const timer = setTimeout(() => {
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => {
          prefetchNext(0);
        }, { timeout: 3000 });
      } else {
        prefetchNext(0);
      }
    }, 1800);

    const prefetchNext = (index: number) => {
      if (index >= criticalRoutes.length) return;
      try {
        criticalRoutes[index]().catch(() => {});
      } catch {}
      // Stagger imports to avoid network congestion
      setTimeout(() => prefetchNext(index + 1), 350);
    };

    return () => clearTimeout(timer);
  }, []);

  return null;
}
