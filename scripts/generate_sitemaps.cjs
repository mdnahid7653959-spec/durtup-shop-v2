const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://durtup.shop';
const TODAY = new Date().toISOString().split('T')[0];

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildUrlSetXml(urls) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;
  for (const item of urls) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}${item.url}</loc>\n`;
    xml += `    <lastmod>${item.lastmod || TODAY}</lastmod>\n`;
    xml += `    <changefreq>${item.changefreq || 'daily'}</changefreq>\n`;
    xml += `    <priority>${item.priority || '0.8'}</priority>\n`;
    if (item.image) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(item.image)}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(item.imageTitle || 'Durtup.shop Product')}</image:title>\n`;
      xml += `      <image:caption>${escapeXml(item.imageTitle || 'Buy Online in Bangladesh at Durtup.shop with Cash on Delivery')}</image:caption>\n`;
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n`;
  }
  xml += `</urlset>`;
  return xml;
}

// 1. Flash Sale Sitemaps (High Urgency & Max Sales)
const FLASH_SALE_URLS = [
  { url: '/flash-sale', priority: '1.0', changefreq: 'hourly' },
  { url: '/category/offer', priority: '0.9', changefreq: 'daily' },
  { url: '/products?sort=discount', priority: '0.9', changefreq: 'daily' },
  { url: '/products?deal=flash', priority: '0.9', changefreq: 'daily' },
];

// 2. Combo & Buy 1 Get 1 Offers (High Order Value)
const COMBO_OFFERS_URLS = [
  { url: '/category/offer', priority: '0.9' },
  { url: '/products?tag=combo', priority: '0.9' },
  { url: '/products?tag=buy1get1', priority: '0.9' },
  { url: '/free-shipping', priority: '0.8' },
];

// 3. Smart Watches (Top High-Search Keyword)
const SMART_WATCHES_URLS = [
  { url: '/category/watch', priority: '0.9' },
  { url: '/category/smart-watch', priority: '0.9' },
  { url: '/products?category=smart-watch', priority: '0.9' },
  { url: '/products?search=smart+watch', priority: '0.8' },
  { url: '/products?search=a9+pro', priority: '0.8' },
];

// 4. TWS Wireless Earbuds (Top Selling Category)
const TWS_EARBUDS_URLS = [
  { url: '/category/earbuds-headphones', priority: '0.9' },
  { url: '/products?category=earbuds-headphones', priority: '0.9' },
  { url: '/products?search=tws+earbuds', priority: '0.8' },
  { url: '/products?search=bluetooth+earphone', priority: '0.8' },
  { url: '/products?search=airpods', priority: '0.8' },
];

// 5. Budget Gadgets (High Volume Conversion)
const BUDGET_GADGETS_URLS = [
  { url: '/category/gadgets-electronics', priority: '0.9' },
  { url: '/category/mobile-accessories', priority: '0.8' },
  { url: '/products?tag=budget-gadgets', priority: '0.8' },
  { url: '/products?max_price=1000', priority: '0.8' },
];

// 6. Mobile Accessories (High Daily Demand)
const MOBILE_ACCESSORIES_URLS = [
  { url: '/category/mobile-accessories', priority: '0.9' },
  { url: '/category/power-bank', priority: '0.8' },
  { url: '/products?category=mobile-accessories', priority: '0.8' },
  { url: '/products?search=fast+charger', priority: '0.8' },
  { url: '/products?search=power+bank', priority: '0.8' },
];

// 7. Bluetooth Speakers & Audio
const BLUETOOTH_SPEAKERS_URLS = [
  { url: '/category/earbuds-headphones', priority: '0.8' },
  { url: '/products?search=bluetooth+speaker', priority: '0.8' },
  { url: '/products?search=mini+speaker', priority: '0.8' },
  { url: '/products?search=soundbar', priority: '0.8' },
];

// 8. Men's Fashion (High Intent Sales)
const MENS_FASHION_URLS = [
  { url: '/category/mens-fashion', priority: '0.9' },
  { url: '/products?category=mens-fashion', priority: '0.9' },
  { url: '/products?search=polo+shirt', priority: '0.8' },
  { url: '/products?search=t-shirt', priority: '0.8' },
  { url: '/products?search=panjabi', priority: '0.8' },
];

// 9. Women's Fashion & Lifestyle
const WOMENS_FASHION_URLS = [
  { url: '/category/womens-fashion', priority: '0.9' },
  { url: '/products?category=womens-fashion', priority: '0.9' },
  { url: '/products?search=three+piece', priority: '0.8' },
  { url: '/products?search=kurti', priority: '0.8' },
  { url: '/products?search=hijab', priority: '0.8' },
];

// 10. Home & Kitchen Essentials
const HOME_KITCHEN_URLS = [
  { url: '/category/home-lifestyle', priority: '0.8' },
  { url: '/products?category=home-lifestyle', priority: '0.8' },
  { url: '/products?search=kitchen+gadgets', priority: '0.8' },
  { url: '/products?search=chopper', priority: '0.8' },
  { url: '/products?search=blender', priority: '0.8' },
];

// 11. Beauty & Grooming Trimmers
const BEAUTY_GROOMING_URLS = [
  { url: '/category/others', priority: '0.8' },
  { url: '/products?search=hair+trimmer', priority: '0.8' },
  { url: '/products?search=shaving+machine', priority: '0.8' },
  { url: '/products?search=hair+dryer', priority: '0.8' },
];

// 12. Kids Zone & Educational Toys
const KIDS_TOYS_URLS = [
  { url: '/category/kids-zone', priority: '0.8' },
  { url: '/products?category=kids-zone', priority: '0.8' },
  { url: '/products?search=rc+car', priority: '0.8' },
  { url: '/products?search=educational+toy', priority: '0.8' },
];

// 13. TikTok & Facebook Viral Products
const VIRAL_PRODUCTS_URLS = [
  { url: '/new-arrivals', priority: '0.9' },
  { url: '/products?tag=viral', priority: '0.9' },
  { url: '/products?tag=trending', priority: '0.9' },
  { url: '/products?sort=popularity', priority: '0.8' },
];

// 14. 100% Cash on Delivery (Zero Risk Buyer Intent)
const CASH_ON_DELIVERY_URLS = [
  { url: '/shipping', priority: '0.9' },
  { url: '/products?payment=cod', priority: '0.9' },
  { url: '/help', priority: '0.7' },
  { url: '/track', priority: '0.7' },
];

// 15. Free Shipping Collection
const FREE_SHIPPING_URLS = [
  { url: '/free-shipping', priority: '0.9', changefreq: 'daily' },
  { url: '/products?shipping=free', priority: '0.9' },
  { url: '/shipping', priority: '0.7' },
];

// 16. Products Under 500 Taka
const UNDER_500_URLS = [
  { url: '/products?max_price=500', priority: '0.8' },
  { url: '/category/mobile-accessories', priority: '0.8' },
  { url: '/category/offer', priority: '0.8' },
];

// 17. Products Under 1000 Taka
const UNDER_1000_URLS = [
  { url: '/products?max_price=1000', priority: '0.9' },
  { url: '/category/gadgets-electronics', priority: '0.8' },
  { url: '/flash-sale', priority: '0.8' },
];

// 18. Products Under 2000 Taka
const UNDER_2000_URLS = [
  { url: '/products?max_price=2000', priority: '0.8' },
  { url: '/category/watch', priority: '0.8' },
  { url: '/category/earbuds-headphones', priority: '0.8' },
];

// 19. Premium Luxury Collection
const LUXURY_COLLECTION_URLS = [
  { url: '/category/watch', priority: '0.8' },
  { url: '/products?tag=premium', priority: '0.8' },
  { url: '/products?search=leather+wallet', priority: '0.8' },
];

// 20. Gift Items & Custom Presents
const GIFT_ITEMS_URLS = [
  { url: '/category/customize-gift', priority: '0.8' },
  { url: '/products?category=customize-gift', priority: '0.8' },
  { url: '/products?search=birthday+gift', priority: '0.8' },
  { url: '/products?search=couple+gift', priority: '0.8' },
];

// 21. Winter Collection & Warm Outfits
const WINTER_COLLECTION_URLS = [
  { url: '/category/winter', priority: '0.8' },
  { url: '/products?category=winter', priority: '0.8' },
  { url: '/products?search=hoodie', priority: '0.8' },
  { url: '/products?search=jacket', priority: '0.8' },
];

// 22. Foods & Organic Grocery
const ORGANIC_FOODS_URLS = [
  { url: '/category/foods', priority: '0.8' },
  { url: '/products?category=foods', priority: '0.8' },
  { url: '/products?search=honey', priority: '0.8' },
  { url: '/products?search=mustard+oil', priority: '0.8' },
  { url: '/products?search=dry+fruits', priority: '0.8' },
];

// 23. Car & Bike Riding Accessories
const CAR_BIKE_ACCESSORIES_URLS = [
  { url: '/category/others', priority: '0.7' },
  { url: '/products?search=bike+phone+holder', priority: '0.8' },
  { url: '/products?search=helmet+lock', priority: '0.7' },
  { url: '/products?search=car+cleaner', priority: '0.7' },
];

// 24. Wholesale & Reseller Deals
const WHOLESALE_RESELLER_URLS = [
  { url: '/seller', priority: '0.8' },
  { url: '/seller/register', priority: '0.8' },
  { url: '/affiliate', priority: '0.7' },
  { url: '/products?type=wholesale', priority: '0.7' },
];

// 25. Best Sellers & Most Popular
const BEST_SELLERS_URLS = [
  { url: '/products?sort=best_selling', priority: '0.9', changefreq: 'daily' },
  { url: '/products?sort=top_rated', priority: '0.9', changefreq: 'daily' },
  { url: '/flash-sale', priority: '0.8' },
  { url: '/new-arrivals', priority: '0.8' },
];

// 26. Products & Catalog Sitemap
function getProductUrls() {
  const catalogPath = path.join(__dirname, '..', 'public', 'mohasagor_catalog.json');
  let products = [];
  if (fs.existsSync(catalogPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      if (Array.isArray(data)) products = data;
    } catch {}
  }
  const urls = [];
  const seen = new Set();
  for (const p of products.slice(0, 5000)) {
    const slug = (p.slug || p.id || '').toString().trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    urls.push({
      url: `/product/${escapeXml(slug)}`,
      priority: '0.8',
      image: p.image || p.image_url || (p.images && p.images[0]) || '',
      imageTitle: p.name || p.title || 'Product in Bangladesh',
    });
  }
  if (urls.length === 0) {
    urls.push({ url: '/products', priority: '0.9' });
  }
  return urls;
}

// Full 25 Sales Sitemaps Index List
const ALL_SALES_SITEMAPS = [
  'sitemap-flash-sale.xml',
  'sitemap-combo-offers.xml',
  'sitemap-smart-watches.xml',
  'sitemap-tws-earbuds.xml',
  'sitemap-budget-gadgets.xml',
  'sitemap-mobile-accessories.xml',
  'sitemap-bluetooth-speakers.xml',
  'sitemap-mens-fashion.xml',
  'sitemap-womens-fashion.xml',
  'sitemap-home-kitchen.xml',
  'sitemap-beauty-grooming.xml',
  'sitemap-kids-toys.xml',
  'sitemap-viral-products.xml',
  'sitemap-cash-on-delivery.xml',
  'sitemap-free-shipping.xml',
  'sitemap-under-500.xml',
  'sitemap-under-1000.xml',
  'sitemap-under-2000.xml',
  'sitemap-luxury-collection.xml',
  'sitemap-gift-items.xml',
  'sitemap-winter-collection.xml',
  'sitemap-organic-foods.xml',
  'sitemap-car-bike-accessories.xml',
  'sitemap-wholesale-reseller.xml',
  'sitemap-best-sellers.xml',
  'sitemap-products.xml',
  'sitemap-pages.xml',
  'sitemap-categories.xml',
];

function generateMasterIndex() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const file of ALL_SALES_SITEMAPS) {
    xml += `  <sitemap>\n    <loc>${BASE_URL}/${file}</loc>\n    <lastmod>${TODAY}</lastmod>\n  </sitemap>\n`;
  }
  xml += `</sitemapindex>`;
  return xml;
}

function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  console.log('Generating 25 High-Sales Buyer Intent XML Sitemaps for Durtup.shop...');

  const productUrls = getProductUrls();

  fs.writeFileSync(path.join(publicDir, 'sitemap-flash-sale.xml'), buildUrlSetXml(FLASH_SALE_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-combo-offers.xml'), buildUrlSetXml(COMBO_OFFERS_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-smart-watches.xml'), buildUrlSetXml(SMART_WATCHES_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-tws-earbuds.xml'), buildUrlSetXml(TWS_EARBUDS_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-budget-gadgets.xml'), buildUrlSetXml(BUDGET_GADGETS_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-mobile-accessories.xml'), buildUrlSetXml(MOBILE_ACCESSORIES_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-bluetooth-speakers.xml'), buildUrlSetXml(BLUETOOTH_SPEAKERS_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-mens-fashion.xml'), buildUrlSetXml(MENS_FASHION_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-womens-fashion.xml'), buildUrlSetXml(WOMENS_FASHION_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-home-kitchen.xml'), buildUrlSetXml(HOME_KITCHEN_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-beauty-grooming.xml'), buildUrlSetXml(BEAUTY_GROOMING_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-kids-toys.xml'), buildUrlSetXml(KIDS_TOYS_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-viral-products.xml'), buildUrlSetXml(VIRAL_PRODUCTS_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-cash-on-delivery.xml'), buildUrlSetXml(CASH_ON_DELIVERY_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-free-shipping.xml'), buildUrlSetXml(FREE_SHIPPING_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-under-500.xml'), buildUrlSetXml(UNDER_500_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-under-1000.xml'), buildUrlSetXml(UNDER_1000_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-under-2000.xml'), buildUrlSetXml(UNDER_2000_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-luxury-collection.xml'), buildUrlSetXml(LUXURY_COLLECTION_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-gift-items.xml'), buildUrlSetXml(GIFT_ITEMS_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-winter-collection.xml'), buildUrlSetXml(WINTER_COLLECTION_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-organic-foods.xml'), buildUrlSetXml(ORGANIC_FOODS_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-car-bike-accessories.xml'), buildUrlSetXml(CAR_BIKE_ACCESSORIES_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-wholesale-reseller.xml'), buildUrlSetXml(WHOLESALE_RESELLER_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-best-sellers.xml'), buildUrlSetXml(BEST_SELLERS_URLS), 'utf8');

  // Master product and category backups
  fs.writeFileSync(path.join(publicDir, 'sitemap-products.xml'), buildUrlSetXml(productUrls), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-pages.xml'), buildUrlSetXml(FLASH_SALE_URLS.concat(CASH_ON_DELIVERY_URLS)), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-categories.xml'), buildUrlSetXml(SMART_WATCHES_URLS.concat(TWS_EARBUDS_URLS).concat(MENS_FASHION_URLS).concat(WOMENS_FASHION_URLS)), 'utf8');

  // Master Index
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), generateMasterIndex(), 'utf8');

  console.log('✅ Generated 25 High-Sales Target XML Sitemaps + 1 Master Index (sitemap.xml)!');
}

main();


