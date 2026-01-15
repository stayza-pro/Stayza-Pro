# Vercel Subdomain Configuration for Stayza Pro

## The Problem

You're being redirected to `http://sylvester.localhost:3000/dashboard` which doesn't work on Vercel because:
1. Vercel doesn't support wildcard subdomains on `*.vercel.app` domains
2. You need a custom domain with wildcard DNS configuration

## Solutions

### Option 1: Use Your Custom Domain (Recommended)

#### Step 1: Purchase and Configure Domain
1. Buy a domain (e.g., `stayza.pro`)
2. Add it to Vercel project
3. Configure DNS with wildcard:
   - Add A record: `@` → Vercel IP
   - Add A record: `*` → Vercel IP (wildcard for subdomains)
   - Or CNAME: `*` → `cname.vercel-dns.com`

#### Step 2: Update Vercel Environment Variables
```bash
NEXT_PUBLIC_API_URL=https://stayza-pro.onrender.com/api
NEXT_PUBLIC_MAIN_DOMAIN=stayza.pro
NODE_ENV=production
```

#### Step 3: Redeploy
After domain is configured, realtor subdomains will work:
- Main site: `https://stayza.pro`
- Realtor dashboard: `https://sylvester.stayza.pro/dashboard`

---

### Option 2: Temporary Workaround (For Testing)

If you don't have a custom domain yet, modify the app to work without subdomains:

#### Realtor Dashboard Routes:
- Instead of: `sylvester.stayza.pro/dashboard`
- Use: `stayza.pro/realtor/sylvester/dashboard`

This requires changing the routing logic but works on Vercel without custom domains.

---

## Quick Fix for Current Issue

Your JWT tokens are in the URL. To manually access your dashboard:

1. Open browser DevTools (F12)
2. Go to Console
3. Run this code to save tokens:

```javascript
// Extract tokens from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const refresh = urlParams.get('refresh');

// Save to localStorage
localStorage.setItem('accessToken', token);
localStorage.setItem('refreshToken', refresh);

// Redirect to main domain dashboard
window.location.href = 'https://stayza-pro.vercel.app/dashboard';
```

4. This should log you into the dashboard on the main domain

---

## Vercel Project Settings

### Environment Variables to Add:

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these:

| Variable | Value | Environments |
|----------|-------|--------------|
| `NEXT_PUBLIC_API_URL` | `https://stayza-pro.onrender.com/api` | Production, Preview, Development |
| `NEXT_PUBLIC_MAIN_DOMAIN` | `stayza-pro.vercel.app` (or your custom domain) | Production |
| `NEXT_PUBLIC_MAIN_DOMAIN` | `localhost:3000` | Development |
| `NODE_ENV` | `production` | Production |

### Domains to Add:

1. Go to: **Vercel Dashboard → Your Project → Settings → Domains**
2. Add your custom domain
3. Add wildcard: `*.yourdomain.com`
4. Follow Vercel's DNS configuration instructions

---

## Testing Locally with Subdomains

To test subdomains on localhost:

1. Edit your hosts file:
   - **Windows**: `C:\Windows\System32\drivers\etc\hosts`
   - **Mac/Linux**: `/etc/hosts`

2. Add entries:
```
127.0.0.1 localhost
127.0.0.1 sylvester.localhost
127.0.0.1 test-realtor.localhost
```

3. Access: `http://sylvester.localhost:3000/dashboard`

---

## Alternative: Deploy Without Subdomains

If you want to avoid the subdomain complexity:

1. Use path-based routing: `/realtor/:slug/dashboard`
2. Modify the routing logic in the app
3. This works immediately on Vercel without custom domain

Let me know which approach you prefer!
