# 🎨 STAYZA - WHITE-LABEL PLATFORM OVERVIEW

**Quick Reference: Understanding Stayza's White-Label Architecture**

---

## 🌟 WHAT IS STAYZA?

**Stayza is a white-label, multi-tenant booking SaaS platform** that allows real estate agents and property managers to get their own branded booking website instantly.

### The White-Label Model:

```
┌─────────────────────────────────────────────────────┐
│                  STAYZA PLATFORM                     │
│              (Behind the Scenes)                     │
└─────────────────────────────────────────────────────┘
                        ▼
        ┌───────────────┴───────────────┐
        │                               │
   ┌────▼─────┐                    ┌────▼─────┐
   │ REALTOR A│                    │ REALTOR B│
   └────┬─────┘                    └────┬─────┘
        │                               │
        ▼                               ▼
┌───────────────┐              ┌───────────────┐
│ loligoing     │              │ premiumstays  │
│ .stayza.pro   │              │ .stayza.pro   │
├───────────────┤              ├───────────────┤
│ 🎨 Logo       │              │ 🎨 Logo       │
│ 🎨 Blue Theme │              │ 🎨 Gold Theme │
│ 🏠 Properties │              │ 🏠 Properties │
│ 💳 Bookings   │              │ 💳 Bookings   │
└───────────────┘              └───────────────┘
        ▲                               ▲
        │                               │
  ┌─────┴─────┐                   ┌─────┴─────┐
  │ GUEST 1   │                   │ GUEST 2   │
  │ Books     │                   │ Books     │
  └───────────┘                   └───────────┘
```

---

## 🎯 HOW IT WORKS

### For Realtors:
1. **Register** → Choose subdomain (e.g., "loligoing")
2. **Customize** → Upload logo, set colors, add tagline
3. **Add Properties** → List their rental properties
4. **Share Link** → Give guests `loligoing.stayza.pro`
5. **Manage** → Handle bookings, payments, reviews from dashboard

### For Guests:
1. **Visit** → `loligoing.stayza.pro` (realtor's branded site)
2. **See** → Realtor's logo, colors, properties ONLY
3. **Book** → Complete booking with realtor's branding
4. **Pay** → Secure payment through platform
5. **Never Know** → They're using a SaaS platform (that's white-label!)

---

## ✨ WHITE-LABEL FEATURES

### ✅ Currently Working:

1. **Custom Subdomains**
   - Each realtor: `[their-name].stayza.pro`
   - Automatic routing
   - Full isolation

2. **Brand Customization**
   - Logo upload
   - Primary/Secondary/Accent colors
   - Agency name & tagline
   - Business description

3. **Independent Sites**
   - Each realtor has separate guest-facing site
   - Only their properties show
   - Only their brand visible

4. **Branded Communications**
   - Booking confirmations with realtor info
   - Payment receipts with branding
   - Review notifications

### ⚠️ Need Implementation:

1. **Branding Dashboard** (Week 4)
   - UI to change logo/colors
   - Live preview of guest site
   - Save/publish changes

2. **Custom Domains** (Week 6)
   - Use realtor's own domain
   - `book.loligoinghomes.com` instead of subdomain
   - DNS setup & SSL certificates

3. **White-Label Emails** (Week 4)
   - Realtor logo in emails
   - Realtor colors in design
   - Fully branded communications

4. **Feature Toggles** (Week 7)
   - Enable/disable reviews
   - Enable/disable wishlists
   - Control guest site features

---

## 🏗️ TECHNICAL ARCHITECTURE

### Multi-Tenant Design:

```typescript
// Request Flow:
Guest visits → loligoing.stayza.pro
             ↓
Middleware extracts subdomain: "loligoing"
             ↓
Database fetch: Realtor + Branding
             ↓
Apply branding to site
             ↓
Show realtor's properties only
             ↓
Guest books property
             ↓
Payment goes to realtor (minus platform fee)
```

### Data Isolation:

```typescript
// Each realtor has separate:
- Properties
- Bookings
- Payments
- Reviews
- Analytics
- Branding settings

// Guests NEVER see:
- Other realtors' data
- Platform branding
- "Powered by Stayza" (optional)
```

---

## 📊 COMPARISON

### Traditional Booking Platforms (Airbnb, Booking.com):
```
❌ Platform branding everywhere
❌ Compete with other listings
❌ High commission fees
❌ No brand control
❌ Guests see platform, not you
```

### Stayza White-Label:
```
✅ YOUR branding everywhere
✅ Only YOUR properties visible
✅ Lower fees (you control)
✅ Complete brand control
✅ Guests see YOUR business only
```

---

## 💰 BUSINESS MODEL

### For Platform (Stayza):
- Subscription fees from realtors
- Transaction fees (small %)
- Premium features (custom domains, etc.)

### For Realtors:
- Professional branded booking site
- No development costs
- Instant setup
- Full control over properties
- Direct bookings (no middleman)

### For Guests:
- Book directly with realtor
- Trusted, professional experience
- Branded communication
- Support from realtor

---

## 🚀 GETTING STARTED

### As a Developer:

**Understand the Architecture:**
1. Read: `WHITE_LABEL_FEATURES.md` (detailed guide)
2. Read: `FRONTEND_AUDIT_REPORT.md` (what's missing)
3. Read: `FRONTEND_TODO_CHECKLIST.md` (what to build)

**Implement White-Label:**
1. Week 4: Build branding settings UI
2. Week 4: Update email templates
3. Week 6: Add custom domain support
4. Week 7: Implement feature toggles

**Test White-Label:**
```bash
# Create test realtor 1
POST /api/realtors/register {
  subdomain: "testrealtor1",
  agencyName: "Test Agency",
  primaryColor: "#FF0000"
}

# Create test realtor 2
POST /api/realtors/register {
  subdomain: "testrealtor2",
  agencyName: "Another Agency",
  primaryColor: "#0000FF"
}

# Visit both subdomains:
http://testrealtor1.localhost:3000  # Red theme
http://testrealtor2.localhost:3000  # Blue theme

# Verify:
- Different logos
- Different colors
- Different properties
- Complete isolation
```

---

## 🎨 KEY FILES FOR WHITE-LABEL

### Frontend:
```
middleware.ts                     - Subdomain detection
src/hooks/useBranding.tsx         - Branding hook
src/utils/subdomain.ts            - Subdomain utilities
src/app/(guest)/layout.tsx        - Guest site with branding
src/app/realtor/register/         - Registration with branding
```

### Backend:
```
src/controllers/realtorController.ts  - Realtor management
src/middleware/subdomain.ts           - Subdomain middleware
prisma/schema.prisma                  - Realtor model with branding
```

### Database Schema:
```prisma
model Realtor {
  id              String
  subdomain       String  @unique
  customDomain    String?
  agencyName      String
  tagline         String?
  logo            String?
  primaryColor    String
  secondaryColor  String
  accentColor     String
  // ... other fields
}
```

---

## 📈 WHITE-LABEL METRICS

### Success Indicators:
- ✅ Each realtor has unique branded site
- ✅ Guests never see platform branding
- ✅ Complete data isolation
- ✅ Custom colors/logos working
- ✅ Branded emails sent
- ✅ Analytics per realtor

### Current Status:
- 🟢 Subdomains: 100% working
- 🟢 Branding: 85% working (need UI)
- 🟡 Emails: 50% branded
- 🔴 Custom Domains: 0% (not started)
- 🔴 Feature Toggles: 0% (not started)

---

## 💡 WHITE-LABEL BEST PRACTICES

### Do:
✅ Hide platform branding from guests
✅ Use realtor's colors consistently
✅ Show realtor's logo everywhere
✅ Send emails from realtor's name
✅ Isolate all data per realtor
✅ Provide easy customization

### Don't:
❌ Show "Powered by Stayza" prominently
❌ Mix branding between realtors
❌ Share data across tenants
❌ Make customization complex
❌ Use platform branding on guest site
❌ Expose technical details to guests

---

## 🎯 NEXT STEPS

### Priority 1: Branding Dashboard (Week 4)
Create UI for realtors to customize:
- Logo upload
- Color selection
- Preview guest site
- Save/publish changes

### Priority 2: Email Branding (Week 4)
Update email templates to include:
- Realtor logo
- Realtor colors
- Realtor contact info

### Priority 3: Custom Domains (Week 6)
Allow realtors to use their own domains:
- Domain verification
- DNS setup
- SSL certificates

---

## 📚 FURTHER READING

- **Detailed Guide:** `WHITE_LABEL_FEATURES.md`
- **Missing Features:** `FRONTEND_AUDIT_REPORT.md`
- **Task Checklist:** `FRONTEND_TODO_CHECKLIST.md`
- **Starter Code:** `STARTER_CODE_TEMPLATES.md`

---

**Remember: Stayza's value is in being invisible. The realtor is the brand, we're just the platform.** 🎨

---

**Last Updated:** January 10, 2025
