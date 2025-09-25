# Sitemap Generation

This project uses a dynamic sitemap generation system to ensure proper XML formatting and avoid serving issues.

## How it works

1. **Automatic Generation**: The sitemap is generated using JavaScript and the `sitemap` npm package
2. **Build Integration**: Sitemap generation runs automatically during the build process
3. **Proper XML Format**: Uses streaming to generate valid XML with correct schema declarations

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

Edit `scripts/generate-sitemap.js` to modify:
- Site URLs and their metadata
- Change frequencies
- Priorities
- Last modification dates

## Files

- `scripts/generate-sitemap.js` - The sitemap generation script
- `public/sitemap.xml` - Generated sitemap (created during build)
- `public/_headers` - Content-type headers for proper serving