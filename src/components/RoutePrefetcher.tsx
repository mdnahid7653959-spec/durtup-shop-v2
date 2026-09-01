import { useEffect } from "react";

// Route loader map for instant on-demand and idle prefetching
const routeLoaders: Record<string, () => Promise<any>> = {
  "/": () => import("@/pages/Index"),
  "/products": () => import("@/pages/Products"),
  "/categories": () => import("@/pages/Categories"),
  "/category": () => import("@/pages/CategoryPage"),
  "/product": () => import("@/pages/ProductDetail"),
  "/cart": () => import("@/pages/Cart"),
  "/checkout": () => import("@/pages/Checkout"),
  "/account": () => import("@/pages/Account"),
  "/orders": () => import("@/pages/Orders"),
  "/messages": () => import("@/pages/Messages"),
  "/wishlist": () => import("@/pages/Wishlist"),
  "/search": () => import("@/pages/Search"),
  "/login": () => import("@/pages/Login"),
  "/register": () => import("@/pages/Register"),
  "/admin": () => import("@/pages/admin/AdminDashboard"),
  "/admin/login": () => import("@/pages/admin/AdminLogin"),
  "/admin/dashboard": () => import("@/pages/admin/AdminDashboard"),
  "/admin/products": () => import("@/pages/admin/AdminProducts"),
  "/admin/orders": () => import("@/pages/admin/AdminOrders"),
  "/admin/categories": () => import("@/pages/admin/AdminCategories"),
  "/admin/brands": () => import("@/pages/admin/AdminBrands"),
  "/admin/inventory": () => import("@/pages/admin/AdminInventory"),
  "/admin/returns": () => import("@/pages/admin/AdminReturns"),
  "/admin/users": () => import("@/pages/admin/AdminUsers"),
  "/admin/settings": () => import("@/pages/admin/AdminSettings"),
};

const prefetchedSet = new Set<string>();

/**
 * Instantly prefetch a route component chunk on hover/touch before the user finishes clicking
 */
export function prefetchRoute(href: string) {
  if (!href) return;
  const path = href.split("?")[0].split("#")[0].toLowerCase();
  
  // Direct match
  if (routeLoaders[path] && !prefetchedSet.has(path)) {
    prefetchedSet.add(path);
    routeLoaders[path]().catch(() => {});
    return;
  }

  // Prefix match (e.g., /category/electronics, /product/item-1)
  if (path.startsWith("/category/") && !prefetchedSet.has("/category")) {
    prefetchedSet.add("/category");
    routeLoaders["/category"]().catch(() => {});
    return;
  }
  if ((path.startsWith("/product/") || path.startsWith("/p/") || path.startsWith("/item/")) && !prefetchedSet.has("/product")) {
    prefetchedSet.add("/product");
    routeLoaders["/product"]().catch(() => {});
    return;
  }
  if (path.startsWith("/admin/") && !prefetchedSet.has("/admin/dashboard")) {
    prefetchedSet.add("/admin/dashboard");
    routeLoaders["/admin/dashboard"]().catch(() => {});
  }
}

// Attach hover listener globally to all <a> and <button> elements with data-href or href
if (typeof window !== "undefined") {
  const handlePointerInteraction = (e: Event) => {
    const target = (e.target as HTMLElement)?.closest("a[href], [data-prefetch-href]");
    if (!target) return;
    const href = target.getAttribute("href") || target.getAttribute("data-prefetch-href");
    if (href && (href.startsWith("/") || href.startsWith("#"))) {
      prefetchRoute(href);
    }
  };

  // Passive hover & touch listeners for 0ms lag-free click readiness
  window.addEventListener("mouseover", handlePointerInteraction, { passive: true });
  window.addEventListener("touchstart", handlePointerInteraction, { passive: true });
}

export function RoutePrefetcher() {
  useEffect(() => {
    // Sequentially prefetch all critical routes during browser idle time
    const routesToPrefetch = [
      "/products",
      "/categories",
      "/cart",
      "/messages",
      "/category",
      "/product",
      "/checkout",
      "/account",
      "/orders",
      "/search",
      "/wishlist",
      "/admin",
      "/admin/orders",
      "/admin/products"
    ];

    const runIdlePrefetch = () => {
      let idx = 0;
      const step = () => {
        if (idx >= routesToPrefetch.length) return;
        const route = routesToPrefetch[idx++];
        prefetchRoute(route);
        setTimeout(step, 100);
      };
      step();
    };

    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(runIdlePrefetch, { timeout: 2000 });
    } else {
      setTimeout(runIdlePrefetch, 500);
    }
  }, []);

  return null;
}
