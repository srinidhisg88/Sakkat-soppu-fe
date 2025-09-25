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

### For Vercel (vercel.json)
```json
{
  "redirects": [
    {
      "source": "/(.*)",
      "destination": "https://sakkatsoppu.com/$1",
      "statusCode": 301,
      "condition": {
        "host": "www.sakkatsoppu.com"
      }
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
    }
  ]
}
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