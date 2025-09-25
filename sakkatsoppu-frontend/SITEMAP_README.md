# Sitemap Generation

This project uses a dynamic sitemap generation system to ensure proper XML formatting and avoid serving issues.

## How it works

1. **Automatic Generation**: The sitemap is generated using JavaScript and the `sitemap` npm package
2. **Build Integration**: Sitemap generation runs automatically during the build process
3. **Proper XML Format**: Uses streaming to generate valid XML with correct schema declarations
4. **Vercel Configuration**: Uses `vercel.json` to ensure proper routing and content-type headers

## Usage

### Generate Sitemap Manually
```bash
npm run generate-sitemap
```

### Build with Sitemap Generation
```bash
npm run build
```
The build process automatically generates a fresh sitemap before compiling the application.

## Configuration

### Sitemap URLs
Edit `scripts/generate-sitemap.js` to modify:
- Site URLs and their metadata
- Change frequencies
- Priorities
- Last modification dates

### Vercel Routing
The `vercel.json` file contains specific routes for SEO-critical files:
- `/sitemap.xml` - Served with `application/xml` content-type
- `/robots.txt` - Served with `text/plain` content-type
- `/site.webmanifest` - Served with `application/manifest+json` content-type

## Files

- `scripts/generate-sitemap.js` - The sitemap generation script
- `public/sitemap.xml` - Generated sitemap (created during build)
- `vercel.json` - Vercel configuration for proper routing and headers
- `SITEMAP_README.md` - This documentation