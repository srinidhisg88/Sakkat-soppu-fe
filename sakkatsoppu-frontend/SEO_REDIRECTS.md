# SEO and Redirect Instructions for Sakkat Soppu
# Add these configurations to your web server

## Apache (.htaccess)
# Redirect www to non-www
RewriteEngine On
RewriteCond %{HTTP_HOST} ^www\.sakkatsoppu\.com [NC]
RewriteRule ^(.*)$ https://sakkatsoppu.com/$1 [L,R=301]

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://sakkatsoppu.com/$1 [L,R=301]

## Nginx Configuration
# server {
#     listen 80;
#     server_name www.sakkatsoppu.com;
#     return 301 https://sakkatsoppu.com$request_uri;
# }
#
# server {
#     listen 443 ssl;
#     server_name www.sakkatsoppu.com;
#     return 301 https://sakkatsoppu.com$request_uri;
# }

## For Vercel/Netlify (add to vercel.json or _redirects)
# _redirects (Netlify)
# www.sakkatsoppu.com/* https://sakkatsoppu.com/:splat 301!

# vercel.json
# {
#   "redirects": [
#     {
#       "source": "/(.*)",
#       "destination": "https://sakkatsoppu.com/$1",
#       "statusCode": 301,
#       "condition": {
#         "host": "www.sakkatsoppu.com"
#       }
#     }
#   ]
# }