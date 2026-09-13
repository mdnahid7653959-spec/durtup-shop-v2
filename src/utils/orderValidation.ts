/**
 * Utility to identify and filter out test/mock/fake orders created during development
 */
export function isMockOrder(o: any): boolean {
  if (!o) return true;

  const num = (o.order_number || o.orderNumber || o.id || "").toString().toLowerCase().trim();
  const name = (
    o.shipping_address?.full_name || 
    o.shipping_address?.name || 
    o.customer_name || 
    o.name || 
    ""
  ).toString().toLowerCase().trim();
  const phone = (
    o.shipping_address?.phone || 
    o.customer_phone || 
    o.phone || 
    ""
  ).toString().replace(/\s+/g, "").trim();
  const email = (
    o.shipping_address?.email || 
    o.customer_email || 
    o.email || 
    ""
  ).toString().toLowerCase().trim();

  // 1. Explicit mock numbers and test prefixes
  if (
    num === "ord-2026-1001" || 
    num === "ord-2026-1002" || 
    num === "ord-1001" || 
    num === "ord-1002" ||
    num.includes("mock") ||
    num.includes("test")
  ) {
    return true;
  }

  // 2. Known test customer names from development
  if (
    name.includes("rahim ahmed") || 
    name.includes("fatema tuz zohra") ||
    name.includes("nahid bokar") ||
    name.includes("nahid hekar") ||
    name.includes("md nahid") ||
    name.includes("md omor") ||
    name.includes("omor faruk") ||
    name.includes("bhupati changma") ||
    name.includes("test user") ||
    name.includes("fake")
  ) {
    return true;
  }

  // 3. Known test customer phone numbers from development
  if (
    phone.includes("01711223344") || 
    phone.includes("01899887766") ||
    phone.includes("01851500461") ||
    phone.includes("01622530550") ||
    phone.includes("01885985097") ||
    phone.includes("0123456789")
  ) {
    return true;
  }

  // 4. Known test email addresses
  if (
    email.includes("test@") ||
    email.includes("example.com") ||
    email.includes("nusratjan964") ||
    email.includes("nahid467265") ||
    email.includes("ilogramch")
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
