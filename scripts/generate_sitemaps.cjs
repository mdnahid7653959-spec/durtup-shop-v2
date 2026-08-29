const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://durtup.shop';
const TODAY = new Date().toISOString().split('T')[0];

// 1. Static high-value pages
const STATIC_PAGES = [
  { url: '/', changefreq: 'daily', priority: '1.0' },
  { url: '/products', changefreq: 'daily', priority: '0.9' },
  { url: '/categories', changefreq: 'weekly', priority: '0.8' },
  { url: '/flash-sale', changefreq: 'daily', priority: '0.9' },
  { url: '/new-arrivals', changefreq: 'daily', priority: '0.8' },
  { url: '/free-shipping', changefreq: 'daily', priority: '0.8' },
  { url: '/about', changefreq: 'monthly', priority: '0.5' },
  { url: '/contact', changefreq: 'monthly', priority: '0.6' },
  { url: '/help', changefreq: 'monthly', priority: '0.5' },
  { url: '/shipping', changefreq: 'monthly', priority: '0.5' },
  { url: '/returns', changefreq: 'monthly', priority: '0.5' },
  { url: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { url: '/terms', changefreq: 'yearly', priority: '0.3' },
  { url: '/seller', changefreq: 'monthly', priority: '0.6' },
];

// 2. High-volume Categories
const CATEGORIES = [
  { slug: 'electronics', name: 'Electronics & Gadgets', priority: '0.8' },
  { slug: 'fashion', name: 'Fashion & Clothing', priority: '0.8' },
  { slug: 'smart-watches', name: 'Smart Watches', priority: '0.8' },
  { slug: 'audio', name: 'Earbuds & Audio', priority: '0.8' },
  { slug: 'home', name: 'Home & Living', priority: '0.7' },
  { slug: 'beauty', name: 'Health & Beauty', priority: '0.7' },
  { slug: 'mobile-accessories', name: 'Mobile Accessories', priority: '0.8' },
  { slug: 'toys-games', name: 'Toys & Kids', priority: '0.7' },
  { slug: 'shoes-footwear', name: 'Shoes & Footwear', priority: '0.7' },
  { slug: 'bags-backpacks', name: 'Bags & Backpacks', priority: '0.7' },
];

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Generate sitemap-pages.xml
function generatePagesSitemap() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const p of STATIC_PAGES) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}${p.url}</loc>\n`;
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
    xml += `    <priority>${p.priority}</priority>\n`;
    xml += `  </url>\n`;
  }
  xml += `</urlset>`;
  return xml;
}

// Generate sitemap-categories.xml
function generateCategoriesSitemap() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const c of CATEGORIES) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/category/${escapeXml(c.slug)}</loc>\n`;
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>${c.priority}</priority>\n`;
    xml += `  </url>\n`;
  }
  xml += `</urlset>`;
  return xml;
}

// Generate sitemap-products.xml from catalog
function generateProductsSitemap() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  let products = [];
  
  // Try reading mohasagor_catalog.json from public directory
  const catalogPath = path.join(__dirname, '..', 'public', 'mohasagor_catalog.json');
  if (fs.existsSync(catalogPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      if (Array.isArray(data)) products = data;
    } catch (e) {
      console.warn('Error reading mohasagor_catalog.json:', e.message);
    }
  }

  // If catalog has products, generate rich URLs
  const seenSlugs = new Set();
  for (const p of products.slice(0, 5000)) {
    const slug = (p.slug || p.id || '').toString().trim();
    if (!slug || seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    const title = p.name || p.title || 'Product';
    const imgUrl = p.image || p.image_url || (p.images && p.images[0]) || '';

    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/product/${escapeXml(slug)}</loc>\n`;
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    if (imgUrl && imgUrl.startsWith('http')) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(imgUrl)}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(title)}</image:title>\n`;
      xml += `      <image:caption>${escapeXml(title)} price in Bangladesh at Durtup.shop</image:caption>\n`;
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

// Generate sitemap.xml (Index)
function generateSitemapIndex() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  xml += `  <sitemap>\n    <loc>${BASE_URL}/sitemap-pages.xml</loc>\n    <lastmod>${TODAY}</lastmod>\n  </sitemap>\n`;
  xml += `  <sitemap>\n    <loc>${BASE_URL}/sitemap-categories.xml</loc>\n    <lastmod>${TODAY}</lastmod>\n  </sitemap>\n`;
  xml += `  <sitemap>\n    <loc>${BASE_URL}/sitemap-products.xml</loc>\n    <lastmod>${TODAY}</lastmod>\n  </sitemap>\n`;
  xml += `</sitemapindex>`;
  return xml;
}

function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  console.log('Generating Durtup.shop XML Sitemaps...');

  fs.writeFileSync(path.join(publicDir, 'sitemap-pages.xml'), generatePagesSitemap(), 'utf8');
  console.log('✅ sitemap-pages.xml created.');

  fs.writeFileSync(path.join(publicDir, 'sitemap-categories.xml'), generateCategoriesSitemap(), 'utf8');
  console.log('✅ sitemap-categories.xml created.');

  fs.writeFileSync(path.join(publicDir, 'sitemap-products.xml'), generateProductsSitemap(), 'utf8');
  console.log('✅ sitemap-products.xml created.');

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), generateSitemapIndex(), 'utf8');
  console.log('✅ sitemap.xml (Index) created.');

  console.log('All XML Sitemaps successfully created in /public ! 🎉');
}

main();
