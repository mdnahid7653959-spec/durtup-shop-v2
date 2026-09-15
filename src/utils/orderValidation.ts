/**
 * Utility to identify and filter out test/mock/fake orders created during development
 */
export function isMockOrder(o: any): boolean {
  if (!o) return true;

  // 1. Explicit boolean flag for mock test orders
  if (o.is_mock === true || o.isMock === true) {
    return true;
  }

  const num = (o.order_number || o.orderNumber || o.id || "").toString().toLowerCase().trim();

  // 2. Explicit legacy template mock numbers and test prefixes
  if (
    num === "ord-2026-1001" || 
    num === "ord-2026-1002" || 
    num === "ord-1001" || 
    num === "ord-1002" ||
    num.startsWith("mock-") ||
    num === "mock-order" ||
    num === "mock_order"
  ) {
    return true;
  }

  return false;
}

/**
 * Purge mock orders from browser LocalStorage caches
 */
export function purgeMockOrdersFromStorage(): void {
  if (typeof window === "undefined") return;
  try {
    ["enterprise_admin_orders", "local_orders"].forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const cleaned = list.filter((item: any) => !isMockOrder(item));
            localStorage.setItem(key, JSON.stringify(cleaned));
          }
        } catch {
          localStorage.removeItem(key);
        }
      }
    });
  } catch {}
}

