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
      xml += `      <image:title>${escapeXml(item.imageTitle || 'Durtup Product')}</image:title>\n`;
      xml += `      <image:caption>${escapeXml(item.imageTitle || 'Online Shopping in Bangladesh at Durtup.shop')}</image:caption>\n`;
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n`;
  }
  xml += `</urlset>`;
  return xml;
}

// 1. Static Pages
const PAGES_URLS = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/products', priority: '0.9', changefreq: 'daily' },
  { url: '/categories', priority: '0.9', changefreq: 'weekly' },
  { url: '/about', priority: '0.7', changefreq: 'monthly' },
  { url: '/contact', priority: '0.7', changefreq: 'monthly' },
  { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { url: '/terms', priority: '0.3', changefreq: 'yearly' },
  { url: '/cookies', priority: '0.3', changefreq: 'yearly' },
  { url: '/ip', priority: '0.3', changefreq: 'yearly' },
];

// 2. Categories
const CATEGORY_URLS = [
  { url: '/category/gadgets-electronics', priority: '0.9' },
  { url: '/category/mens-fashion', priority: '0.9' },
  { url: '/category/womens-fashion', priority: '0.9' },
  { url: '/category/watch', priority: '0.9' },
  { url: '/category/home-lifestyle', priority: '0.8' },
  { url: '/category/kids-zone', priority: '0.8' },
  { url: '/category/foods', priority: '0.8' },
  { url: '/category/winter', priority: '0.7' },
  { url: '/category/customize-gift', priority: '0.7' },
  { url: '/category/offer', priority: '0.8' },
  { url: '/category/mobile-accessories', priority: '0.8' },
  { url: '/category/earbuds-headphones', priority: '0.8' },
  { url: '/category/smart-watch', priority: '0.8' },
  { url: '/category/power-bank', priority: '0.8' },
  { url: '/category/others', priority: '0.6' },
];

// 3. Gadgets
const GADGET_URLS = [
  { url: '/category/gadgets-electronics', priority: '0.9' },
  { url: '/category/smart-watch', priority: '0.9' },
  { url: '/category/earbuds-headphones', priority: '0.9' },
  { url: '/category/power-bank', priority: '0.8' },
  { url: '/category/mobile-accessories', priority: '0.8' },
];

// 4. Electronics
const ELECTRONIC_URLS = [
  { url: '/category/gadgets-electronics', priority: '0.9' },
  { url: '/category/mobile-accessories', priority: '0.8' },
  { url: '/category/power-bank', priority: '0.8' },
];

// 5. Men's Fashion
const MENS_FASHION_URLS = [
  { url: '/category/mens-fashion', priority: '0.9' },
  { url: '/products?category=mens-fashion', priority: '0.8' },
];

// 6. Women's Fashion
const WOMENS_FASHION_URLS = [
  { url: '/category/womens-fashion', priority: '0.9' },
  { url: '/products?category=womens-fashion', priority: '0.8' },
];

// 7. Watches
const WATCHES_URLS = [
  { url: '/category/watch', priority: '0.9' },
  { url: '/category/smart-watch', priority: '0.9' },
  { url: '/products?category=watch', priority: '0.8' },
];

// 8. Earbuds & Audio
const EARBUDS_URLS = [
  { url: '/category/earbuds-headphones', priority: '0.9' },
  { url: '/products?category=earbuds-headphones', priority: '0.8' },
];

// 9. Home & Lifestyle
const HOME_URLS = [
  { url: '/category/home-lifestyle', priority: '0.8' },
  { url: '/category/customize-gift', priority: '0.7' },
  { url: '/products?category=home-lifestyle', priority: '0.8' },
];

// 10. Deals & Discounts
const DEALS_URLS = [
  { url: '/flash-sale', priority: '0.9' },
  { url: '/category/offer', priority: '0.9' },
  { url: '/free-shipping', priority: '0.8' },
  { url: '/new-arrivals', priority: '0.8' },
];

// 11. Flash Sale
const FLASH_SALE_URLS = [
  { url: '/flash-sale', priority: '0.9' },
  { url: '/products?sort=discount', priority: '0.8' },
];

// 12. Free Shipping
const FREE_SHIPPING_URLS = [
  { url: '/free-shipping', priority: '0.8' },
  { url: '/shipping', priority: '0.7' },
];

// 13. New Arrivals
const NEW_ARRIVALS_URLS = [
  { url: '/new-arrivals', priority: '0.8' },
  { url: '/products?sort=newest', priority: '0.8' },
];

// 14. Kids Zone
const KIDS_URLS = [
  { url: '/category/kids-zone', priority: '0.8' },
  { url: '/products?category=kids-zone', priority: '0.7' },
];

// 15. Sellers & Resellers
const SELLER_URLS = [
  { url: '/seller', priority: '0.8' },
  { url: '/seller/register', priority: '0.7' },
  { url: '/affiliate', priority: '0.7' },
];

// 16. Press Center
const PRESS_URLS = [
  { url: '/press', priority: '0.8' },
  { url: '/about', priority: '0.7' },
];

// 17. Help & Support
const HELP_URLS = [
  { url: '/help', priority: '0.7' },
  { url: '/shipping', priority: '0.7' },
  { url: '/returns', priority: '0.7' },
  { url: '/track', priority: '0.7' },
  { url: '/contact', priority: '0.7' },
];

// 18. Bangladesh 64 Districts Locations
const LOCATION_URLS = [
  { url: '/shipping#dhaka', priority: '0.8' },
  { url: '/shipping#chittagong', priority: '0.7' },
  { url: '/shipping#sylhet', priority: '0.7' },
  { url: '/shipping#rajshahi', priority: '0.7' },
  { url: '/shipping#khulna', priority: '0.7' },
  { url: '/shipping#barishal', priority: '0.7' },
  { url: '/shipping#rangpur', priority: '0.7' },
  { url: '/shipping#mymensingh', priority: '0.7' },
];

// 19. Products & Images
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

// 20 Master Index
const SITEMAP_FILES = [
  'sitemap-pages.xml',
  'sitemap-categories.xml',
  'sitemap-products.xml',
  'sitemap-gadgets.xml',
  'sitemap-electronics.xml',
  'sitemap-mens-fashion.xml',
  'sitemap-womens-fashion.xml',
  'sitemap-watches.xml',
  'sitemap-earbuds.xml',
  'sitemap-home.xml',
  'sitemap-deals.xml',
  'sitemap-flash-sale.xml',
  'sitemap-free-shipping.xml',
  'sitemap-new-arrivals.xml',
  'sitemap-kids.xml',
  'sitemap-sellers.xml',
  'sitemap-press.xml',
  'sitemap-help.xml',
  'sitemap-locations.xml',
  'sitemap-images.xml',
];

function generateMasterIndex() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const file of SITEMAP_FILES) {
    xml += `  <sitemap>\n    <loc>${BASE_URL}/${file}</loc>\n    <lastmod>${TODAY}</lastmod>\n  </sitemap>\n`;
  }
  xml += `</sitemapindex>`;
  return xml;
}

function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  console.log('Generating 20 thematic XML sitemaps for Durtup.shop...');

  const productUrls = getProductUrls();

  fs.writeFileSync(path.join(publicDir, 'sitemap-pages.xml'), buildUrlSetXml(PAGES_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-categories.xml'), buildUrlSetXml(CATEGORY_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-products.xml'), buildUrlSetXml(productUrls), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-gadgets.xml'), buildUrlSetXml(GADGET_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-electronics.xml'), buildUrlSetXml(ELECTRONIC_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-mens-fashion.xml'), buildUrlSetXml(MENS_FASHION_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-womens-fashion.xml'), buildUrlSetXml(WOMENS_FASHION_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-watches.xml'), buildUrlSetXml(WATCHES_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-earbuds.xml'), buildUrlSetXml(EARBUDS_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-home.xml'), buildUrlSetXml(HOME_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-deals.xml'), buildUrlSetXml(DEALS_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-flash-sale.xml'), buildUrlSetXml(FLASH_SALE_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-free-shipping.xml'), buildUrlSetXml(FREE_SHIPPING_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-new-arrivals.xml'), buildUrlSetXml(NEW_ARRIVALS_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-kids.xml'), buildUrlSetXml(KIDS_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-sellers.xml'), buildUrlSetXml(SELLER_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-press.xml'), buildUrlSetXml(PRESS_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-help.xml'), buildUrlSetXml(HELP_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-locations.xml'), buildUrlSetXml(LOCATION_URLS), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-images.xml'), buildUrlSetXml(productUrls.filter(p => p.image)), 'utf8');

  // Master Index
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), generateMasterIndex(), 'utf8');

  console.log('✅ Generated 20 dedicated thematic XML Sitemaps + 1 Master Index (sitemap.xml)!');
}

main();

