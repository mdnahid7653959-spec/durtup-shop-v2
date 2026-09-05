import type { Product } from "@/components/products/ProductCard";
import { calculateProductPrice } from "@/utils/pricingMargin";
import { getSmartProductImage } from "@/utils/productImageHelper";
import { extractProductVariants } from "@/utils/productVariantHelper";
import { FAST_SEED_PRODUCTS } from "@/data/fastSeedCatalog";
import { findCategoryOrSubcategory, CATEGORIES_DATA } from "@/data/categoriesData";
import { EcomsellerEngine } from "@/services/suppliers/ecomsellerEngine";

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
  });
}

export function findMohasagorProductSync(slugOrId: string): (Product & { [key: string]: any }) | null {
  if (!slugOrId) return null;
  const targetRaw = decodeURIComponent(slugOrId).split("?")[0].split("&")[0].trim().toLowerCase();
  if (!targetRaw) return null;
  
  if (productIndexMap.has(targetRaw)) return productIndexMap.get(targetRaw)!;

  const cleanId = targetRaw.replace(/^product-/, "").replace(/^supplier-/, "").replace(/^cj_/, "").replace(/^cj-/, "");
  if (productIndexMap.has(cleanId)) return productIndexMap.get(cleanId)!;

  const suffixMatch = targetRaw.match(/-(\d+)$/);
  if (suffixMatch && productIndexMap.has(suffixMatch[1])) return productIndexMap.get(suffixMatch[1])!;

  // Fallback scan across in-memory cache
  if (inMemoryProductsCache && inMemoryProductsCache.length > 0) {
    const found = inMemoryProductsCache.find((p: any) => {
      const pSlug = String(p.slug || "").toLowerCase();
      const pId = String(p.id || "").toLowerCase();
      const pCode = String(p.product_code || p.sku || "").toLowerCase();
      return pSlug === targetRaw || 
             pId === targetRaw || 
             pId === cleanId || 
             pCode === cleanId || 
             pCode === targetRaw ||
             pSlug === `product-${cleanId}` ||
             (suffixMatch && (pId === suffixMatch[1] || pCode === suffixMatch[1] || pSlug.endsWith(`-${suffixMatch[1]}`))) ||
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

// Non-blocking background catalog hydrator - runs immediately
if (typeof window !== "undefined") {
  const hydrateCatalog = async () => {
    try {
      const [idbData, ecomProducts] = await Promise.all([
        getIdbProducts().catch(() => []),
        EcomsellerEngine.getCachedEcomsellerProducts().catch(() => [])
      ]);

      let baseList: Product[] = [];
      if (idbData && idbData.length >= 100) {
        baseList = deduplicateProducts(idbData);
      } else {
        baseList = await fetchStaticCatalog();
      }

      if (ecomProducts && ecomProducts.length > 0) {
        const combined = interleaveCatalogs(baseList, ecomProducts);
        inMemoryProductsCache = combined;
        updateIndexMap(combined);
        clearCategoryFilterCache();
        setIdbProducts(combined).catch(() => {});
        window.dispatchEvent(new Event("mohasagor_products_updated"));
      } else if (baseList && baseList.length > 0) {
        inMemoryProductsCache = baseList;
        updateIndexMap(baseList);
        clearCategoryFilterCache();
        window.dispatchEvent(new Event("mohasagor_products_updated"));
      }
    } catch (e) {
      console.warn("Catalog background hydration warning:", e);
    }
  };

  hydrateCatalog();
}

async function fetchStaticCatalog(): Promise<Product[]> {
  try {
    const res = await fetch("/mohasagor_catalog.json");
    if (res.ok) {
      const rawProducts = await res.json();
      if (Array.isArray(rawProducts) && rawProducts.length > 0) {
        const mapped = mapRawProducts(rawProducts, "https://mohasagor.com.bd");
        inMemoryProductsCache = mapped;
        updateIndexMap(mapped);
        clearCategoryFilterCache();
        setIdbProducts(mapped).catch(() => {});
        return mapped;
      }
    }
  } catch (err) {
    console.warn("Failed to load static catalog:", err);
  }
  return [];
}

let ongoingFetchPromise: Promise<Product[]> | null = null;

export async function getCachedMohasagorProducts(): Promise<Product[]> {
  // 1. Instant return from in-memory cache (0ms!)
  if (inMemoryProductsCache && inMemoryProductsCache.length > 0) {
    return deduplicateProducts(inMemoryProductsCache);
  }

  // 2. Check IndexedDB
  if (typeof window !== "undefined") {
    try {
      const [idbItems, ecomItems] = await Promise.all([
        getIdbProducts().catch(() => []),
        EcomsellerEngine.getCachedEcomsellerProducts().catch(() => [])
      ]);
      const base = (idbItems && idbItems.length > 0) ? deduplicateProducts(idbItems) : await fetchStaticCatalog();
      const combined = interleaveCatalogs(base, ecomItems || []);
      if (combined && combined.length > 0) {
        inMemoryProductsCache = combined;
        updateIndexMap(combined);
        clearCategoryFilterCache();
        return combined;
      }
    } catch {}
  }

  return deduplicateProducts(FAST_SEED_PRODUCTS);
}

export function mapRawProducts(rawProducts: any[], base: string = "https://mohasagor.com.bd"): Product[] {
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

  const extractAnyImg = (p: any): string => {
    if (!p) return "";
    if (typeof p === "string") return resolveUrl(p);

    if (p.image && typeof p.image === "string") return resolveUrl(p.image);
    if (p.thumbnail_img && typeof p.thumbnail_img === "string") return resolveUrl(p.thumbnail_img);
    if (p.thumbnail && typeof p.thumbnail === "string") return resolveUrl(p.thumbnail);
    if (p.image_url && typeof p.image_url === "string") return resolveUrl(p.image_url);
    if (p.photo && typeof p.photo === "string") return resolveUrl(p.photo);

    if (Array.isArray(p.product_images) && p.product_images.length > 0) {
      for (const img of p.product_images) {
        if (typeof img === "string" && img.trim()) return resolveUrl(img);
        if (img && typeof img === "object") {
          const u = img.product_image || img.image_url || img.image || img.url;
          if (u && typeof u === "string" && u.trim()) return resolveUrl(u);
        }
      }
    }

    if (Array.isArray(p.images) && p.images.length > 0) {
      for (const img of p.images) {
        if (typeof img === "string" && img.trim()) return resolveUrl(img);
        if (img && typeof img === "object") {
          const u = img.image_url || img.image || img.url;
          if (u && typeof u === "string" && u.trim()) return resolveUrl(u);
        }
      }
    }

    return "";
  };

  return rawProducts.map((p, index) => {
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
      category: p.category || "",
      description: p.details || p.description || "",
      short_description: p.short_description || "",
      stock: Number(rawStock),
      stock_quantity: Number(rawStock),
      stock_status: p.stock_status || "available",
      sku: p.product_code ? String(p.product_code) : (p.sku || ""),
      product_code: p.product_code
    } as Product & { [key: string]: any };
  });
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

  const targetRaw = decodeURIComponent(slugOrId).split("?")[0].split("&")[0].trim();
  const targetLower = targetRaw.toLowerCase();
  
  // Extract suffix (e.g. "mens-stylish-joggers-pant-4034" -> "4034")
  const suffixMatch = targetLower.match(/-(\d+)$/);
  const suffixId = suffixMatch ? suffixMatch[1] : "";
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
      if (found) return found as any;
    }
  } catch {}

  // 3. Fallback to fast seed catalog
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
  if (currentCategory) {
    const info = findCategoryOrSubcategory(currentCategory);
    if (info.type === "category" && info.category) {
      return info.category.slug;
    }
  }

  const n = (name || "").toLowerCase();

  // 1. Women's Fashion Priority Keywords
  const womenKws = [
    "saree", "sari", "sharee", "lehenga", "kurti", "salwar", "kameez", "tunic", "palazzo",
    "two piece", "three piece", "hijab", "abaya", "borkha", "burqa", "khimar", "scarf",
    "niqab", "borka", "ring", "necklace", "earring", "chain", "pendant", "bangle", "bracelet",
    "jewel", "diamond", "bra", "lingerie", "nighty", "women", "womens", "ladies", "female",
    "মহিলা", "শাড়ি", "লেহেঙ্গা", "কুর্তি", "বোরকা", "হিজাব"
  ];
  if (womenKws.some(k => n.includes(k))) {
    return "womens-fashion";
  }

  // 2. Men's Fashion Keywords
  const menKws = [
    "panjabi", "punjabi", "pajama", "payjama", "t-shirt", "tshirt", "polo", "shirt",
    "pant", "gabardine", "jeans", "trouser", "jogger", "boxer", "men", "mens", "gents",
    "পাঞ্জাবি", "পায়জামা", "প্যান্ট", "টি-শার্ট"
  ];
  if (menKws.some(k => n.includes(k))) {
    return "mens-fashion";
  }

  for (const cat of CATEGORIES_DATA) {
    for (const sub of cat.subcategories) {
      if (sub.keywords.some(k => n.includes(k.toLowerCase()))) {
        return cat.slug;
      }
    }
  }

  return "gadgets-electronics";
}

export function filterProductsByCategory(
  products: (Product & { category?: string })[],
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

  if (info.type === "subcategory" && info.keywords) {
    const kws = info.keywords.map(k => k.toLowerCase());
    const filtered = products.filter(p => {
      const pName = (p.name || "").toLowerCase();
      const pCat = (p.category || "").toLowerCase();
      const matchesKeyword = kws.some(k => pName.includes(k) || pCat.includes(k));
      const matchesCat = info.category ? (pCat === info.category.name.toLowerCase() || pCat.includes(info.category.slug)) : true;
      return matchesKeyword || (matchesCat && matchesKeyword);
    });
    if (filtered.length > 0) {
      result = filtered;
    }
  }

  if (result.length === 0 && info.type === "category" && info.category) {
    const catName = info.category.name.toLowerCase();
    const catSlug = info.category.slug.toLowerCase();
    const filtered = products.filter(p => {
      const pCat = (p.category || "").toLowerCase();
      if (pCat === catName || pCat.includes(catSlug) || pCat.includes(catName)) return true;
      const inferred = inferCategory(p.name, p.category);
      return inferred === catSlug;
    });
    if (filtered.length > 0) {
      result = filtered;
    }
  }

  if (result.length === 0) {
    const target = normalizeCategorySlug(query);
    const fallback = products.filter(p => {
      const pCat = (p.category || "").toLowerCase();
      const pName = (p.name || "").toLowerCase();
      return pCat.includes(target) || pName.includes(target) || inferCategory(p.name, p.category) === target;
    });
    result = fallback.length > 0 ? fallback : products.slice(0, 30);
  }

  categoryFilterCache.set(cacheKey, result);
  return result;
}
