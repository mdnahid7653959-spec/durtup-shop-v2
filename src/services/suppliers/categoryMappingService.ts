import { supabase } from "@/lib/firebaseAdapter";
import { CategoryMappingRule } from "./supplierTypes";

export interface DurtupMasterCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export const DURTUP_MASTER_CATEGORIES: DurtupMasterCategory[] = [
  { id: "cat-electronics", name: "Electronics & Gadgets", slug: "electronics", description: "Mobiles, Laptops, Earbuds, Accessories" },
  { id: "cat-home", name: "Home & Kitchen", slug: "home", description: "Home appliances, kitchenware, essentials" },
  { id: "cat-fashion", name: "Fashion & Clothing", slug: "fashion", description: "Men and Women Fashion, Footwear, Bags" },
  { id: "cat-beauty", name: "Health & Beauty", slug: "beauty", description: "Skincare, Makeup & Personal Care, Trimmers" },
  { id: "cat-watches", name: "Watches & Accessories", slug: "watches", description: "Watches, Jewellery, Sunglasses, Wallets" },
  { id: "cat-kids", name: "Toys & Baby Care", slug: "kids", description: "Toys, Baby products & Clothing, Games" },
];

export const DEFAULT_ECOMSELLER_CATEGORY_MAPPINGS: Record<string, { durtupId: string; durtupName: string; durtupSlug: string }> = {
  // Jewellery & Watches
  "jewellery": { durtupId: "cat-watches", durtupName: "Watches & Accessories", durtupSlug: "watches" },
  "jewelry": { durtupId: "cat-watches", durtupName: "Watches & Accessories", durtupSlug: "watches" },

  // Electronics & Gadgets
  "mobile-accessories": { durtupId: "cat-electronics", durtupName: "Electronics & Gadgets", durtupSlug: "electronics" },
  "earbuds": { durtupId: "cat-electronics", durtupName: "Electronics & Gadgets", durtupSlug: "electronics" },
  "neckband": { durtupId: "cat-electronics", durtupName: "Electronics & Gadgets", durtupSlug: "electronics" },
  "speaker-microphone": { durtupId: "cat-electronics", durtupName: "Electronics & Gadgets", durtupSlug: "electronics" },
  "camera": { durtupId: "cat-electronics", durtupName: "Electronics & Gadgets", durtupSlug: "electronics" },
  "rechargeable-fan": { durtupId: "cat-electronics", durtupName: "Electronics & Gadgets", durtupSlug: "electronics" },
  "rechargeable-light": { durtupId: "cat-electronics", durtupName: "Electronics & Gadgets", durtupSlug: "electronics" },
  "outdoor-gadgets": { durtupId: "cat-electronics", durtupName: "Electronics & Gadgets", durtupSlug: "electronics" },
  "safety-and-security": { durtupId: "cat-electronics", durtupName: "Electronics & Gadgets", durtupSlug: "electronics" },

  // Home & Kitchen
  "kitchen-gadget": { durtupId: "cat-home", durtupName: "Home & Kitchen", durtupSlug: "home" },
  "home-essentials": { durtupId: "cat-home", durtupName: "Home & Kitchen", durtupSlug: "home" },
  "home-kitchen-accessories": { durtupId: "cat-home", durtupName: "Home & Kitchen", durtupSlug: "home" },
  "cleaning-tool": { durtupId: "cat-home", durtupName: "Home & Kitchen", durtupSlug: "home" },
  "bathroom-accessories": { durtupId: "cat-home", durtupName: "Home & Kitchen", durtupSlug: "home" },
  "tools-hardware": { durtupId: "cat-home", durtupName: "Home & Kitchen", durtupSlug: "home" },
  "stationery": { durtupId: "cat-home", durtupName: "Home & Kitchen", durtupSlug: "home" },
  "islamic-products": { durtupId: "cat-home", durtupName: "Home & Kitchen", durtupSlug: "home" },

  // Fashion & Clothing
  "fashion-accessories": { durtupId: "cat-fashion", durtupName: "Fashion & Clothing", durtupSlug: "fashion" },
  "men-s-fashion": { durtupId: "cat-fashion", durtupName: "Fashion & Clothing", durtupSlug: "fashion" },
  "women-s-fashion": { durtupId: "cat-fashion", durtupName: "Fashion & Clothing", durtupSlug: "fashion" },
  "travel-accessories": { durtupId: "cat-fashion", durtupName: "Fashion & Clothing", durtupSlug: "fashion" },
  "car-accessories": { durtupId: "cat-home", durtupName: "Home & Kitchen", durtupSlug: "home" },
  "fishing-bit": { durtupId: "cat-home", durtupName: "Home & Kitchen", durtupSlug: "home" },

  // Health & Beauty
  "skin-care": { durtupId: "cat-beauty", durtupName: "Health & Beauty", durtupSlug: "beauty" },
  "hair-care": { durtupId: "cat-beauty", durtupName: "Health & Beauty", durtupSlug: "beauty" },
  "beauty-gadgets": { durtupId: "cat-beauty", durtupName: "Health & Beauty", durtupSlug: "beauty" },
  "trimmer": { durtupId: "cat-beauty", durtupName: "Health & Beauty", durtupSlug: "beauty" },
  "health-care": { durtupId: "cat-beauty", durtupName: "Health & Beauty", durtupSlug: "beauty" },
  "health-care-devices": { durtupId: "cat-beauty", durtupName: "Health & Beauty", durtupSlug: "beauty" },
  "brush-toothpaste": { durtupId: "cat-beauty", durtupName: "Health & Beauty", durtupSlug: "beauty" },
  "foot-care": { durtupId: "cat-beauty", durtupName: "Health & Beauty", durtupSlug: "beauty" },
  "food-supplement": { durtupId: "cat-beauty", durtupName: "Health & Beauty", durtupSlug: "beauty" },
  "medical-accessories": { durtupId: "cat-beauty", durtupName: "Health & Beauty", durtupSlug: "beauty" },
  "fitness-equipment": { durtupId: "cat-beauty", durtupName: "Health & Beauty", durtupSlug: "beauty" },

  // Toys & Baby Care
  "toys-games": { durtupId: "cat-kids", durtupName: "Toys & Baby Care", durtupSlug: "kids" },
  "baby-product": { durtupId: "cat-kids", durtupName: "Toys & Baby Care", durtupSlug: "kids" }
};

const STORAGE_KEY = "durtup_category_mappings_cache_v1";

export class CategoryMappingService {
  private static DB_TABLE = "supplier_category_mappings";

  /**
   * Suggest a Durtup category based on raw category name or slug
   */
  public static suggestDurtupCategory(rawSlugOrName: string): DurtupMasterCategory {
    const clean = (rawSlugOrName || "").toLowerCase().trim().replace(/\s+/g, '-');
    
    // Exact mapping check
    if (DEFAULT_ECOMSELLER_CATEGORY_MAPPINGS[clean]) {
      const match = DEFAULT_ECOMSELLER_CATEGORY_MAPPINGS[clean];
      return { id: match.durtupId, name: match.durtupName, slug: match.durtupSlug };
    }

    // Heuristics
    if (clean.includes("jewel") || clean.includes("watch") || clean.includes("ring") || clean.includes("chain") || clean.includes("necklace")) {
      return DURTUP_MASTER_CATEGORIES.find(c => c.slug === "watches") || DURTUP_MASTER_CATEGORIES[4];
    }
    if (clean.includes("toy") || clean.includes("baby") || clean.includes("kid") || clean.includes("game")) {
      return DURTUP_MASTER_CATEGORIES.find(c => c.slug === "kids") || DURTUP_MASTER_CATEGORIES[5];
    }
    if (clean.includes("beauty") || clean.includes("skin") || clean.includes("hair") || clean.includes("care") || clean.includes("trimmer") || clean.includes("health")) {
      return DURTUP_MASTER_CATEGORIES.find(c => c.slug === "beauty") || DURTUP_MASTER_CATEGORIES[3];
    }
    if (clean.includes("fashion") || clean.includes("cloth") || clean.includes("men") || clean.includes("women") || clean.includes("wear") || clean.includes("dress")) {
      return DURTUP_MASTER_CATEGORIES.find(c => c.slug === "fashion") || DURTUP_MASTER_CATEGORIES[2];
    }
    if (clean.includes("kitchen") || clean.includes("home") || clean.includes("clean") || clean.includes("tool") || clean.includes("bath") || clean.includes("fan")) {
      return DURTUP_MASTER_CATEGORIES.find(c => c.slug === "home") || DURTUP_MASTER_CATEGORIES[1];
    }
    if (clean.includes("gadget") || clean.includes("mobile") || clean.includes("phone") || clean.includes("ear") || clean.includes("speaker") || clean.includes("audio") || clean.includes("tech")) {
      return DURTUP_MASTER_CATEGORIES.find(c => c.slug === "electronics") || DURTUP_MASTER_CATEGORIES[0];
    }

    return DURTUP_MASTER_CATEGORIES[0];
  }

  /**
   * Get all active category mappings for a supplier
   */
  public static async getSupplierMappings(supplierId = "ecomseller_bd"): Promise<CategoryMappingRule[]> {
    try {
      const { data } = await supabase
        .from(this.DB_TABLE)
        .select("*")
        .eq("supplierId", supplierId);

      if (data && data.length > 0) {
        if (typeof window !== "undefined") {
          localStorage.setItem(`${STORAGE_KEY}_${supplierId}`, JSON.stringify(data));
        }
        return data as CategoryMappingRule[];
      }
    } catch (e) {
      console.warn("Category mappings DB fetch fallback:", e);
    }

    // Check localStorage cache
    if (typeof window !== "undefined") {
      const local = localStorage.getItem(`${STORAGE_KEY}_${supplierId}`);
      if (local) {
        try {
          return JSON.parse(local);
        } catch {}
      }
    }

    return [];
  }

  /**
   * Save or update multiple category mappings
   */
  public static async saveMappings(mappings: CategoryMappingRule[], supplierId = "ecomseller_bd"): Promise<boolean> {
    try {
      for (const m of mappings) {
        const payload = {
          ...m,
          supplierId,
          updatedAt: new Date().toISOString()
        };
        await supabase.from(this.DB_TABLE).upsert(payload, { onConflict: "supplierCategorySlug" });
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(`${STORAGE_KEY}_${supplierId}`, JSON.stringify(mappings));
        window.dispatchEvent(new CustomEvent("supplier_category_mappings_updated", { detail: { supplierId, mappings } }));
      }
      return true;
    } catch (err) {
      console.error("Failed to save category mappings:", err);
      return false;
    }
  }

  /**
   * Resolve Durtup Category for a supplier category slug or name
   */
  public static resolveCategory(
    supplierCatSlug: string, 
    supplierCatName: string, 
    customMappings: CategoryMappingRule[] = []
  ): DurtupMasterCategory {
    const cleanSlug = (supplierCatSlug || "").toLowerCase().trim();
    
    // 1. Check custom saved mappings
    const custom = customMappings.find(m => 
      m.supplierCategorySlug?.toLowerCase() === cleanSlug ||
      m.supplierCategoryName?.toLowerCase() === (supplierCatName || "").toLowerCase().trim()
    );
    if (custom && custom.durtupCategorySlug) {
      const found = DURTUP_MASTER_CATEGORIES.find(c => c.slug === custom.durtupCategorySlug);
      if (found) return found;
      return {
        id: custom.durtupCategoryId || `cat-${custom.durtupCategorySlug}`,
        name: custom.durtupCategoryName,
        slug: custom.durtupCategorySlug
      };
    }

    // 2. Check defaults
    if (DEFAULT_ECOMSELLER_CATEGORY_MAPPINGS[cleanSlug]) {
      const def = DEFAULT_ECOMSELLER_CATEGORY_MAPPINGS[cleanSlug];
      return { id: def.durtupId, name: def.durtupName, slug: def.durtupSlug };
    }

    // 3. Heuristic suggestion fallback
    return this.suggestDurtupCategory(supplierCatSlug || supplierCatName);
  }
}
