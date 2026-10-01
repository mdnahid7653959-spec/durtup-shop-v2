import { CATEGORIES_DATA, findCategoryOrSubcategory, MainCategoryItem } from "@/data/categoriesData";

export interface NormalizedCategoryInfo {
  slug: string;
  name: string;
  bangla: string;
  isSubcategory: boolean;
  parentSlug?: string;
  keywords: string[];
}

/**
 * Normalizes any category string (from URL query, route param, or product field)
 * safely handling case, whitespace, hyphens, underscores, and common aliases.
 * 
 * Examples:
 * "Watch" -> slug: "watch", name: "Watch"
 * "watch-" -> slug: "watch", name: "Watch"
 * "WATCH" -> slug: "watch", name: "Watch"
 * "Mobile" -> slug: "mobile-accessories", name: "Mobile Accessories", parentSlug: "gadgets-electronics"
 * "Electronics" -> slug: "gadgets-electronics", name: "Gadgets & Electronics"
 * "Fashion" -> slug: "mens-fashion" (or matched fashion)
 * "Beauty" -> slug: "health-beauty"
 * "Home" -> slug: "home-lifestyle"
 * "Kitchen" -> slug: "kitchen-dining", parentSlug: "home-lifestyle"
 */
export function normalizeCategory(raw?: string | null): NormalizedCategoryInfo | null {
  if (!raw || typeof raw !== "string") return null;

  // Clean raw string: trim, remove leading/trailing hyphens/underscores/slashes
  const cleaned = raw.trim().replace(/^[-_/\s]+|[-_/\s]+$/g, "");
  if (!cleaned || cleaned.toLowerCase() === "all") return null;

  // 1. Check with existing findCategoryOrSubcategory
  const lookup = findCategoryOrSubcategory(cleaned);
  if (lookup.type === "category" && lookup.category) {
    return {
      slug: lookup.category.slug,
      name: lookup.category.name,
      bangla: lookup.category.bangla || "",
      isSubcategory: false,
      keywords: lookup.category.subcategories?.flatMap(s => s.keywords || []) || []
    };
  }

  if (lookup.type === "subcategory" && lookup.subcategory && lookup.category) {
    return {
      slug: lookup.subcategory.slug,
      name: lookup.subcategory.name,
      bangla: lookup.subcategory.bangla || "",
      isSubcategory: true,
      parentSlug: lookup.category.slug,
      keywords: lookup.keywords || lookup.subcategory.keywords || []
    };
  }

  // 2. Direct lookup in CATEGORIES_DATA by normalized slug or name
  const normKey = cleaned.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  for (const cat of CATEGORIES_DATA) {
    const catSlugNorm = cat.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const catNameNorm = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    if (catSlugNorm === normKey || catNameNorm === normKey || cat.id.toLowerCase() === normKey) {
      return {
        slug: cat.slug,
        name: cat.name,
        bangla: cat.bangla || "",
        isSubcategory: false,
        keywords: cat.subcategories?.flatMap(s => s.keywords || []) || []
      };
    }

    for (const sub of cat.subcategories) {
      const subSlugNorm = sub.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const subNameNorm = sub.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      if (subSlugNorm === normKey || subNameNorm === normKey || sub.id.toLowerCase() === normKey) {
        return {
          slug: sub.slug,
          name: sub.name,
          bangla: sub.bangla || "",
          isSubcategory: true,
          parentSlug: cat.slug,
          keywords: sub.keywords || []
        };
      }
    }
  }

  // 3. Fallback normalized representation
  const fallbackSlug = normKey;
  const fallbackName = cleaned.split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  return {
    slug: fallbackSlug,
    name: fallbackName,
    bangla: "",
    isSubcategory: false,
    keywords: [cleaned.toLowerCase()]
  };
}

/**
 * Checks whether a product matches a target category query string.
 * Safely inspects:
 * - product.category
 * - product.category_name
 * - product.category_slug
 * - product.category_id / product.categoryId
 * - product.categories (relation object)
 * - product name keywords
 * - inferred category from name
 */
export function productMatchesCategory(product: any, categoryQuery?: string | null): boolean {
  if (!categoryQuery || categoryQuery.toLowerCase() === "all") return true;
  if (!product) return false;

  const target = normalizeCategory(categoryQuery);
  if (!target) return true;

  const targetSlug = target.slug.toLowerCase();
  const targetParentSlug = target.parentSlug?.toLowerCase();
  const targetName = target.name.toLowerCase();
  const targetKeywords = (target.keywords || []).map(k => k.toLowerCase());

  // Extract all possible category values from product
  const pCat = String(product.category || "").toLowerCase().trim();
  const pCatName = String(product.category_name || product.categoryName || (product.categories && product.categories.name) || "").toLowerCase().trim();
  const pCatSlug = String(product.category_slug || product.categorySlug || (product.categories && product.categories.slug) || "").toLowerCase().trim();
  const pCatId = String(product.category_id || product.categoryId || "").toLowerCase().trim();
  const pName = String(product.name || product.title || "").toLowerCase();

  // 1. Direct Slug or Name exact matches
  if (pCatSlug && (pCatSlug === targetSlug || pCatSlug === targetParentSlug)) return true;
  if (pCat && (pCat === targetSlug || pCat === targetName || pCat.includes(targetSlug) || targetName.includes(pCat))) return true;
  if (pCatName && (pCatName === targetSlug || pCatName === targetName || pCatName.includes(targetSlug))) return true;
  if (pCatId && (pCatId === targetSlug || pCatId === targetParentSlug)) return true;

  // 2. Special Category Identifiers (e.g. "watch", "smartwatch", "clock", "ঘড়ি")
  if (targetSlug === "watch" || targetSlug === "watches" || targetSlug.includes("watch")) {
    const isWatch = 
      pCat.includes("watch") ||
      pCatSlug === "watch" ||
      pName.includes("watch") ||
      pName.includes("smartwatch") ||
      pName.includes("smart watch") ||
      pName.includes("wrist watch") ||
      pName.includes("quartz") ||
      pName.includes("chronograph") ||
      pName.includes("olevs") ||
      pName.includes("curren") ||
      pName.includes("naviforce") ||
      pName.includes("skmei") ||
      pName.includes("poedagar") ||
      pName.includes("rolex") ||
      pName.includes("ঘড়ি") ||
      pName.includes("wall clock") ||
      pName.includes("table clock");
    if (isWatch) return true;
  }

  // 3. Gadgets & Electronics / Mobile Accessories
  if (targetSlug === "gadgets-electronics" || targetSlug === "mobile-accessories" || targetSlug === "electronics" || targetSlug === "mobile") {
    // If target is specific subcategory "mobile-accessories" or "mobile"
    if (targetSlug === "mobile-accessories" || targetSlug === "mobile") {
      const isMobileAcc = 
        pName.match(/\b(mobile|phone|charger|cable|cover|power bank|otg|adapter|battery|type-c|casing|protector|holder|stand)\b/i) ||
        pCat.includes("mobile") ||
        pCatSlug.includes("mobile");
      if (isMobileAcc) return true;
    }

    if (targetSlug === "gadgets-electronics" || targetSlug === "electronics") {
      // Products in gadgets-electronics but not watches
      if (pCatSlug === "gadgets-electronics" || pCat.includes("gadget") || pCat.includes("electronic")) {
        // Exclude watches from general electronics
        if (!pName.includes("watch") && !pName.includes("smartwatch") && !pName.includes("ঘড়ি")) {
          return true;
        }
      }
    }
  }

  // 4. Subcategory keyword match
  if (target.isSubcategory && targetKeywords.length > 0) {
    const matchesKeyword = targetKeywords.some(kw => kw.length >= 3 && (pName.includes(kw) || pCat.includes(kw)));
    if (matchesKeyword) {
      if (targetParentSlug) {
        // If parent category is specified, verify it doesn't conflict
        if (pCatSlug && pCatSlug !== targetParentSlug && pCatSlug !== targetSlug) {
          // Allow cross-match if pCat is generic or empty
          if (pCatSlug === "general" || !pCatSlug) return true;
        } else {
          return true;
        }
      } else {
        return true;
      }
    }
  }

  // 5. Inferred category match from product name
  try {
    const inferred = inferProductCategory(pName, pCat);
    if (inferred === targetSlug || inferred === targetParentSlug) {
      return true;
    }
  } catch {}

  return false;
}

// Lightweight category inference fallback
function inferProductCategory(name: string, category?: string): string {
  const n = (name || "").toLowerCase().trim();
  const c = (category || "").toLowerCase().trim();

  if (
    n.includes("watch") || n.includes("smartwatch") || n.includes("quartz") ||
    n.includes("chronograph") || n.includes("olevs") || n.includes("curren") ||
    n.includes("naviforce") || n.includes("skmei") || n.includes("ঘড়ি") ||
    n.includes("wall clock") || n.includes("table clock") || c === "watch" || c === "watches"
  ) {
    return "watch";
  }
  if (n.includes("milk shake") || n.includes("honey") || n.includes("ghee") || n.includes("supplement") || c === "foods") return "foods";
  if (n.includes("hoodie") || n.includes("winter") || n.includes("jacket") || c === "winter") return "winter";
  if (n.includes("panjabi") || n.includes("kabli") || n.includes("shirt") || n.includes("pant") || c === "mens-fashion") return "mens-fashion";
  if (n.includes("saree") || n.includes("kurti") || n.includes("hijab") || n.includes("borkha") || n.includes("jewelry") || c === "womens-fashion") return "womens-fashion";
  if (n.includes("pot") || n.includes("pan") || n.includes("blender") || n.includes("kitchen") || n.includes("light") || c === "home-lifestyle") return "home-lifestyle";
  if (n.includes("serum") || n.includes("cream") || n.includes("hair") || n.includes("skin") || n.includes("beauty") || c === "health-beauty") return "health-beauty";
  if (n.includes("toy") || n.includes("baby") || n.includes("kid") || c === "kids-zone") return "kids-zone";
  return "gadgets-electronics";
}

