# SEO and Redirect Instructions for Sakkat Soppu
# Add these configurations to your web server

## Sitemap MIME Type Configuration

### For Apache (.htaccess)
Add this to your .htaccess file:
```
<Files "sitemap.xml">
  Header set Content-Type "application/xml; charset=utf-8"
</Files>
```

### For Nginx
Add this to your nginx.conf:
```
location = /sitemap.xml {
    add_header Content-Type "application/xml; charset=utf-8";
    try_files /sitemap.xml =404;
}
```

### For Vercel (_headers)
Create `public/_headers` file:
```
/sitemap.xml
  Content-Type: application/xml; charset=utf-8
```

### For Netlify (_headers)
Create `public/_headers` file:
```
/sitemap.xml
  Content-Type: application/xml; charset=utf-8
```

## Domain Redirects

### Apache (.htaccess)
```apache
# Redirect www to non-www
RewriteEngine On
RewriteCond %{HTTP_HOST} ^www\.sakkatsoppu\.com [NC]
RewriteRule ^(.*)$ https://sakkatsoppu.com/$1 [L,R=301]

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://sakkatsoppu.com/$1 [L,R=301]
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name www.sakkatsoppu.com;
    return 301 https://sakkatsoppu.com$request_uri;
}

server {
    listen 443 ssl;
    server_name www.sakkatsoppu.com;
    return 301 https://sakkatsoppu.com$request_uri;
}
```

# SEO and Redirect Instructions for Sakkat Soppu
# Add these configurations to your web server

## SPA Static File Serving Fix (Critical for Sitemaps)

### For Netlify (_redirects)
The `_redirects` file has been created to prevent SPA routing from intercepting static files:

```
/sitemap.xml /sitemap.xml 200
/robots.txt /robots.txt 200
/favicon.ico /favicon.ico 200
/*.png /:splat 200
/*.jpg /:splat 200
/*.jpeg /:splat 200
/*.svg /:splat 200
/*.ico /:splat 200
/*.xml /:splat 200
/*.txt /:splat 200
/*.webmanifest /:splat 200

# SPA fallback
/* /index.html 200
```

### For Vercel (vercel.json)
```json
{
  "rewrites": [
    {
      "source": "/((?!sitemap\\.xml|robots\\.txt|favicon\\.ico|.*\\.(png|jpg|jpeg|svg|ico|xml|txt|webmanifest)).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/sitemap.xml",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/xml; charset=utf-8"
        }
      ]
    },
    {
      "source": "/robots.txt",
      "headers": [
        {
          "key": "Content-Type",
          "value": "text/plain; charset=utf-8"
        }
      ]
    }
  ]
}
```

## Sitemap MIME Type Configuration

### For Apache (.htaccess)
Add this to your .htaccess file:
```
<Files "sitemap.xml">
  Header set Content-Type "application/xml; charset=utf-8"
</Files>

# Prevent SPA routing for static files
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]
```

### For Nginx
Add this to your nginx.conf:
```
location ~* \.(xml|txt|ico|png|jpg|jpeg|svg|webmanifest)$ {
    add_header Cache-Control "public, max-age=31536000";
    try_files $uri =404;
}

location = /sitemap.xml {
    add_header Content-Type "application/xml; charset=utf-8";
    try_files /sitemap.xml =404;
}
```

## Domain Redirects

### Apache (.htaccess)
```apache
# Prevent SPA routing for static files
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# Redirect www to non-www
RewriteEngine On
RewriteCond %{HTTP_HOST} ^www\.sakkatsoppu\.com [NC]
RewriteRule ^(.*)$ https://sakkatsoppu.com/$1 [L,R=301]

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://sakkatsoppu.com/$1 [L,R=301]
```

### Nginx Configuration
```nginx
# Static files
location ~* \.(xml|txt|ico|png|jpg|jpeg|svg|webmanifest)$ {
    add_header Cache-Control "public, max-age=31536000";
    try_files $uri =404;
}

# Sitemap
location = /sitemap.xml {
    add_header Content-Type "application/xml; charset=utf-8";
    try_files /sitemap.xml =404;
}

# Redirects
server {
    listen 80;
    server_name www.sakkatsoppu.com;
    return 301 https://sakkatsoppu.com$request_uri;
}

server {
    listen 443 ssl;
    server_name www.sakkatsoppu.com;
    return 301 https://sakkatsoppu.com$request_uri;
}
```

### For Netlify (_redirects and _headers)
_redirects:
```
# Static files - serve directly
/sitemap.xml /sitemap.xml 200
/robots.txt /robots.txt 200
/favicon.ico /favicon.ico 200
/*.png /:splat 200
/*.jpg /:splat 200
/*.jpeg /:splat 200
/*.svg /:splat 200
/*.ico /:splat 200
/*.xml /:splat 200
/*.txt /:splat 200
/*.webmanifest /:splat 200

# Domain redirect
https://www.sakkatsoppu.com/* https://sakkatsoppu.com/:splat 301!

# SPA fallback
/* /index.html 200
```

_headers:
```
/sitemap.xml
  Content-Type: application/xml; charset=utf-8

/robots.txt
  Content-Type: text/plain; charset=utf-8
```

### For Netlify (_redirects and _headers)
_redirects:
```
https://www.sakkatsoppu.com/* https://sakkatsoppu.com/:splat 301!
```

_headers:
```
/sitemap.xml
  Content-Type: application/xml; charset=utf-8
```