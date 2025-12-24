# 🚀 Multi-Tenant Subdomain - Quick Reference

## 📋 Summary

### ✅ Backend Status: READY
- Subdomain utilities: `src/utils/domains.ts`
- Webhook auto-verification: Implemented
- CORS: Wildcard subdomains configured
- Endpoints: All support multi-tenant

### 🔧 Frontend Status: NEEDS SETUP
- Middleware: ✅ Already detects subdomains
- Dynamic routes: ⏸️ Need to create `[subdomain]` folder
- API integration: ✅ Utilities exist in `utils/subdomain.ts`

---

## 🎯 Quick Start

### 1. Local Testing (Windows)

**Run as Administrator:**
```cmd
cd booking-frontend
setup-local-subdomains.bat
```

**Manual (edit `C:\Windows\System32\drivers\etc\hosts`):**
```
127.0.0.1 anderson-properties.localhost
127.0.0.1 john-realtor.localhost
```

### 2. Start Servers

```bash
# Terminal 1: Backend
cd booking-backend
npm run dev

# Terminal 2: Frontend
cd booking-frontend
npm run dev
```

### 3. Test

Visit: `http://anderson-properties.localhost:3000`

---

## 📁 File Structure

```
booking-frontend/
├── middleware.ts                     ✅ Already detects subdomains
├── src/
│   ├── app/
│   │   ├── page.tsx                  ✅ Main domain (stayza.pro)
│   │   ├── [subdomain]/              🔥 CREATE THIS
│   │   │   ├── page.tsx              → Realtor homepage
│   │   │   ├── property/[id]/
│   │   │   └── booking/[id]/
│   │   └── admin/                    ✅ Platform admin
│   │
│   └── utils/
│       └── subdomain.ts              ✅ Utilities exist
│
├── EXAMPLE_REALTOR_HOME.tsx          📖 Template for [subdomain]/page.tsx
└── SUBDOMAIN_IMPLEMENTATION_GUIDE.md 📖 Full guide
```

---

## 🔌 API Integration

### Client-Side (Automatic)

```typescript
import { buildApiUrl } from '@/utils/subdomain';

// Automatically adds subdomain parameter
const response = await fetch(buildApiUrl('/api/properties'));
// → /api/properties?subdomain=anderson-properties
```

### Server-Side

```typescript
import { headers } from 'next/headers';
import { getSubdomainFromHeaders } from '@/utils/subdomain';

const headersList = headers();
const subdomain = getSubdomainFromHeaders(headersList);
// → "anderson-properties"
```

---

## 🌐 Production Setup

### 1. DNS Configuration

**Cloudflare/Your DNS Provider:**
```
Type: A
Name: *
Value: YOUR_SERVER_IP
TTL: Auto
```

This maps `*.stayza.pro` to your server.

### 2. SSL Certificate

**Option A: Cloudflare (Easiest)**
1. SSL/TLS → Full (strict)
2. Certificate automatically includes `*.stayza.pro`

**Option B: Let's Encrypt**
```bash
certbot certonly --dns-cloudflare \
  -d stayza.pro \
  -d *.stayza.pro
```

### 3. Webhook Configuration

**Paystack Dashboard:**
1. Settings → Webhooks
2. URL: `https://yourdomain.com/api/webhooks/paystack`
3. Save (secret key already in `.env`)

**For Local Testing:**
```bash
ngrok http 5050
# Use: https://abc123.ngrok.io/api/webhooks/paystack
```

---

## 🐛 Troubleshooting

### Subdomain Not Working

**Check:**
```bash
# 1. Hosts file (Windows)
type C:\Windows\System32\drivers\etc\hosts

# 2. Middleware logs in terminal
# Should see: "🔍 Middleware: anderson-properties.localhost:3000"

# 3. Flush DNS
ipconfig /flushdns
```

### Realtor Not Found

**Check Database:**
```sql
SELECT id, "businessName", subdomain, status 
FROM "Realtor" 
WHERE subdomain = 'anderson-properties';
```

Ensure:
- `subdomain` field is set
- `status` = 'APPROVED'
- Matches exactly (lowercase)

### Payment Reference Null

**Already Fixed!** Check these lines exist in `payment.routes.ts`:

```typescript
// Line ~340
const reference = `PAY-${Date.now()}-${Math.random()
  .toString(36).substring(2, 11).toUpperCase()}`;

const payment = await prisma.payment.create({
  data: { reference, /* ... */ }
});
```

---

## 📊 Flow Examples

### 1. User visits subdomain
```
anderson-properties.stayza.pro
    ↓
Middleware detects subdomain
    ↓
Routes to [subdomain]/page.tsx
    ↓
Fetches /api/realtors/subdomain/anderson-properties
    ↓
Shows realtor profile + properties
```

### 2. Payment with auto-verification
```
User clicks "Book Now"
    ↓
POST /api/payments/initialize-paystack
    ↓
User pays on Paystack
    ↓
Webhook fires → /api/webhooks/paystack
    ↓
Auto-update: payment.status = COMPLETED
              booking.status = CONFIRMED
    ↓
Redirect to /api/payments/callback
    ↓
Show success page
```

---

## 🎯 Implementation Checklist

### Immediate (Local Testing)
- [ ] Run `setup-local-subdomains.bat` as admin
- [ ] Copy `EXAMPLE_REALTOR_HOME.tsx` to `src/app/[subdomain]/page.tsx`
- [ ] Start backend: `npm run dev`
- [ ] Start frontend: `npm run dev`
- [ ] Test: `http://anderson-properties.localhost:3000`

### Short-term (Features)
- [ ] Create `[subdomain]/property/[id]/page.tsx`
- [ ] Create `[subdomain]/booking/[id]/page.tsx`
- [ ] Add guest login/signup routes
- [ ] Implement property search/filters

### Production (Deployment)
- [ ] Configure DNS wildcard (`*.stayza.pro`)
- [ ] Obtain SSL wildcard certificate
- [ ] Set Paystack webhook URL
- [ ] Set Flutterwave webhook URL
- [ ] Test end-to-end payment flow
- [ ] Monitor webhook logs

---

## 📞 Key Endpoints

### Already Implemented

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/realtors/subdomain/:subdomain` | GET | Get realtor by subdomain |
| `/api/realtors/subdomain/check` | POST | Check subdomain availability |
| `/api/properties/realtor/:realtorId` | GET | Get realtor's properties |
| `/api/webhooks/paystack` | POST | Auto-verify payments |
| `/api/webhooks/flutterwave` | POST | Auto-verify payments |
| `/api/payments/callback` | GET | Post-payment redirect |

---

## 🔐 Environment Variables

### Backend (Already Configured)
```env
MAIN_DOMAIN=stayza.pro
DEV_DOMAIN=localhost:3000
PORT=5050
PAYSTACK_SECRET_KEY=sk_...
FLUTTERWAVE_SECRET_KEY=FLWSECK_...
```

### Frontend (May Need)
```env
NEXT_PUBLIC_API_URL=http://localhost:5050
NEXT_PUBLIC_MAIN_DOMAIN=stayza.pro
```

---

## 🎉 Status Summary

| Component | Status | Action |
|-----------|--------|--------|
| Backend Subdomain Utils | ✅ Complete | None |
| Backend Webhooks | ✅ Complete | Configure dashboard URLs |
| Frontend Middleware | ✅ Complete | None |
| Frontend Routes | ⏸️ Pending | Create `[subdomain]` folder |
| Local Testing Setup | ✅ Scripts Ready | Run as admin |
| DNS Configuration | ⏸️ Production | Add wildcard record |
| SSL Certificate | ⏸️ Production | Get wildcard cert |

**Next Action:** Create `src/app/[subdomain]/page.tsx` using `EXAMPLE_REALTOR_HOME.tsx` template.

---

## 📚 Documentation

1. **Full Implementation Guide**: `SUBDOMAIN_IMPLEMENTATION_GUIDE.md`
2. **Example Component**: `EXAMPLE_REALTOR_HOME.tsx`
3. **This Quick Ref**: `SUBDOMAIN_QUICK_REFERENCE.md`

---

**Backend: 100% Ready | Frontend: 80% Ready | Production: Awaiting DNS/SSL**
