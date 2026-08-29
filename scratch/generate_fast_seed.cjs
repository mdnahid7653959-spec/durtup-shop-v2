const fs = require('fs');
const path = require('path');

// Read mohasagor_catalog.json or scratch/all_api_products.json
const catalogPath = path.join(__dirname, '../public/mohasagor_catalog.json');
let rawData = [];

if (fs.existsSync(catalogPath)) {
  try {
    rawData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  } catch (e) {
    console.error("Failed to parse public/mohasagor_catalog.json", e);
  }
}

if (!rawData || rawData.length === 0) {
  const scratchPath = path.join(__dirname, 'all_api_products.json');
  if (fs.existsSync(scratchPath)) {
    rawData = JSON.parse(fs.readFileSync(scratchPath, 'utf8'));
  }
}

console.log("Total raw items:", rawData.length);

// Select top 120 items with clean fields
const selected = rawData.slice(0, 120).map((p, idx) => {
  const base = "https://mohasagor.com.bd";
  const resolveUrl = (url) => {
    if (!url || typeof url !== "string") return "";
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
      return trimmed;
    }
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    return trimmed.startsWith("/") ? `${base}${trimmed}` : `${base}/${trimmed}`;
  };

  let img = "";
  if (p.thumbnail_img) img = resolveUrl(p.thumbnail_img);
  else if (p.image) img = resolveUrl(p.image);
  else if (p.thumbnail) img = resolveUrl(p.thumbnail);
  else if (p.image_url) img = resolveUrl(p.image_url);
  else if (Array.isArray(p.product_images) && p.product_images.length > 0) {
    const first = p.product_images[0];
    img = typeof first === "string" ? resolveUrl(first) : resolveUrl(first?.product_image || first?.image_url || first?.image || first?.url);
  }

  const rawPrice = parseFloat(p.price) || parseFloat(p.sale_price) || 0;
  const rawRegularPrice = parseFloat(p.regular_price) || 0;

  // Direct exact API price without profit margin
  let price = Math.round(rawPrice);
  let originalPrice = rawRegularPrice > price ? Math.round(rawRegularPrice) : undefined;

  return {
    id: String(p.id || `seed-${idx}`),
    name: p.name || p.title || "Product",
    slug: p.slug || `product-${p.id}`,
    image: img,
    price: price,
    originalPrice: originalPrice > price ? originalPrice : undefined,
    rating: Number(p.rating || p.rating_average || 4.8),
    reviews: Number(p.reviews || p.rating_count || 18),
    sold: parseInt(p.sold) || parseInt(p.sold_count) || (30 + (idx * 7) % 200),
    freeShipping: true,
    isNew: idx < 24,
    isBestSeller: idx % 4 === 0,
    category: p.category || ""
  };
});

const dir = path.join(__dirname, '../src/data');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const fileContent = `// Auto-generated High-Speed Instant Seed Catalog (0ms first render)
import type { Product } from "@/components/products/ProductCard";

export const FAST_SEED_PRODUCTS: (Product & { [key: string]: any })[] = ${JSON.stringify(selected, null, 2)};
`;

const targetPath = path.join(dir, 'fastSeedCatalog.ts');
fs.writeFileSync(targetPath, fileContent, 'utf8');
console.log("Written", selected.length, "seed products to", targetPath);
