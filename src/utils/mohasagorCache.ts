import type { Product } from "@/components/products/ProductCard";
import { calculateProductPrice } from "@/utils/pricingMargin";
import { getSmartProductImage } from "@/utils/productImageHelper";
import { extractProductVariants } from "@/utils/productVariantHelper";
import { FAST_SEED_PRODUCTS } from "@/data/fastSeedCatalog";
export { FAST_SEED_PRODUCTS };
import { findCategoryOrSubcategory, CATEGORIES_DATA } from "@/data/categoriesData";
import { EcomsellerEngine } from "@/services/suppliers/ecomsellerEngine";
import { getFastProduct, saveFastProduct } from "@/utils/fastProductStorage";

const MOHASAGOR_CACHE_KEY = "mohasagor_products_master_cache_v13";
const AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// IndexedDB configuration for unlimited, fast persistent storage
const IDB_NAME = "durtup_catalog_db";
const IDB_STORE = "products_store";
const IDB_KEY = "mohasagor_catalog_master_v13";
const IDB_VERSION = 1;

// Initialize in-memory cache synchronously with seed products for 0ms Instant First-Render!
let inMemoryProductsCache: Product[] | null = [...FAST_SEED_PRODUCTS];
let isFetchingAllPages = false;
let autoSyncTimer: number | null = null;
let lastSyncTimestamp: number | null = Date.now();

export function getInMemoryProducts(): Product[] {
  return inMemoryProductsCache && inMemoryProductsCache.length > 0 ? inMemoryProductsCache : FAST_SEED_PRODUCTS;
}

// Ultra-fast O(1) Hash Map Index for Instant Lookups
const productIndexMap = new Map<string, Product & { [key: string]: any }>();

// Populate Index Map immediately on module load
updateIndexMap(FAST_SEED_PRODUCTS);

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not supported"));
    }
    const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getIdbProducts(): Promise<Product[] | null> {
  try {
    const db = await openIdb();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => {
        const val = req.result;
        if (Array.isArray(val) && val.length > 0) {
          resolve(val);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setIdbProducts(products: Product[]): Promise<void> {
  if (!Array.isArray(products) || products.length === 0) return;
  try {
    const db = await openIdb();
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    store.put(products, IDB_KEY);
  } catch (err) {
    console.warn("IndexedDB save error:", err);
  }
}

export function updateIndexMap(products: (Product & { [key: string]: any })[]) {
  if (!Array.isArray(products)) return;
  products.forEach((p) => {
    if (!p) return;
    if (p.slug) {
      const s = String(p.slug).toLowerCase();
      productIndexMap.set(s, p);
      productIndexMap.set(encodeURIComponent(s), p);
    }
    if (p.id) {
      const idStr = String(p.id).toLowerCase();
      productIndexMap.set(idStr, p);
      productIndexMap.set(`product-${idStr}`, p);
      productIndexMap.set(`supplier-${idStr}`, p);
    }
    const slugStr = String(p.slug || "").toLowerCase();
    const suffixMatch = slugStr.match(/-(\d+)$/);
    if (suffixMatch) {
      productIndexMap.set(suffixMatch[1], p);
      productIndexMap.set(`product-${suffixMatch[1]}`, p);
    }
    if (p.sku) {
      const skuStr = String(p.sku).toLowerCase();
      productIndexMap.set(skuStr, p);
      productIndexMap.set(`product-${skuStr}`, p);
    }
    if (p.product_code) {
      const codeStr = String(p.product_code).toLowerCase();
      productIndexMap.set(codeStr, p);
      productIndexMap.set(`product-${codeStr}`, p);
    }
    if (p.supplier_sku) {
      const sSku = String(p.supplier_sku).toLowerCase();
      productIndexMap.set(sSku, p);
      productIndexMap.set(`ecom-${sSku}`, p);
    }
  });
}

export function findMohasagorProductSync(slugOrId: string): (Product & { [key: string]: any }) | null {
  if (!slugOrId) return null;
  let targetRaw = String(slugOrId);
  try {
    targetRaw = decodeURIComponent(targetRaw);
    if (targetRaw.includes("%")) {
      try { targetRaw = decodeURIComponent(targetRaw); } catch {}
    }
  } catch {}
  targetRaw = targetRaw.split("?")[0].split("&")[0].split("#")[0].trim().replace(/\/+$/, "").toLowerCase();
  if (!targetRaw) return null;
  
  if (productIndexMap.has(targetRaw)) return productIndexMap.get(targetRaw)!;

  const cleanId = targetRaw.replace(/^product-/, "").replace(/^supplier-/, "").replace(/^cj_/, "").replace(/^cj-/, "").replace(/^ecom-/, "").replace(/^ecom_/, "");
  if (productIndexMap.has(cleanId)) return productIndexMap.get(cleanId)!;
  if (productIndexMap.has(`ecom-${cleanId}`)) return productIndexMap.get(`ecom-${cleanId}`)!;

  const suffixMatch = targetRaw.match(/-(\d+)$/);
  const suffixId = suffixMatch ? suffixMatch[1] : (/^\d+$/.test(cleanId) ? cleanId : "");
  if (suffixId && productIndexMap.has(suffixId)) return productIndexMap.get(suffixId)!;

  // 0ms instant local/session storage cache
  const fast = getFastProduct(targetRaw) || (suffixId ? getFastProduct(suffixId) : null) || (cleanId ? getFastProduct(cleanId) : null);
  if (fast) {
    updateIndexMap([fast as any]);
    return fast as any;
  }

  // Fallback scan across in-memory cache
  if (inMemoryProductsCache && inMemoryProductsCache.length > 0) {
    const found = inMemoryProductsCache.find((p: any) => {
      const pSlug = String(p.slug || "").toLowerCase();
      const pId = String(p.id || "").toLowerCase();
      const pCode = String(p.product_code || p.sku || p.supplier_sku || "").toLowerCase();
      return pSlug === targetRaw || 
             pId === targetRaw || 
             pId === cleanId || 
             pId === `ecom-${cleanId}` ||
             pCode === cleanId || 
             pCode === targetRaw ||
             pSlug === `product-${cleanId}` ||
             (suffixId && (pId === suffixId || pCode === suffixId || pSlug.endsWith(`-${suffixId}`))) ||
             pSlug.endsWith(`-${cleanId}`);
    });
    if (found) {
      updateIndexMap([found as any]);
      return found as any;
    }
  }

  return null;
}


export function getLastSyncTime(): string | null {
  if (!lastSyncTimestamp) return null;
  return new Date(lastSyncTimestamp).toLocaleTimeString();
}

export const FALLBACK_SUPPLIER_PRODUCTS: Product[] = FAST_SEED_PRODUCTS;

export function startMohasagorAutoSync() {
  if (typeof window === "undefined") return;
  if (autoSyncTimer !== null) return;

  // Run auto-sync from live API every 5 minutes
  autoSyncTimer = window.setInterval(async () => {
    try {
      console.log("[Mohasagor Auto-Sync] Refreshing latest products (5-min interval)...");
      await fetchAllPagesMohasagorProducts(true);
    } catch (err) {
      console.warn("[Mohasagor Auto-Sync] Background sync error:", err);
    }
  }, AUTO_SYNC_INTERVAL_MS);
}

// In-memory memoized filter cache for sub-millisecond category switching
const categoryFilterCache = new Map<string, Product[]>();

export function clearCategoryFilterCache() {
  categoryFilterCache.clear();
}

export function deduplicateProducts(list: Product[]): Product[] {
  if (!list || list.length === 0) return [];
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const seenNames = new Set<string>();
  const result: Product[] = [];

  for (const p of list) {
    if (!p) continue;
    const id = String(p.id || "").toLowerCase();
    const slug = String(p.slug || "").toLowerCase();
    const name = String(p.name || (p as any).title || "").trim().toLowerCase();

    if (id && seenIds.has(id)) continue;
    if (slug && seenSlugs.has(slug)) continue;
    if (name && seenNames.has(name)) continue;

    if (id) seenIds.add(id);
    if (slug) seenSlugs.add(slug);
    if (name) seenNames.add(name);
    result.push(p);
  }
  return result;
}

export function interleaveCatalogs(listA: Product[], listB: Product[]): Product[] {
  if (!listA || listA.length === 0) return deduplicateProducts(listB || []);
  if (!listB || listB.length === 0) return deduplicateProducts(listA || []);

  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const seenNames = new Set<string>();

  const isUnique = (p: any): boolean => {
    if (!p) return false;
    const id = String(p.id || "").toLowerCase();
    const slug = String(p.slug || "").toLowerCase();
    const name = String(p.name || p.title || "").trim().toLowerCase();

    if (id && seenIds.has(id)) return false;
    if (slug && seenSlugs.has(slug)) return false;
    if (name && seenNames.has(name)) return false;

    if (id) seenIds.add(id);
    if (slug) seenSlugs.add(slug);
    if (name) seenNames.add(name);
    return true;
  };

  const result: Product[] = [];
  const max = Math.max(listA.length, listB.length);
  for (let i = 0; i < max; i++) {
    if (i < listB.length && isUnique(listB[i])) {
      result.push(listB[i]);
    }
    if (i < listA.length && isUnique(listA[i])) {
      result.push(listA[i]);
    }
  }
  return result;
}

export function getSyncProducts(): Product[] {
  if (inMemoryProductsCache && inMemoryProductsCache.length > 0) {
    return inMemoryProductsCache;
  }
  return FAST_SEED_PRODUCTS;
}

// Non-blocking background catalog hydrator - deferred to idle time after full page render
let isHydratingCatalog = false;

async function hydrateCatalog() {
  if (isHydratingCatalog) return;
  isHydratingCatalog = true;

  try {
    const [idbData, ecomProducts] = await Promise.all([
      getIdbProducts().catch(() => []),
      EcomsellerEngine.getCachedEcomsellerProducts().catch(() => [])
    ]);

    let baseList: Product[] = [];
    if (idbData && idbData.length >= 100) {
      baseList = deduplicateProducts(idbData);
    } else {
      baseList = await fetchSlimCatalog();
    }

    if (ecomProducts && ecomProducts.length > 0) {
      const combined = interleaveCatalogs(baseList, ecomProducts);
      inMemoryProductsCache = combined;
      updateIndexMap(combined);
      clearCategoryFilterCache();
      setIdbProducts(combined).catch(() => {});
      notifyCatalogUpdated();
    } else if (baseList && baseList.length > 0) {
      inMemoryProductsCache = baseList;
      updateIndexMap(baseList);
      clearCategoryFilterCache();
      notifyCatalogUpdated();
    }
  } catch (e) {
    console.warn("Catalog background hydration warning:", e);
  } finally {
    isHydratingCatalog = false;
  }
}

let updateEventTimer: any = null;
function notifyCatalogUpdated() {
  if (typeof window === "undefined") return;
  if (updateEventTimer) clearTimeout(updateEventTimer);
  updateEventTimer = setTimeout(() => {
    window.dispatchEvent(new Event("mohasagor_products_updated"));
  }, 400);
}

if (typeof window !== "undefined") {
  // Eagerly initiate slim catalog load so all 2,818 products are available for live search immediately
  fetchSlimCatalog().catch(() => {});

  const scheduleHydration = () => {
    hydrateCatalog().catch(() => {});
  };

  if (document.readyState === "complete") {
    scheduleHydration();
  } else {
    window.addEventListener("load", scheduleHydration, { once: true });
  }
}

let cachedRawSlimProducts: any[] | null = null;
let ongoingRawSlimPromise: Promise<any[]> | null = null;

export async function getRawSlimCatalog(): Promise<any[]> {
  if (cachedRawSlimProducts && cachedRawSlimProducts.length > 0) {
    return cachedRawSlimProducts;
  }
  if (ongoingRawSlimPromise) {
    return ongoingRawSlimPromise;
  }

  ongoingRawSlimPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch("/mohasagor_catalog_slim.json", { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw) && raw.length > 0) {
          cachedRawSlimProducts = raw;
          return raw;
        }
      }
    } catch (err) {
      console.warn("Raw slim catalog load error:", err);
    } finally {
      ongoingRawSlimPromise = null;
    }
    return [];
  })();

  return ongoingRawSlimPromise;
}

export function scheduleBackgroundFullMapping(rawProducts: any[]): void {
  if (inMemoryProductsCache && inMemoryProductsCache.length >= 2000) return;
  const runner = () => {
    try {
      if (inMemoryProductsCache && inMemoryProductsCache.length >= 2000) return;
      const mapped = mapRawProducts(rawProducts, "https://mohasagor.com.bd");
      inMemoryProductsCache = mapped;
      updateIndexMap(mapped);
      clearCategoryFilterCache();
      setIdbProducts(mapped).catch(() => {});
      notifyCatalogUpdated();
    } catch (e) {
      console.warn("Background mapping warning:", e);
    }
  };

  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    (window as any).requestIdleCallback(runner, { timeout: 3000 });
  } else {
    setTimeout(runner, 150);
  }
}

let ongoingSlimCatalogPromise: Promise<Product[]> | null = null;

export async function fetchSlimCatalog(): Promise<Product[]> {
  if (inMemoryProductsCache && inMemoryProductsCache.length >= 2000) {
    return inMemoryProductsCache;
  }
  if (ongoingSlimCatalogPromise) {
    return ongoingSlimCatalogPromise;
  }

  ongoingSlimCatalogPromise = (async () => {
    try {
      const rawProducts = await getRawSlimCatalog();
      if (Array.isArray(rawProducts) && rawProducts.length > 0) {
        const mapped = mapRawProducts(rawProducts, "https://mohasagor.com.bd");
        inMemoryProductsCache = mapped;
        updateIndexMap(mapped);
        clearCategoryFilterCache();
        setIdbProducts(mapped).catch(() => {});
        notifyCatalogUpdated();
        return mapped;
      }
    } catch (err) {
      console.warn("Slim catalog load warning:", err);
    } finally {
      ongoingSlimCatalogPromise = null;
    }
    return inMemoryProductsCache || FAST_SEED_PRODUCTS;
  })();

  return ongoingSlimCatalogPromise;
}

let ongoingStaticCatalogPromise: Promise<Product[]> | null = null;

export async function fetchStaticCatalog(): Promise<Product[]> {
  if (inMemoryProductsCache && inMemoryProductsCache.length >= 2000 && inMemoryProductsCache.some(p => (p.description || "").length > 80)) {
    return inMemoryProductsCache;
  }
  if (ongoingStaticCatalogPromise) {
    return ongoingStaticCatalogPromise;
  }

  ongoingStaticCatalogPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
      const res = await fetch("/mohasagor_catalog.json", { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const rawProducts = await res.json();
        if (Array.isArray(rawProducts) && rawProducts.length > 0) {
          const mapped = mapRawProducts(rawProducts, "https://mohasagor.com.bd");
          inMemoryProductsCache = mapped;
          updateIndexMap(mapped);
          clearCategoryFilterCache();
          setIdbProducts(mapped).catch(() => {});
          notifyCatalogUpdated();
          return mapped;
        }
      }
    } catch (err) {
      console.warn("Static catalog load skipped or timed out:", err);
    } finally {
      ongoingStaticCatalogPromise = null;
    }
    return inMemoryProductsCache || (await fetchSlimCatalog());
  })();

  return ongoingStaticCatalogPromise;
}


let ongoingFetchPromise: Promise<Product[]> | null = null;

export async function getCachedMohasagorProducts(): Promise<Product[]> {
  // 1. Instant return from in-memory cache if fully hydrated with supplier products
  if (inMemoryProductsCache && inMemoryProductsCache.length >= 200) {
    return deduplicateProducts(inMemoryProductsCache);
  }

  // 2. Check IndexedDB and Ecomseller products
  if (typeof window !== "undefined") {
    try {
      const [idbItems, ecomItems] = await Promise.all([
        getIdbProducts().catch(() => []),
        EcomsellerEngine.getCachedEcomsellerProducts().catch(() => [])
      ]);
      const base = (idbItems && idbItems.length > 0) ? deduplicateProducts(idbItems) : await fetchSlimCatalog();
      if (!idbItems || idbItems.length === 0) {
        // Trigger detailed catalog hydration in background without blocking initial search
        setTimeout(() => fetchStaticCatalog().catch(() => {}), 1500);
      }
      const combined = interleaveCatalogs(base, ecomItems || []);
      if (combined && combined.length > 0) {
        inMemoryProductsCache = combined;
        updateIndexMap(combined);
        clearCategoryFilterCache();
        return combined;
      }
    } catch {}
  }

  if (inMemoryProductsCache && inMemoryProductsCache.length > 0) {
    return deduplicateProducts(inMemoryProductsCache);
  }

  return deduplicateProducts(FAST_SEED_PRODUCTS);
}

export function mapSingleRawProduct(p: any, base: string = "https://mohasagor.com.bd", index: number = 0): Product & { [key: string]: any } {
  const resolveUrl = (url: any): string => {
    if (!url || typeof url !== "string") return "";
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
      return trimmed;
    }
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    return trimmed.startsWith("/") ? `${base}${trimmed}` : `${base}/${trimmed}`;
  };

  const extractAnyImg = (item: any): string => {
    if (!item) return "";
    if (typeof item === "string") return resolveUrl(item);

    if (item.image && typeof item.image === "string") return resolveUrl(item.image);
    if (item.thumbnail_img && typeof item.thumbnail_img === "string") return resolveUrl(item.thumbnail_img);
    if (item.thumbnail && typeof item.thumbnail === "string") return resolveUrl(item.thumbnail);
    if (item.image_url && typeof item.image_url === "string") return resolveUrl(item.image_url);
    if (item.photo && typeof item.photo === "string") return resolveUrl(item.photo);

    if (Array.isArray(item.product_images) && item.product_images.length > 0) {
      for (const img of item.product_images) {
        if (typeof img === "string" && img.trim()) return resolveUrl(img);
        if (img && typeof img === "object") {
          const u = img.product_image || img.image_url || img.image || img.url;
          if (u && typeof u === "string" && u.trim()) return resolveUrl(u);
        }
      }
    }

    if (Array.isArray(item.images) && item.images.length > 0) {
      for (const img of item.images) {
        if (typeof img === "string" && img.trim()) return resolveUrl(img);
        if (img && typeof img === "object") {
          const u = img.image_url || img.image || img.url;
          if (u && typeof u === "string" && u.trim()) return resolveUrl(u);
        }
      }
    }

    return "";
  };

  const rawImage = extractAnyImg(p);
  const firstImage = getSmartProductImage(p.name, rawImage, p.category || "", index);

  // Base supplier price from API (p.price or p.sale_price)
  const exactRetailPrice = parseFloat(p.price) || parseFloat(p.sale_price) || 0;
  const rawRegularPrice = parseFloat(p.regular_price) || 0;

  // Dynamically calculate price with Admin Profit Margin settings
  const calc = calculateProductPrice(exactRetailPrice, undefined, rawRegularPrice);
  const price = calc.price;
  const originalPrice = calc.originalPrice;

  const allImages: string[] = [];
  if (Array.isArray(p.product_images) && p.product_images.length > 0) {
    p.product_images.forEach((imgObj: any) => {
      const u = typeof imgObj === "string" ? resolveUrl(imgObj) : resolveUrl(imgObj?.product_image || imgObj?.image || imgObj?.url || imgObj?.image_url);
      if (u && !allImages.includes(u)) allImages.push(u);
    });
  }
  if (allImages.length === 0) {
    allImages.push(firstImage);
  }

  const formattedImgList = allImages.map((imgUrl, idx) => ({
    id: `img-${idx}`,
    image_url: imgUrl,
    sort_order: idx
  }));

  const rawStock = p.stock_quantity ?? p.stock ?? (p.stock_status === "available" ? 50 : 0);

  // Map Product Variants (Size, Color, Options) using robust multi-source extractor
  const variants = extractProductVariants(p);

  const rawCategory = p.category || "";
  const inferredSlug = inferCategory(p.name || p.title || "", rawCategory);
  const matchedCat = CATEGORIES_DATA.find(c => c.slug === inferredSlug);
  const canonicalCatName = matchedCat ? matchedCat.name : (rawCategory || "Gadgets & Electronics");

  return {
    id: String(p.id || `prod_${Date.now()}_${index}`),
    name: p.name || p.title || "Product",
    slug: p.slug || `product-${p.id}`,
    image: firstImage,
    images: allImages,
    product_images: formattedImgList,
    product_variants: variants,
    variants,
    price,
    originalPrice: originalPrice > price ? originalPrice : undefined,
    regular_price: calc.regularPrice,
    discount_price: calc.discountPrice,
    rating: Number(p.rating || p.rating_average || 4.8),
    reviews: Number(p.reviews || p.rating_count || 15),
    sold: parseInt(p.sold) || parseInt(p.sold_count) || 45,
    freeShipping: true,
    isNew: index < 20,
    isBestSeller: index % 4 === 0,
    category: canonicalCatName,
    category_name: canonicalCatName,
    category_slug: inferredSlug,
    description: p.details || p.description || "",
    short_description: p.short_description || "",
    stock: Number(rawStock),
    stock_quantity: Number(rawStock),
    stock_status: p.stock_status || "available",
    sku: p.product_code ? String(p.product_code) : (p.sku || ""),
    product_code: p.product_code
  } as Product & { [key: string]: any };
}

export function mapRawProducts(rawProducts: any[], base: string = "https://mohasagor.com.bd"): Product[] {
  if (!Array.isArray(rawProducts)) return [];
  return rawProducts.map((p, index) => mapSingleRawProduct(p, base, index));
}

async function fetchPageWithFallback(pageNum: number, headers: Record<string, string>, retries = 3): Promise<any[]> {
  const endpoints = [
    `/api/mohasagor/api/reseller/product?page=${pageNum}`,
    `https://mohasagor.com.bd/api/reseller/product?page=${pageNum}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(`https://mohasagor.com.bd/api/reseller/product?page=${pageNum}`)}`
  ];

  for (let attempt = 0; attempt < retries; attempt++) {
    for (const url of endpoints) {
      try {
        const isProxy = url.includes("allorigins");
        const fetchHeaders = isProxy ? undefined : headers;
        const res = await fetch(url, fetchHeaders ? { headers: fetchHeaders } : undefined);
        if (res.ok) {
          const data = await res.json();
          let parsedData = data;
          if (isProxy && data.contents) {
            try {
              parsedData = JSON.parse(data.contents);
            } catch {}
          }
          const list = parsedData.products || (Array.isArray(parsedData) ? parsedData : parsedData.data || []);
          if (Array.isArray(list) && list.length > 0) {
            return list;
          }
        }
      } catch (err) {
        // continue to next endpoint
      }
    }
    if (attempt < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
  return [];
}

export async function fetchAllPagesMohasagorProducts(forceRefresh = false): Promise<Product[]> {
  if (!forceRefresh && ongoingFetchPromise) {
    return ongoingFetchPromise;
  }
  if (!forceRefresh && inMemoryProductsCache && inMemoryProductsCache.length >= 2000) {
    return inMemoryProductsCache;
  }

  ongoingFetchPromise = (async () => {
    try {
      const headers = {
        "api-key": "A8niclztH9JtzS4t",
        "secret-key": "2ff380917a11d3a7c97bcf6dddfb8adf38194c7d6b726ab12c4d0d5fb136fef8"
      };

      // 1. Fetch Page 1 to determine total pages
      let rawProductsPage1: any[] = [];
      let lastPage = 14;

      try {
        const p1Data = await fetchPageWithFallback(1, headers, 3);
        if (p1Data && p1Data.length > 0) {
          rawProductsPage1 = p1Data;
        }
      } catch (err) {
        console.warn("Live page 1 fetch warning, attempting static catalog...", err);
      }

      // If page 1 failed, load static catalog
      if (rawProductsPage1.length === 0) {
        const staticList = await fetchStaticCatalog();
        if (staticList && staticList.length > 0) {
          return staticList;
        }
        return inMemoryProductsCache || FALLBACK_SUPPLIER_PRODUCTS;
      }

      const base = "https://mohasagor.com.bd";
      const allRawPages: any[][] = [rawProductsPage1];

      // 2. Fetch all remaining pages in controlled batches to avoid rate-limiting dropouts
      const concurrency = 3;
      for (let p = 2; p <= lastPage; p += concurrency) {
        const batchPromises: Promise<any[]>[] = [];
        for (let j = p; j < p + concurrency && j <= lastPage; j++) {
          batchPromises.push(fetchPageWithFallback(j, headers, 3));
        }
        const batchResults = await Promise.all(batchPromises);
        allRawPages.push(...batchResults);
        if (p + concurrency <= lastPage) {
          await new Promise((r) => setTimeout(r, 120));
        }
      }

      const allRaw = allRawPages.flat();

      // Deduplicate by ID
      const uniqueMap = new Map<string, any>();
      allRaw.forEach((p) => {
        if (p && p.id) {
          uniqueMap.set(String(p.id), p);
        }
      });

      let allMappedProducts = mapRawProducts(Array.from(uniqueMap.values()), base);

      // SAFETY GUARD: If live fetch retrieved fewer products than the static catalog (e.g. temporary network glitch), merge with static catalog so no products are lost!
      const staticList = await fetchStaticCatalog().catch(() => []);
      if (staticList && staticList.length > allMappedProducts.length) {
        const mergedMap = new Map<string, Product>();
        staticList.forEach((p) => mergedMap.set(String(p.id), p));
        allMappedProducts.forEach((p) => mergedMap.set(String(p.id), p));
        allMappedProducts = Array.from(mergedMap.values());
      }

      const ecomList = await EcomsellerEngine.getCachedEcomsellerProducts().catch(() => []);
      if (ecomList && ecomList.length > 0) {
        allMappedProducts = interleaveCatalogs(allMappedProducts, ecomList);
      }

      updateIndexMap(allMappedProducts);
      inMemoryProductsCache = allMappedProducts;

      lastSyncTimestamp = Date.now();
      setIdbProducts(allMappedProducts).catch(() => {});

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("mohasagor_products_updated"));
      }

      console.log(`[Mohasagor Master Sync] Synchronized ${allMappedProducts.length} items`);
      return allMappedProducts;
    } catch (e) {
      console.error("Error fetching all pages of Mohasagor products", e);
      return inMemoryProductsCache || (await fetchStaticCatalog()) || FALLBACK_SUPPLIER_PRODUCTS;
    } finally {
      ongoingFetchPromise = null;
    }
  })();

  return ongoingFetchPromise;
}

export async function findMohasagorProduct(slugOrId: string): Promise<(Product & { [key: string]: any }) | null> {
  if (!slugOrId) return null;
  const syncMatch = findMohasagorProductSync(slugOrId);
  if (syncMatch) return syncMatch;

  let targetRaw = String(slugOrId);
  try {
    targetRaw = decodeURIComponent(targetRaw);
    if (targetRaw.includes("%")) {
      try { targetRaw = decodeURIComponent(targetRaw); } catch {}
    }
  } catch {}
  targetRaw = targetRaw.split("?")[0].split("&")[0].split("#")[0].trim().replace(/\/+$/, "");
  const targetLower = targetRaw.toLowerCase();
  
  // Extract suffix (e.g. "mens-stylish-joggers-pant-4034" -> "4034")
  const suffixMatch = targetLower.match(/-(\d+)$/);
  const suffixId = suffixMatch ? suffixMatch[1] : (/^\d+$/.test(targetLower) ? targetLower : "");
  const cleanId = targetLower.replace(/^product-/, "").replace(/^supplier-/, "").replace(/^cj_/, "").replace(/^cj-/, "");

  const matcher = (p: any): boolean => {
    if (!p) return false;
    const pId = String(p.id || "").toLowerCase();
    const pSlug = String(p.slug || "").toLowerCase();
    const pCode = String(p.product_code || p.sku || "").toLowerCase();
    const pName = String(p.name || p.title || "").toLowerCase();

    if (pSlug === targetLower) return true;
    if (pId === targetLower || pId === cleanId) return true;
    if (pSlug === `product-${cleanId}` || pSlug === `product-${targetLower}`) return true;
    if (pCode && (pCode === cleanId || pCode === targetLower)) return true;
    if (suffixId && (pId === suffixId || pCode === suffixId || pSlug === `product-${suffixId}` || pSlug.endsWith(`-${suffixId}`))) return true;
    if (cleanId && (pSlug.includes(`-${cleanId}`) || pSlug === cleanId)) return true;
    if (targetLower.length > 6 && pName && (pName.includes(targetLower.slice(0, 25)) || targetLower.includes(pName.slice(0, 25)))) return true;
    return false;
  };

  // 1. Check in-memory products
  if (inMemoryProductsCache && inMemoryProductsCache.length > 0) {
    const memFound = inMemoryProductsCache.find(matcher);
    if (memFound) {
      updateIndexMap([memFound as any]);
      saveFastProduct(memFound);
      return memFound as any;
    }
  }

  // 2. Check IndexedDB
  try {
    const idbData = await getIdbProducts();
    if (idbData && idbData.length > 0) {
      inMemoryProductsCache = idbData;
      updateIndexMap(idbData);
      const found = idbData.find(matcher);
      if (found) {
        saveFastProduct(found);
        return found as any;
      }
    }
  } catch {}

  // 3. Ultra-fast raw search in slim catalog (Instant 1ms resolution without main-thread freeze!)
  try {
    const rawList = await getRawSlimCatalog();
    if (rawList && rawList.length > 0) {
      const rawFound = rawList.find(matcher);
      if (rawFound) {
        const singleMapped = mapSingleRawProduct(rawFound);
        updateIndexMap([singleMapped as any]);
        saveFastProduct(singleMapped);
        scheduleBackgroundFullMapping(rawList);
        return singleMapped as any;
      }
      scheduleBackgroundFullMapping(rawList);
    }
  } catch (rawErr) {
    console.warn("Raw slim catalog fast lookup warning:", rawErr);
  }

  // 4. Check Ecomseller BD products
  try {
    const ecomProducts = await EcomsellerEngine.getCachedEcomsellerProducts();
    if (ecomProducts && ecomProducts.length > 0) {
      const found = ecomProducts.find(matcher);
      if (found) {
        updateIndexMap([found as any]);
        saveFastProduct(found);
        return found as any;
      }
    }
  } catch {}

  // 5. Fuzzy keyword fallback: match keywords in slug
  if (inMemoryProductsCache && inMemoryProductsCache.length > 0) {
    const cleanWords = targetLower.replace(/[^a-z0-9]+/g, " ").split(" ").filter(w => w.length > 3 && isNaN(Number(w)));
    if (cleanWords.length >= 2) {
      const fuzzy = inMemoryProductsCache.find((p: any) => {
        const pSlug = String(p.slug || "").toLowerCase();
        const pName = String(p.name || p.title || "").toLowerCase();
        const matched = cleanWords.filter(w => pSlug.includes(w) || pName.includes(w));
        return matched.length >= Math.min(2, cleanWords.length);
      });
      if (fuzzy) {
        updateIndexMap([fuzzy as any]);
        saveFastProduct(fuzzy);
        return fuzzy as any;
      }
    }
  }

  // 6. Fallback to fast seed catalog
  const fallback = FALLBACK_SUPPLIER_PRODUCTS.find(matcher);
  if (fallback) return fallback as any;

  return null;
}


// Lightweight Automatic Background Sync Service (Non-blocking)
export function startAutoProductSync() {
  // Handled via idle hydration to avoid network storms
}

export function normalizeCategorySlug(raw: string): string {
  const info = findCategoryOrSubcategory(raw);
  if (info.type === "category" && info.category) {
    return info.category.slug;
  }
  if (info.type === "subcategory" && info.subcategory) {
    return info.subcategory.slug;
  }
  return (raw || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
}

export function inferCategory(name: string, currentCategory?: string): string {
  const n = (name || "").toLowerCase().trim();
  const c = (currentCategory || "").toLowerCase().trim();

  // 1. WATCH & CLOCKS (Absolute top priority - a watch is ALWAYS a watch, never apparel!)
  if (
    n.includes("watch") ||
    n.includes("watches") ||
    n.includes("smartwatch") ||
    n.includes("smart watch") ||
    n.includes("wristband") ||
    n.includes("wrist watch") ||
    n.includes("quartz") ||
    n.includes("chronograph") ||
    n.includes("binbond") ||
    n.includes("curren") ||
    n.includes("naviforce") ||
    n.includes("skmei") ||
    n.includes("poedagar") ||
    n.includes("olevs") ||
    n.includes("rolex") ||
    n.includes("t800") ||
    n.includes("t900") ||
    n.includes("s10 max") ||
    n.includes("dz09") ||
    n.includes("ঘড়ি") ||
    n.includes("হাত ঘড়ি") ||
    n.includes("wall clock") ||
    n.includes("table clock") ||
    n.includes("digital clock") ||
    n.includes("alarm clock") ||
    c === "watch" ||
    c === "watches"
  ) {
    return "watch";
  }

  // 2. FOODS & NUTRITION (Milk shakes, weight supplements, honey, ghee, dates, nuts)
  if (
    n.includes("milk shake") ||
    n.includes("milkshake") ||
    n.includes("supplement") ||
    n.includes("weight gain") ||
    n.includes("weight management") ||
    n.includes("fat burn") ||
    n.includes("protein powder") ||
    n.includes("chia seed") ||
    n.includes("moringa") ||
    n.includes("spirulina") ||
    n.includes("mustard oil") ||
    n.includes("khejur") ||
    n.includes("dates") ||
    n.includes("honey nuts") ||
    /\bhoney\b/i.test(n) ||
    n.includes("almond") ||
    n.includes("cashew") ||
    n.includes("oats") ||
    n.includes("ghee") ||
    n.includes("মধু") ||
    n.includes("ঘি") ||
    n.includes("সরিষার তেল") ||
    n.includes("খাদ্য") ||
    c === "foods" ||
    c === "food"
  ) {
    if (!n.includes("tray") && !n.includes("dispenser") && !n.includes("holder")) {
      return "foods";
    }
  }

  // 3. HEALTH & BEAUTY (Nail fungus treatment, menstrual cramp relief, cosmetics, face wash, serums)
  if (
    n.includes("fungus") ||
    n.includes("nail care") ||
    n.includes("nail fungus") ||
    n.includes("electric nail") ||
    n.includes("cramp") ||
    n.includes("menstrual") ||
    n.includes("period") ||
    n.includes("heating pad") ||
    n.includes("massager") ||
    n.includes("massage") ||
    n.includes("posture corrector") ||
    n.includes("pain relief") ||
    n.includes("slimming") ||
    n.includes("body shaper") ||
    n.includes("fat burner") ||
    n.includes("serum") ||
    (n.includes("cream") && !n.includes("shoe") && !n.includes("leather")) ||
    n.includes("lotion") ||
    n.includes("whitening") ||
    n.includes("face wash") ||
    n.includes("facewash") ||
    n.includes("scrub") ||
    n.includes("facial") ||
    n.includes("perfume") ||
    n.includes("attar") ||
    n.includes("fragrance") ||
    n.includes("body spray") ||
    n.includes("derma") ||
    n.includes("foot care") ||
    n.includes("hair oil") ||
    n.includes("hair dryer") ||
    n.includes("hair straightener") ||
    n.includes("curler") ||
    n.includes("shampoo") ||
    n.includes("conditioner") ||
    (n.includes("soap") && !n.includes("dispenser") && !n.includes("holder")) ||
    n.includes("toothpaste") ||
    n.includes("lipstick") ||
    n.includes("makeup") ||
    n.includes("cosmetic") ||
    n.includes("skincare") ||
    n.includes("skin care") ||
    c.includes("beauty") ||
    c.includes("health") ||
    c.includes("skin")
  ) {
    return "health-beauty";
  }

  // 4. KIDS ZONE (Toys, baby items, learning kits)
  if (
    n.includes("toy") ||
    n.includes("robot") ||
    n.includes("puzzle") ||
    n.includes("doll") ||
    n.includes("baby") ||
    n.includes("feeder") ||
    n.includes("teether") ||
    n.includes("rattle") ||
    n.includes("diaper") ||
    n.includes("stroller") ||
    n.includes("walker") ||
    n.includes("rc car") ||
    n.includes("lego") ||
    n.includes("talking book") ||
    n.includes("drawing kit") ||
    n.includes("coloring") ||
    n.includes("খেলনা") ||
    c.includes("kid") ||
    c.includes("baby")
  ) {
    return "kids-zone";
  }

  // 5. WINTER (Hoodies, jackets, sweaters)
  if (
    n.includes("hoodie") ||
    n.includes("hoodies") ||
    n.includes("jacket") ||
    n.includes("jackets") ||
    n.includes("windbreaker") ||
    n.includes("sweater") ||
    n.includes("sweatshirt") ||
    n.includes("হুডি") ||
    c === "winter"
  ) {
    return "winter";
  }

  // 6. WOMEN'S FASHION
  if (
    n.includes("saree") ||
    n.includes("sari") ||
    n.includes("sharee") ||
    n.includes("lehenga") ||
    n.includes("kurti") ||
    n.includes("salwar") ||
    n.includes("kameez") ||
    n.includes("kamiz") ||
    n.includes("tunic") ||
    n.includes("palazzo") ||
    n.includes("two piece") ||
    n.includes("three piece") ||
    n.includes("hijab") ||
    n.includes("abaya") ||
    n.includes("borkha") ||
    n.includes("burqa") ||
    n.includes("khimar") ||
    n.includes("niqab") ||
    n.includes("jewelry") ||
    n.includes("jewellery") ||
    n.includes("ring") ||
    n.includes("necklace") ||
    n.includes("earring") ||
    n.includes("bracelet") ||
    n.includes("bangle") ||
    n.includes("bra") ||
    n.includes("lingerie") ||
    n.includes("nighty") ||
    n.includes("মহিলা") ||
    n.includes("লেহেঙ্গা") ||
    n.includes("বোরকা") ||
    n.includes("হিজাব") ||
    c === "womens-fashion" ||
    c.includes("women")
  ) {
    return "womens-fashion";
  }

  // 7. MEN'S FASHION (Strictly apparel, clothing, and attire)
  const isMenApparel =
    n.includes("panjabi") ||
    n.includes("punjabi") ||
    n.includes("pajama") ||
    n.includes("payjama") ||
    n.includes("t-shirt") ||
    n.includes("tshirt") ||
    n.includes("polo") ||
    n.includes("shirt") ||
    n.includes("gabardine") ||
    n.includes("pant") ||
    n.includes("pants") ||
    n.includes("trouser") ||
    n.includes("trousers") ||
    n.includes("jogger") ||
    n.includes("joggers") ||
    n.includes("boxer") ||
    n.includes("boxers") ||
    n.includes("brief") ||
    n.includes("innerwear") ||
    n.includes("lungi") ||
    n.includes("katua") ||
    n.includes("fatua") ||
    n.includes("পাঞ্জাবি") ||
    n.includes("পায়জামা") ||
    n.includes("প্যান্ট") ||
    n.includes("টি-শার্ট");

  const hasMenWordStrict =
    /\b(men|mens|gents|male)\b/i.test(n) ||
    n.includes("men's") ||
    n.includes("gents'") ||
    n.includes("পুরুষ") ||
    n.includes("ছেলে");

  const isExcludedFromMenFashion =
    n.includes("perfume") ||
    n.includes("trimmer") ||
    n.includes("shaver") ||
    n.includes("clipper") ||
    n.includes("dispenser") ||
    n.includes("wallet") ||
    n.includes("backpack") ||
    n.includes("bag") ||
    n.includes("belt") ||
    n.includes("bracket") ||
    n.includes("cleaner") ||
    n.includes("light") ||
    n.includes("tool");

  if (isMenApparel && !isExcludedFromMenFashion) {
    return "mens-fashion";
  }

  if (hasMenWordStrict && !n.includes("women") && !isExcludedFromMenFashion) {
    if (c.includes("fashion") || c.includes("clothing") || c.includes("apparel") || c === "mens-fashion") {
      return "mens-fashion";
    }
  }

  // 8. GADGETS & ELECTRONICS
  if (
    n.includes("charger") ||
    n.includes("charging") ||
    n.includes("cable") ||
    n.includes("power bank") ||
    n.includes("earbud") ||
    n.includes("headphone") ||
    n.includes("earphone") ||
    n.includes("tws") ||
    n.includes("speaker") ||
    n.includes("soundbar") ||
    n.includes("bluetooth") ||
    n.includes("mouse") ||
    n.includes("keyboard") ||
    n.includes("router") ||
    n.includes("monitor") ||
    n.includes("camera") ||
    n.includes("mic") ||
    n.includes("trimmer") ||
    n.includes("shaver") ||
    n.includes("clipper") ||
    n.includes("fan") ||
    n.includes("cooler") ||
    n.includes("usb") ||
    n.includes("adapter") ||
    c.includes("electronic") ||
    c.includes("gadget")
  ) {
    return "gadgets-electronics";
  }

  // 9. HOME & LIFESTYLE
  if (
    n.includes("kitchen") ||
    n.includes("knife") ||
    n.includes("chopper") ||
    n.includes("blender") ||
    n.includes("grinder") ||
    n.includes("cooker") ||
    n.includes("pot") ||
    n.includes("pan") ||
    n.includes("kettle") ||
    n.includes("bottle") ||
    n.includes("lamp") ||
    n.includes("light") ||
    n.includes("mop") ||
    n.includes("cleaner") ||
    n.includes("storage") ||
    n.includes("organizer") ||
    n.includes("rack") ||
    n.includes("shelf") ||
    n.includes("bed sheet") ||
    n.includes("pillow") ||
    n.includes("blanket") ||
    n.includes("towel") ||
    n.includes("iron") ||
    n.includes("steamer") ||
    n.includes("tool") ||
    n.includes("nail gun") ||
    c.includes("home") ||
    c.includes("kitchen")
  ) {
    return "home-lifestyle";
  }

  // Match subcategory keywords
  for (const cat of CATEGORIES_DATA) {
    for (const sub of cat.subcategories) {
      if (sub.keywords.some((k) => n.includes(k.toLowerCase()))) {
        return cat.slug;
      }
    }
  }

  // Category fallback
  if (currentCategory) {
    const info = findCategoryOrSubcategory(currentCategory);
    if (info.type === "category" && info.category) {
      return info.category.slug;
    }
  }

  return "gadgets-electronics";
}

export function filterProductsByCategory(
  products: (Product & { category?: string; category_slug?: string })[],
  categorySlug: string,
  categoryName?: string
): Product[] {
  if (!products || products.length === 0) return [];
  const query = categorySlug || categoryName || "";
  const cacheKey = `${query.toLowerCase()}_${products.length}`;

  if (categoryFilterCache.has(cacheKey)) {
    return categoryFilterCache.get(cacheKey)!;
  }

  const info = findCategoryOrSubcategory(query);

  if (info.type === "all" || !query || query.toLowerCase() === "all") {
    categoryFilterCache.set(cacheKey, products as Product[]);
    return products as Product[];
  }

  let result: Product[] = [];

  // 1. Subcategory filter
  if (info.type === "subcategory" && info.keywords) {
    const kws = info.keywords.map((k) => k.toLowerCase());
    const parentCatSlug = info.category?.slug.toLowerCase();

    const filtered = products.filter((p) => {
      const pName = (p.name || "").toLowerCase();
      const pCat = (p.category || "").toLowerCase();
      const pSlug = (p as any).category_slug || inferCategory(p.name, p.category);

      // Must belong to the parent category (allowing men's winter jackets/hoodies in men's fashion)
      if (parentCatSlug && pSlug !== parentCatSlug && !(parentCatSlug === "mens-fashion" && pSlug === "winter")) {
        return false;
      }

      return kws.some((k) => pName.includes(k) || pCat.includes(k));
    });

    if (filtered.length > 0) {
      result = filtered;
    }
  }

  // 2. Main category filter (Strict category matching)
  if (result.length === 0 && info.type === "category" && info.category) {
    const targetSlug = info.category.slug.toLowerCase();
    const filtered = products.filter((p) => {
      const detectedSlug = (p as any).category_slug || inferCategory(p.name, p.category);
      if (detectedSlug === targetSlug) return true;

      // Allow men's winter hoodies/jackets in Men's Fashion
      if (targetSlug === "mens-fashion" && detectedSlug === "winter") {
        const pName = (p.name || "").toLowerCase();
        return /\b(men|mens|gents)\b/i.test(pName) || pName.includes("hoodie") || pName.includes("jacket");
      }

      return false;
    });

    if (filtered.length > 0) {
      result = filtered;
    }
  }

  // 3. Fallback normalized slug match (Clean fallback, never dump unrelated items!)
  if (result.length === 0) {
    const target = normalizeCategorySlug(query);
    const fallback = products.filter((p) => {
      const detectedSlug = (p as any).category_slug || inferCategory(p.name, p.category);
      return detectedSlug === target;
    });
    result = fallback;
  }

  categoryFilterCache.set(cacheKey, result);
  return result;
}
