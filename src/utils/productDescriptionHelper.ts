/**
 * Smart Product Description Generator & Formatter for Durtup.shop
 * Automatically generates structured, high-converting e-commerce product descriptions
 * when raw catalog items have missing, empty, or placeholder descriptions.
 */

export interface ProductDescriptionContext {
  id?: string;
  name: string;
  category?: string;
  category_id?: string;
  brand?: string;
  rawDescription?: string | null;
  short_description?: string | null;
  sku?: string;
  price?: number;
}

const GENERIC_PLACEHOLDERS = new Set([
  "high quality product.",
  "high quality product",
  "high quality product from store.",
  "high quality product from store",
  "international quality product.",
  "international quality product",
  "product",
  "untitled product",
  "good product",
  "test product",
  "n/a",
  ""
]);

/**
 * Checks if a description is just a placeholder or too minimal
 */
export function isPlaceholderDescription(desc?: string | null): boolean {
  if (!desc) return true;
  const trimmed = desc.trim().toLowerCase().replace(/[^\w\s]/g, "");
  if (trimmed.length < 25) return true;
  return GENERIC_PLACEHOLDERS.has(desc.trim().toLowerCase()) || GENERIC_PLACEHOLDERS.has(trimmed);
}

/**
 * Generates an intelligent, authentic, and rich description based on product name and category
 */
export function generateSmartDescription(context: ProductDescriptionContext): string {
  const name = (context.name || "Premium Product").trim();
  const lowerName = name.toLowerCase();
  const category = (context.category || "").toLowerCase();

  // 1. Orthotic / Pain Relief / Healthcare / Insoles
  if (
    lowerName.includes("insole") ||
    lowerName.includes("magnetic") ||
    lowerName.includes("orthotic") ||
    lowerName.includes("pain relief") ||
    lowerName.includes("posture") ||
    lowerName.includes("massager") ||
    lowerName.includes("therapy")
  ) {
    return `
<div class="space-y-4">
  <p class="text-sm leading-relaxed text-foreground/90 font-medium">
    Experience ultimate comfort and daily foot wellness with <strong>${name}</strong>. Specially engineered with ergonomic acupressure massage nodes and therapeutic magnetic points to promote healthy blood circulation, relieve heel and arch pain, and absorb foot shock during walking, standing, or sports.
  </p>

  <div class="bg-muted/30 border border-border/70 rounded-xl p-4 my-3">
    <h4 class="font-semibold text-sm text-foreground mb-2.5">
      Key Features & Benefits:
    </h4>
    <ul class="space-y-1.5 text-xs sm:text-sm text-muted-foreground list-disc pl-5">
      <li><strong>Acupressure & Magnetic Therapy:</strong> Strategically positioned therapeutic magnets stimulate reflexology points on your feet for natural pain relief.</li>
      <li><strong>Ergonomic Arch Support:</strong> Balances body weight distribution, reducing pressure on feet, knees, and lower back.</li>
      <li><strong>Breathable & Shock Absorbing:</strong> Features ventilated air holes to keep feet cool, dry, and odor-free all day long.</li>
      <li><strong>Cut-to-Fit Design:</strong> Easily trim along the marked sizing guidelines to achieve the perfect fit for any shoe size (Men & Women).</li>
      <li><strong>Durable & Washable:</strong> Made from high-grade medical silicone and EVA material for long-lasting daily use.</li>
    </ul>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border rounded-xl p-3 bg-muted/20">
    <div><strong>Suitable For:</strong> Flat feet, plantar fasciitis, heel spurs, long standing hours</div>
    <div><strong>Material:</strong> Medical Grade Silicone, Natural Magnets, Breathable EVA</div>
    <div><strong>Gender:</strong> Unisex (Both Men & Women)</div>
    <div><strong>Quality Guarantee:</strong> 100% Brand New & Verified Quality</div>
  </div>

  <div class="text-xs text-muted-foreground pt-1 border-t border-border/60">
    <p><strong>Delivery:</strong> Inside Dhaka (24-48 Hours) | Outside Dhaka (48-72 Hours) with Cash on Delivery nationwide.</p>
  </div>
</div>
`.trim();
  }

  // 2. Kitchen Gadgets / Electric Cooker / Hot Pot / Steamer / Appliances
  if (
    lowerName.includes("pot") ||
    lowerName.includes("cooker") ||
    lowerName.includes("steamer") ||
    lowerName.includes("blender") ||
    lowerName.includes("kettle") ||
    lowerName.includes("fryer") ||
    lowerName.includes("grinder") ||
    lowerName.includes("pan") ||
    category.includes("kitchen") ||
    category.includes("home")
  ) {
    return `
<div class="space-y-4">
  <p class="text-sm leading-relaxed text-foreground/90 font-medium">
    Upgrade your modern kitchen convenience with <strong>${name}</strong>. Designed for fast, energy-efficient, and effortless daily food preparation, steaming, boiling, and cooking with premium safety standards.
  </p>

  <div class="bg-muted/30 border border-border/70 rounded-xl p-4 my-3">
    <h4 class="font-semibold text-sm text-foreground mb-2.5">
      Key Features & Specifications:
    </h4>
    <ul class="space-y-1.5 text-xs sm:text-sm text-muted-foreground list-disc pl-5">
      <li><strong>Multi-Functional Versatility:</strong> Perfect for boiling, steaming, simmering, making soup, instant noodles, hot pot, and healthy meals.</li>
      <li><strong>Food-Grade Non-Stick Coating:</strong> Prevents food from sticking and burning, requiring less oil and offering effortless cleaning.</li>
      <li><strong>Dual Temperature Control:</strong> Easily adjust heating power according to your cooking recipe for fast and evenly distributed heat.</li>
      <li><strong>Safe & Overheat Protection:</strong> Built-in anti-dry burning and automatic shut-off safety protection for worry-free cooking.</li>
      <li><strong>Compact & Ergonomic Handle:</strong> Heat-resistant, comfortable grip handle ideal for home, office, dorms, or bachelor kitchens.</li>
    </ul>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border rounded-xl p-3 bg-muted/20">
    <div><strong>Category:</strong> Kitchen & Home Appliances</div>
    <div><strong>Body Material:</strong> Food Grade Stainless Steel & Heat-Resistant PP</div>
    <div><strong>Quality Standard:</strong> 100% Quality Checked</div>
    <div><strong>Condition:</strong> 100% Brand New Authentic Unit</div>
  </div>

  <div class="text-xs text-muted-foreground pt-1 border-t border-border/60">
    <p><strong>Delivery:</strong> Cash on Delivery available across all 64 districts in Bangladesh with secure packaging.</p>
  </div>
</div>
`.trim();
  }

  // 3. Chargers, Cables, Mobile Accessories, Electronics & Gadgets
  if (
    lowerName.includes("charger") ||
    lowerName.includes("cable") ||
    lowerName.includes("earbuds") ||
    lowerName.includes("bluetooth") ||
    lowerName.includes("wireless") ||
    lowerName.includes("speaker") ||
    lowerName.includes("watch") ||
    lowerName.includes("usb") ||
    category.includes("gadget") ||
    category.includes("electronic")
  ) {
    return `
<div class="space-y-4">
  <p class="text-sm leading-relaxed text-foreground/90 font-medium">
    Power up your daily digital lifestyle with <strong>${name}</strong>. Built with premium chipset technology, durable build quality, and smart safety protection to deliver exceptional reliability and high performance.
  </p>

  <div class="bg-muted/30 border border-border/70 rounded-xl p-4 my-3">
    <h4 class="font-semibold text-sm text-foreground mb-2.5">
      Key Highlights:
    </h4>
    <ul class="space-y-1.5 text-xs sm:text-sm text-muted-foreground list-disc pl-5">
      <li><strong>High-Speed & Reliable Performance:</strong> Engineered for optimal efficiency, quick response, and steady continuous output.</li>
      <li><strong>Universal Compatibility:</strong> Works seamlessly with all standard iOS, Android, Type-C, Micro-USB, and modern smart devices.</li>
      <li><strong>Smart Safety Protection:</strong> Built-in intelligent surge, over-voltage, short-circuit, and temperature safeguards.</li>
      <li><strong>Compact & Travel-Friendly:</strong> Lightweight and robust construction designed for hassle-free portability at home, work, or on the go.</li>
      <li><strong>100% Authentic Quality:</strong> Tested and verified to meet strict e-commerce quality assurance standards.</li>
    </ul>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border rounded-xl p-3 bg-muted/20">
    <div><strong>Device Category:</strong> Electronics & Smart Gadgets</div>
    <div><strong>Build:</strong> High-grade Fireproof ABS & Pure Copper Conductors</div>
    <div><strong>Quality Standard:</strong> 100% Quality Checked</div>
    <div><strong>Package:</strong> 1x Original Retail Packaging Unit</div>
  </div>

  <div class="text-xs text-muted-foreground pt-1 border-t border-border/60">
    <p><strong>Delivery:</strong> Express shipping available across Bangladesh with doorstep inspection upon Cash on Delivery.</p>
  </div>
</div>
`.trim();
  }

  // 4. Fashion, Apparel, Footwear, Bags
  if (
    lowerName.includes("shirt") ||
    lowerName.includes("pant") ||
    lowerName.includes("jacket") ||
    lowerName.includes("shoe") ||
    lowerName.includes("bag") ||
    lowerName.includes("wallet") ||
    lowerName.includes("dress") ||
    category.includes("fashion") ||
    category.includes("clothing")
  ) {
    return `
<div class="space-y-4">
  <p class="text-sm leading-relaxed text-foreground/90 font-medium">
    Elevate your everyday style with <strong>${name}</strong>. Combining premium craftsmanship, comfortable materials, and contemporary design for a confident, fashionable look.
  </p>

  <div class="bg-muted/30 border border-border/70 rounded-xl p-4 my-3">
    <h4 class="font-semibold text-sm text-foreground mb-2.5">
      Product Details & Highlights:
    </h4>
    <ul class="space-y-1.5 text-xs sm:text-sm text-muted-foreground list-disc pl-5">
      <li><strong>Premium Quality Fabric:</strong> Soft, breathable, skin-friendly, and durable for maximum all-day comfort.</li>
      <li><strong>Trendy & Versatile:</strong> Pairs easily with casual, semi-formal, or outdoor outfits.</li>
      <li><strong>Precision Stitching:</strong> Reinforced seam work ensures lasting shape retention even after multiple washes.</li>
      <li><strong>Color Fastness:</strong> Treated to resist fading and shrinkage for enduring freshness.</li>
    </ul>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border rounded-xl p-3 bg-muted/20">
    <div><strong>Category:</strong> Fashion & Lifestyle</div>
    <div><strong>Fit & Feel:</strong> Regular Comfortable Fit</div>
    <div><strong>Care Instructions:</strong> Machine wash cold or gentle hand wash</div>
    <div><strong>Fabric Quality:</strong> Pre-Shrunk & Color Fastness Tested</div>
  </div>

  <div class="text-xs text-muted-foreground pt-1 border-t border-border/60">
    <p><strong>Delivery:</strong> Fast Cash on Delivery to all 64 districts in Bangladesh.</p>
  </div>
</div>
`.trim();
  }

  // 5. Default Universal Rich Description for all other categories
  return `
<div class="space-y-4">
  <p class="text-sm leading-relaxed text-foreground/90 font-medium">
    Discover premium quality and unbeatable value with <strong>${name}</strong> on Durtup.shop. Sourced from verified manufacturers and tested for authentic performance, durability, and daily convenience.
  </p>

  <div class="bg-muted/30 border border-border/70 rounded-xl p-4 my-3">
    <h4 class="font-semibold text-sm text-foreground mb-2.5">
      Product Highlights:
    </h4>
    <ul class="space-y-1.5 text-xs sm:text-sm text-muted-foreground list-disc pl-5">
      <li><strong>100% Authentic Quality:</strong> Brand new, genuine product verified for optimal functionality and reliability.</li>
      <li><strong>Durable & Long Lasting:</strong> Built with robust materials designed to withstand regular daily use.</li>
      <li><strong>Ergonomic & Easy to Use:</strong> User-friendly operation straight out of the box with zero complex setup.</li>
      <li><strong>Best Value for Money:</strong> Direct marketplace pricing ensuring maximum savings for smart shoppers.</li>
    </ul>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border rounded-xl p-3 bg-muted/20">
    <div><strong>Product Name:</strong> ${name}</div>
    <div><strong>Quality Standard:</strong> 100% Quality Checked</div>
    <div><strong>Payment:</strong> Cash on Delivery (COD) & Online Payment</div>
    <div><strong>Availability:</strong> In Stock & Ready to Ship</div>
  </div>

  <div class="text-xs text-muted-foreground pt-1 border-t border-border/60">
    <p><strong>Fast Delivery:</strong> Express delivery across all 64 districts in Bangladesh with reliable parcel tracking.</p>
  </div>
</div>
`.trim();
}

/**
 * Ensures the product has a rich, properly formatted description
 */
export function getEnhancedProductDescription(product: {
  id?: string;
  name?: string;
  title?: string;
  category?: string;
  category_id?: string;
  brand?: string;
  description?: string | null;
  details?: string | null;
  short_description?: string | null;
  sku?: string;
  price?: number;
}): string {
  const prodName = product.name || product.title || "Product";
  const rawDesc = product.details || product.description;

  if (!rawDesc || isPlaceholderDescription(rawDesc)) {
    return generateSmartDescription({
      id: product.id,
      name: prodName,
      category: product.category || product.category_id,
      brand: product.brand,
      rawDescription: rawDesc,
      short_description: product.short_description,
      sku: product.sku,
      price: product.price
    });
  }

  return rawDesc;
}
