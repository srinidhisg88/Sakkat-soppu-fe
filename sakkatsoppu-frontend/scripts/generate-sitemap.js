import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define your site's URLs
const urls = [
  {
    url: '/',
    changefreq: 'weekly',
    priority: 1.0,
    lastmod: new Date().toISOString()
  },
  {
    url: '/products',
    changefreq: 'daily',
    priority: 0.9,
    lastmod: new Date().toISOString()
  },
  {
    url: '/about',
    changefreq: 'monthly',
    priority: 0.8,
    lastmod: new Date().toISOString()
  },
  {
    url: '/login',
    changefreq: 'yearly',
    priority: 0.3,
    lastmod: new Date().toISOString()
  },
  {
    url: '/signup',
    changefreq: 'yearly',
    priority: 0.3,
    lastmod: new Date().toISOString()
  }
];

async function generateSitemap() {
  try {
    // Create sitemap stream
    const sitemap = new SitemapStream({
      hostname: 'https://sakkatsoppu.com',
      cacheTime: 600000, // 10 minutes
    });

    // Create write stream
    const writeStream = createWriteStream(join(__dirname, '..', 'public', 'sitemap.xml'));

    // Pipe sitemap to write stream
    sitemap.pipe(writeStream);

    // Add URLs to sitemap
    urls.forEach(url => {
      sitemap.write(url);
    });

    // End the stream
    sitemap.end();

    // Wait for the stream to finish
    await streamToPromise(sitemap);

    console.log('✅ Sitemap generated successfully at public/sitemap.xml');
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

generateSitemap();