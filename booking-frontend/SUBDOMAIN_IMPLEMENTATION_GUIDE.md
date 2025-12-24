# 🏢 Multi-Tenant Subdomain Implementation Guide

## ✅ What's Already Done (Backend)

Your backend is **100% ready** for multi-tenant subdomains:

✅ **Domain Utility** (`src/utils/domains.ts`):
- `getDomainConfig()` - Environment detection (prod vs dev)
- `buildSubdomainUrl(subdomain, path)` - Generates realtor URLs
- `buildMainDomainUrl(path)` - Generates platform URLs

✅ **Configuration** (`src/config/index.ts`):
```typescript
MAIN_DOMAIN: stayza.pro       // Production
DEV_DOMAIN: localhost:3000    // Development
PORT: 5050                    // Backend server
```

✅ **CORS**: Already configured for wildcard subdomains (`*.stayza.pro`)

✅ **Subdomain Validation**: `/api/realtors/subdomain/check` endpoint
- Regex: `/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/`
- Reserved: www, api, admin, dashboard, app, mail, etc.

✅ **Email Links**: Already use `buildSubdomainUrl()` for realtor-specific verification

---

## 🎯 Frontend Setup (Next.js)

### ✅ Step 1: Middleware (Already Done!)

Your `middleware.ts` already handles:
- Subdomain detection from hostname
- Development (`anderson-properties.localhost:3000`)
- Production (`anderson-properties.stayza.pro`)
- Headers: `x-subdomain`, `x-tenant-type`, `x-realtor-subdomain`

### 📁 Step 2: Folder Structure

Create this structure in `booking-frontend/src/app/`:

```
src/app/
├── page.tsx                    # Main domain (stayza.pro)
├── about/
├── register/                   # Realtor registration
├── admin/                      # Platform admin
│   └── dashboard/
│
└── [subdomain]/                # 🔥 Realtor subdomains (NEW)
    ├── page.tsx                # anderson-properties.stayza.pro/
    ├── properties/
    │   └── page.tsx            # /properties list
    ├── property/
    │   └── [id]/
    │       └── page.tsx        # /property/123
    ├── booking/
    │   └── [id]/
    │       └── page.tsx        # /booking/456
    ├── login/                  # Guest login
    │   └── page.tsx
    └── signup/                 # Guest signup
        └── page.tsx
```

### 📄 Step 3: Create Dynamic Route

Use the example file I created: `EXAMPLE_REALTOR_HOME.tsx`

Move it to: `src/app/[subdomain]/page.tsx`

This will handle all realtor subdomain homepages.

---

## 🧪 Local Testing

### Option 1: Hosts File (Recommended)

**Windows**: Edit `C:\Windows\System32\drivers\etc\hosts`
```
127.0.0.1 anderson-properties.localhost
127.0.0.1 john-realtor.localhost
```

**Mac/Linux**: Edit `/etc/hosts`
```
127.0.0.1 anderson-properties.localhost
127.0.0.1 john-realtor.localhost
```

Then access: `http://anderson-properties.localhost:3000`

### Option 2: Direct Subdomain

Just use the format directly:
```
http://anderson-properties.localhost:3000
```

Your middleware already handles `.localhost` domains.

---

## 🚀 Production Deployment

### 1. Configure DNS

Add **wildcard A record** in your DNS provider:

```
Type: A
Name: *
Value: YOUR_SERVER_IP
TTL: 300
```

This maps `*.stayza.pro` → Your server

Or add specific subdomains:
```
Type: A
Name: anderson-properties
Value: YOUR_SERVER_IP
```

### 2. SSL Certificate

Get a **wildcard certificate** for `*.stayza.pro`:

**With Certbot/Let's Encrypt:**
```bash
sudo certbot certonly --dns-cloudflare \
  -d stayza.pro \
  -d *.stayza.pro
```

**With Cloudflare:**
- Go to SSL/TLS → Origin Server
- Create Certificate
- Select "wildcard" and add `*.stayza.pro`

### 3. Verify CORS

Your backend already has:
```typescript
// app.ts
app.use(cors({
  origin: [
    'http://localhost:3000',
    /^https?:\/\/.*\.stayza\.pro$/  // ✅ Wildcard
  ],
  credentials: true
}));
```

---

## 🔌 API Integration Examples

### Client-Side Fetch (from utilities)

```typescript
import { buildApiUrl, getSubdomain } from '@/utils/subdomain';

// Automatically includes subdomain parameter
const response = await fetch(buildApiUrl('/api/properties'));
// → http://localhost:5050/api/properties?subdomain=anderson-properties
```

### Server-Side (getServerSideProps)

```typescript
import { headers } from 'next/headers';
import { getSubdomainFromHeaders } from '@/utils/subdomain';

export async function getServerSideProps() {
  const headersList = headers();
  const subdomain = getSubdomainFromHeaders(headersList);
  
  const res = await fetch(`http://localhost:5050/api/realtors/subdomain/${subdomain}`);
  const data = await res.json();
  
  return { props: { realtor: data.data } };
}
```

### Backend Endpoint for Subdomain Data

Already exists: `GET /api/realtors/subdomain/:subdomain`

---

## 🎨 Example Usage Flow

### 1. User visits `anderson-properties.stayza.pro`

1. **Middleware** detects subdomain: `anderson-properties`
2. Sets headers: `x-subdomain: anderson-properties`, `x-tenant-type: realtor`
3. Next.js routes to: `src/app/[subdomain]/page.tsx`
4. Page fetches: `/api/realtors/subdomain/anderson-properties`
5. Displays realtor profile + properties

### 2. User clicks property

1. Navigates to: `anderson-properties.stayza.pro/property/123`
2. Routes to: `src/app/[subdomain]/property/[id]/page.tsx`
3. Fetches: `/api/properties/123?subdomain=anderson-properties`
4. Shows property details

### 3. User books property

1. Goes to: `anderson-properties.stayza.pro/booking/123`
2. Routes to: `src/app/[subdomain]/booking/[id]/page.tsx`
3. Payment initialized with realtor's subdomain context
4. Success redirect back to subdomain

---

## 🔧 Webhook Configuration (Auto-Verification)

### Paystack Dashboard

1. Go to: **Settings → Webhooks**
2. Add URL: `https://yourdomain.com/api/webhooks/paystack`
3. Save Secret Key (already in your env: `PAYSTACK_SECRET_KEY`)

### For Local Testing (ngrok)

```bash
# Terminal 1: Start backend
cd booking-backend
npm run dev

# Terminal 2: Expose with ngrok
ngrok http 5050
```

Use ngrok URL in Paystack: `https://abc123.ngrok.io/api/webhooks/paystack`

### Verification Flow

```
User pays → Paystack → Webhook fires → Auto-verify
                                    ↓
                              payment.status = COMPLETED
                              booking.status = CONFIRMED
```

Manual verify (`POST /api/payments/verify-paystack`) is now **fallback only**.

---

## 📋 Testing Checklist

### Local Development
- [ ] Start backend: `cd booking-backend && npm run dev`
- [ ] Start frontend: `cd booking-frontend && npm run dev`
- [ ] Add hosts entry: `127.0.0.1 anderson-properties.localhost`
- [ ] Visit: `http://anderson-properties.localhost:3000`
- [ ] Check console for middleware logs
- [ ] Verify subdomain detected in dev tools

### Production
- [ ] DNS wildcard configured (`*.stayza.pro`)
- [ ] SSL wildcard certificate installed
- [ ] Paystack webhook URL set
- [ ] Flutterwave webhook URL set
- [ ] CORS allows subdomain requests
- [ ] Test payment flow end-to-end
- [ ] Verify webhook auto-updates payment

---

## 🐛 Troubleshooting

### "Realtor Not Found" on Subdomain

**Check:**
1. Realtor has `subdomain` field set in database
2. Subdomain matches exactly (lowercase, no special chars)
3. Realtor status is `APPROVED`

**Query:**
```sql
SELECT id, "businessName", subdomain, status FROM "Realtor";
```

### Middleware Not Detecting Subdomain

**Check:**
1. Hostname format: `subdomain.localhost:3000` (dev) or `subdomain.stayza.pro` (prod)
2. Browser console for middleware logs
3. Response headers: `x-subdomain`, `x-tenant-type`

### Payment Reference Still Null

**Already Fixed!** But if issues persist:
```typescript
// This is already in your code:
const reference = `PAY-${Date.now()}-${Math.random()
  .toString(36).substring(2, 11).toUpperCase()}`;

const payment = await prisma.payment.create({
  data: { reference, /* ... */ }
});
```

---

## 🎉 Summary

### Backend: ✅ 100% Ready
- Subdomain utilities exist
- CORS configured
- Webhooks implemented
- Email links use subdomains

### Frontend: 🚧 Needs Implementation
1. Create `src/app/[subdomain]/` routes
2. Use `EXAMPLE_REALTOR_HOME.tsx` as template
3. Test locally with `.localhost` domains
4. Configure DNS for production

### Production: ⏸️ Ready to Deploy
1. Set DNS wildcard: `* → YOUR_IP`
2. Get SSL cert: `*.stayza.pro`
3. Configure Paystack webhook URL
4. Deploy and test

---

## 📞 Next Steps

1. **Copy** `EXAMPLE_REALTOR_HOME.tsx` to `src/app/[subdomain]/page.tsx`
2. **Test** locally: `http://anderson-properties.localhost:3000`
3. **Configure** Paystack webhook URL (ngrok for testing)
4. **Deploy** with DNS + SSL when ready

Your system is architecturally ready - just need to wire up the frontend routes! 🚀
