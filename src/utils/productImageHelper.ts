// Smart Product Image Matcher & Resolver Utility
// Ensures every product displays a real, relevant image matching its name & category with ultra-fast Edge WebP CDN caching.

const CATEGORY_IMAGES = {
  panjabi: [
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop",
  ],
  pajama: [
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=600&fit=crop",
  ],
  shirt: [
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&h=600&fit=crop",
  ],
  women_fashion: [
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=600&fit=crop",
  ],
  saree: [
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&h=600&fit=crop",
  ],
  kurti: [
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=600&fit=crop",
  ],
  watch: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=600&fit=crop",
  ],
  smartwatch: [
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&h=600&fit=crop",
  ],
  trimmer: [
    "https://images.unsplash.com/photo-1621607512214-68297480165e?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=600&fit=crop",
  ],
  earbuds: [
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop",
  ],
  keyboard: [
    "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&h=600&fit=crop",
  ],
  home: [
    "https://images.unsplash.com/photo-1585336261026-8f5786372966?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1618944847828-82e943c3beb9?w=600&h=600&fit=crop",
  ],
  shoes: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&h=600&fit=crop",
  ],
  bags: [
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&h=600&fit=crop",
  ],
  beauty: [
    "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=600&fit=crop",
  ],
  tools: [
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=600&h=600&fit=crop",
  ]
};

// Known Unsplash generic fallback patterns that were previously assigned in random places
const GENERIC_GADGET_FALLBACKS = [
  "photo-1590658268037", // Earbuds
  "photo-1546868871",    // Smartwatch
  "photo-1609091839311", // Router
  "photo-1618384887929", // Keyboard
  "photo-1585386959984", // Perfume
  "photo-1560472355",    // Shoes
  "photo-1523275335684", // Watch
  "photo-1507582020474", // Camera
  "photo-1596755094514", // Shirt
];

/**
 * Converts heavy raw supplier images to ultra-fast, edge-cached WebP CDN images via Cloudflare/wsrv.nl
 * Uses fit=cover and dynamic resolution to ensure crystal-clear HD clarity with tiny file size.
 */
export function optimizeImageUrl(url?: string, width: number = 800, quality: number = 85): string {
  if (!url || typeof url !== "string") return "";
  let trimmed = url.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:") || trimmed.includes(".svg")) {
    return trimmed;
  }

  // Already an optimized proxy URL
  if (trimmed.includes("wsrv.nl")) {
    return trimmed;
  }

  // Unsplash images - use native high-speed dynamic CDN parameters with full uncropped aspect ratio
  if (trimmed.includes("images.unsplash.com")) {
    const clean = trimmed.split("?")[0];
    return `${clean}?w=${width}&q=${quality}&auto=format`;
  }

  // Route external supplier images (Mohasagor, Ecomseller, external CDNs) through Cloudflare Global Edge CDN
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return `https://wsrv.nl/?url=${encodeURIComponent(trimmed)}&w=${width}&output=webp&q=${quality}&we=0`;
  }

  if (trimmed.startsWith("//")) {
    const full = `https:${trimmed}`;
    return `https://wsrv.nl/?url=${encodeURIComponent(full)}&w=${width}&output=webp&q=${quality}&we=0`;
  }

  return trimmed;
}

/**
 * Returns raw unproxied URL (direct supplier origin link)
 */
export function getDirectImageUrl(url?: string): string {
  if (!url || typeof url !== "string") return "";
  let trimmed = url.trim();
  if (trimmed.includes("wsrv.nl/?url=") || trimmed.includes("wsrv.nl?url=")) {
    const match = trimmed.match(/[?&]url=([^&]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }
  return trimmed;
}

export function detectCategoryKey(name: string = "", category: string = ""): keyof typeof CATEGORY_IMAGES | null {
  const text = `${name} ${category}`.toLowerCase();

  if (text.match(/panjabi|punjabi|katua|kabli|kurta/i)) {
    return "panjabi";
  } else if (text.match(/pajama|pyjama|trouser|pant|salwar/i)) {
    return "pajama";
  } else if (text.match(/saree|sharee|lehenga|georgette/i)) {
    return "saree";
  } else if (text.match(/kurti|kameez|abaya|borkha|burqa|khimar|hijab|three.*piece|ladies/i)) {
    return "kurti";
  } else if (text.match(/smart.*watch|fitness.*watch|apple.*watch|ultra.*watch|t800|t900|d20|hw8|hw9|fitness.*band|smart.*band/i)) {
    return "smartwatch";
  } else if (text.match(/watch|clock|jewel|luxury|wrist|oliya|olevs|skmei|binbond|curren|naviforce|casio|quartz|chronograph|dial|butter.*fly.*lock|butterfly|leather.*strap|mesh.*strap|analog/i)) {
    return "watch";
  } else if (text.match(/trimmer|clipper|shaver|grooming|hair.*beard|beard|at-1210|htc|vintage.*t9|kemei|vgr|nova|shaving|hair.*cut/i)) {
    return "trimmer";
  } else if (text.match(/earbud|airpod|headphone|earphone|headset|audio|bluetooth.*sound|wireless.*audio|tws|pro.*4|m10|f9|anc|soundbar/i)) {
    return "earbuds";
  } else if (text.match(/keyboard|mouse|gaming|pc|laptop|computer|router|wifi/i)) {
    return "keyboard";
  } else if (text.match(/shoe|sneaker|footwear|sandal|boot|loafer|slipper/i)) {
    return "shoes";
  } else if (text.match(/bag|backpack|wallet|purse|handbag|travel.*bag|crossbody/i)) {
    return "bags";
  } else if (text.match(/perfume|attar|body.*spray|fragrance|lotion|cream|serum|shampoo|face.*wash|skin.*care|lipstick|makeup/i)) {
    return "beauty";
  } else if (text.match(/shirt|t-shirt|tshirt|polo|jacket|suit|cloth|men's|mens|wear|sleeve|combo.*shirt|denim|jeans|hoodie/i)) {
    return "shirt";
  } else if (text.match(/home|kitchen|mug|pump|fan|lamp|dispenser|blender|grinder|bottle|flask|pillow|cushion|shelf|rack|mop/i)) {
    return "home";
  } else if (text.match(/screwdriver|drill|tool|hardware|wrench|hammer|plier|screw|repair.*kit|machine|saw|socket/i)) {
    return "tools";
  }
  return null;
}

export function getSmartProductImage(
  name: string = "",
  currentImageUrl?: string,
  category: string = "",
  index: number = 0
): string {
  const key = detectCategoryKey(name, category);

  // Check if currentImageUrl is a genuine uploaded/supplier image URL (not a generic Unsplash placeholder)
  if (currentImageUrl && typeof currentImageUrl === "string" && currentImageUrl.trim() !== "") {
    const trimmed = currentImageUrl.trim();
    const isUnsplashGeneric = GENERIC_GADGET_FALLBACKS.some(pattern => trimmed.includes(pattern));

    // If it is a real image from Mohasagor, Supabase, Cloudinary, or valid external host
    if (!isUnsplashGeneric) {
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("//") || trimmed.startsWith("data:")) {
        return optimizeImageUrl(trimmed);
      }
    }
  }

  // Return a relevant category-matched high-res image
  if (key && CATEGORY_IMAGES[key]) {
    const images = CATEGORY_IMAGES[key];
    return optimizeImageUrl(images[index % images.length]);
  }

  const defaultPool = CATEGORY_IMAGES.panjabi;
  return optimizeImageUrl(defaultPool[index % defaultPool.length]);
}

/**
 * Returns an array of candidate image URLs in priority order:
 * 1. Edge-optimized WebP CDN URL
 * 2. Raw origin direct supplier URL
 * 3. Alternate product images (if available)
 * 4. Smart category fallback
 */
export function getProductImageCandidates(product: any, width: number = 600): string[] {
  const candidates: string[] = [];
  const primaryRaw = product.image || (product.images && product.images[0]) || (product.product_images && product.product_images[0]?.image_url) || "";

  if (primaryRaw && typeof primaryRaw === "string" && primaryRaw.trim()) {
    const rawClean = primaryRaw.trim();
    const cdnUrl = optimizeImageUrl(rawClean, width);
    const directUrl = getDirectImageUrl(rawClean);

    if (cdnUrl) candidates.push(cdnUrl);
    if (directUrl && directUrl !== cdnUrl) candidates.push(directUrl);
  }

  // Additional secondary images from supplier
  if (Array.isArray(product.images)) {
    product.images.forEach((img: any) => {
      const u = typeof img === "string" ? img : img?.image_url;
      if (u && typeof u === "string") {
        const cdn = optimizeImageUrl(u, width);
        const dir = getDirectImageUrl(u);
        if (cdn && !candidates.includes(cdn)) candidates.push(cdn);
        if (dir && !candidates.includes(dir)) candidates.push(dir);
      }
    });
  }

  // Final category fallback
  const fallback = getSmartProductImage(product.name || "", "", product.category || (product as any).category_id || "");
  if (fallback && !candidates.includes(fallback)) {
    candidates.push(fallback);
  }

  return candidates;
}

// Lightweight Proactive Image Preloader - Only warms top few items on idle
const preloadedUrls = new Set<string>();

export function prefetchProductImages(
  products: Array<{ image?: string; image_url?: string; images?: any[]; name?: string }>,
  maxCount: number = 6
) {
  if (typeof window === "undefined" || !Array.isArray(products) || products.length === 0) return;
  const targetSlice = products.slice(0, Math.min(maxCount, 8));

  const warmImage = (rawUrl?: string, name?: string) => {
    if (!rawUrl) return;
    const finalUrl = getSmartProductImage(name || "", rawUrl);
    if (!finalUrl || preloadedUrls.has(finalUrl)) return;
    preloadedUrls.add(finalUrl);

    const img = new Image();
    img.decoding = "async";
    img.src = finalUrl;
  };

  const runIdle = () => {
    targetSlice.forEach((p) => {
      warmImage(p.image || p.image_url, p.name);
    });
  };

  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(runIdle, { timeout: 2000 });
  } else {
    setTimeout(runIdle, 1000);
  }
}
