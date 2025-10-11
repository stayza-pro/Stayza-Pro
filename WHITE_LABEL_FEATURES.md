# 🎨 STAYZA WHITE-LABEL PLATFORM GUIDE

**Last Updated:** January 10, 2025  
**Platform Type:** Multi-Tenant SaaS with Full White-Label Capabilities

---

## 🌟 WHAT IS WHITE-LABEL?

**Stayza is a white-label booking platform**, meaning:

### For Realtors (Platform Users):
- Get their **own branded booking website** instantly
- Customize **logo, colors, and business information**
- Their brand is **front and center** - guests never see "Stayza"
- Each realtor operates **independently** on their own subdomain
- Platform handles all the **technical infrastructure** behind the scenes

### For Guests (Realtor's Customers):
- See **only the realtor's brand** (e.g., "Loli Going Homes")
- Book through a **professional-looking branded site**
- Never know they're using a SaaS platform
- Experience is **completely customized** to the realtor

---

## ✅ WHITE-LABEL FEATURES CURRENTLY WORKING

### 1. **Custom Subdomains** ✅
```
loligoing.stayza.pro     → Loli Going Homes booking site
premiumstays.stayza.pro  → Premium Stays booking site
luxuryapts.stayza.pro    → Luxury Apartments booking site
```
- Each realtor gets instant subdomain on registration
- Automatic routing based on subdomain
- Full isolation between realtors

### 2. **Brand Customization** ✅
**Currently Customizable:**
- ✅ Business/Agency Name
- ✅ Logo Upload
- ✅ Primary Color
- ✅ Secondary Color
- ✅ Accent Color
- ✅ Tagline/Slogan
- ✅ Business Description

**Example:**
```typescript
// Realtor: "Loli Going Homes"
{
  agencyName: "Loli Going Homes",
  logo: "https://cdn.stayza.com/logos/loligoing.png",
  colors: {
    primary: "#3B82F6",    // Blue
    secondary: "#1E40AF",  // Dark Blue
    accent: "#F59E0B"      // Amber
  },
  tagline: "Your Home Away From Home",
  subdomain: "loligoing"
}
```

### 3. **Independent Guest-Facing Sites** ✅
Each realtor's subdomain shows:
- ✅ Their logo in header
- ✅ Their brand colors throughout
- ✅ Their properties only
- ✅ Their contact information
- ✅ Their social media links
- ✅ Booking confirmation emails with their branding

### 4. **Multi-Tenant Architecture** ✅
- ✅ Complete data isolation per realtor
- ✅ Separate authentication per subdomain
- ✅ Role-based access control (REALTOR vs GUEST)
- ✅ Cross-subdomain token restoration

---

## ⚠️ WHITE-LABEL FEATURES MISSING (Need Implementation)

### 1. **Brand Customization Dashboard** ❌
**Missing UI:**
- Branding settings page in realtor dashboard
- Color picker for brand colors
- Logo upload with preview
- Live preview of guest site with changes
- Font selection (optional)
- Template selection (optional)

**Location:** `src/app/(realtor)/dashboard/settings/branding/page.tsx`

**Priority:** 🟠 HIGH - Realtors need to customize their brand

**Note:** Subdomain selection already done during registration ✅

### 2. **White-Label Email Templates** ⚠️
**Current Status:** Emails sent but not fully branded

**Missing:**
- Realtor logo in email header
- Realtor colors in email design
- Realtor contact info in footer
- Customizable email content

**Location:** Backend email templates need realtor branding variables

**Priority:** 🟠 HIGH - Guest-facing, affects brand perception

### 3. **Guest Site Preview in Dashboard** ❌
**Missing:**
- Live preview component showing guest view
- Desktop/mobile/tablet responsive preview
- Preview updates as realtor changes branding
- "View My Site" button to open guest site in new tab

**Location:** `src/components/dashboard/BrandPreview.tsx`

**Priority:** 🟠 HIGH - Realtors need to see how guests see their site

### 4. **Guest Site Feature Toggles** ❌
**Feature:** Let realtors enable/disable features on guest site

**Examples:**
- [ ] Enable/Disable Reviews
- [ ] Enable/Disable Wishlists
- [ ] Enable/Disable Guest Accounts
- [ ] Enable/Disable Search Filters
- [ ] Show/Hide Property Map
- [ ] Enable/Disable Social Sharing

**Location:** Settings → Guest Site Features

**Priority:** 🟡 MEDIUM - Nice to have, not critical

---

## 🎯 WHITE-LABEL IMPLEMENTATION ROADMAP

### PHASE 1: Core Branding UI (Week 4)
**Priority:** 🟠 HIGH

```
□ Create branding settings page
  └─ src/app/(realtor)/dashboard/settings/branding/page.tsx

□ Implement color picker component
  └─ Primary, secondary, accent colors
  └─ Live preview of colors

□ Add logo upload with preview
  └─ Drag & drop or file select
  └─ Image cropping/resizing
  └─ Preview on guest site mockup

□ Create brand preview component
  └─ Show desktop/mobile views
  └─ Live updates as realtor changes settings
  └─ "View Live Site" button

□ Add subdomain display (read-only)
  └─ Show: "Your site: loligoing.stayza.pro"
  └─ Copy to clipboard button
  └─ QR code for easy sharing (optional)
```

**Time Estimate:** 3-4 days

---

### PHASE 2: Email Branding (Week 4)
**Priority:** 🟠 HIGH

```
□ Update email templates
  └─ booking-backend/src/services/email.ts

□ Add realtor branding to emails
  └─ Logo in header
  └─ Colors in design
  └─ Contact info in footer

□ Customize email content
  └─ Booking confirmations
  └─ Payment receipts
  └─ Cancellation notifications
  └─ Review requests
```

**Time Estimate:** 2-3 days

---

### PHASE 3: Feature Toggles (Week 7+)
**Priority:** 🟡 MEDIUM

```
□ Backend: Feature flag system
  └─ Add feature_flags to Realtor model
  └─ API to get/update flags

□ Frontend: Feature toggle UI
  └─ Settings page with toggles
  └─ Enable/disable guest site features

□ Guest Site: Conditional rendering
  └─ Check feature flags before rendering
  └─ Hide disabled features
```

**Time Estimate:** 3-4 days

---

### PHASE 4: Advanced Features (Future)
**Priority:** � LOW - Not in current roadmap

```
□ White-label mobile apps (iOS/Android)
□ Multi-language support
□ Advanced theme customization
□ Email template editor
□ Custom subdomain migration (if needed)
```

**Note:** Custom domains NOT planned - subdomain model is sufficient ✅

---

## 🛠️ TECHNICAL IMPLEMENTATION DETAILS

### 2. How Subdomain Selection Works

**Registration Flow:**
```typescript
// When realtor registers:
1. Choose subdomain (e.g., "loligoing") ✅ Already implemented
2. System validates availability
3. Upload logo
4. Set brand colors
5. Set agency name & tagline

// Stored in database:
Realtor {
  subdomain: "loligoing",              // Becomes loligoing.stayza.pro
  agencyName: "Loli Going Homes",
  tagline: "Your Home Away From Home",
  logo: "url-to-logo",
  primaryColor: "#3B82F6",
  secondaryColor: "#1E40AF",
  accentColor: "#F59E0B"
}

// Guest visits: https://loligoing.stayza.pro
// System routes to realtor's branded site
```

**Guest Site Rendering:**
```typescript
// middleware.ts extracts subdomain
const subdomain = getSubdomain(request);

// Fetch realtor branding
const branding = await getBrandingBySubdomain(subdomain);

// Apply to site
<Header logo={branding.logo} colors={branding.colors} />
<Properties realtorId={branding.realtorId} />
<Footer businessName={branding.agencyName} />
```

**Note:** Custom domains NOT needed - subdomain model works perfectly ✅

---

## 💡 WHITE-LABEL BEST PRACTICES

### 1. **Consistent Branding**
- Logo should appear on all guest-facing pages
- Colors should be consistent throughout guest site
- Email templates must match site branding
- Social media links should be realtor's, not Stayza's

### 2. **Platform Invisibility**
- Never show "Powered by Stayza" to guests (optional footer credit)
- All emails from realtor's business name
- Payment receipts show realtor's info
- Support contacts go to realtor, not Stayza

### 3. **Data Isolation**
- Each realtor sees only their data
- Guests see only that realtor's properties
- Analytics are per-realtor, not platform-wide
- Reviews are isolated to realtor's properties

### 4. **Customization Limits**
- Provide sensible defaults
- Allow customization but maintain consistency
- Prevent breaking changes (e.g., invisible text on invisible background)
- Offer pre-designed themes/templates

---

## 📊 WHITE-LABEL SUCCESS METRICS

### Week 4 Success (Branding Complete):
- [ ] Realtors can customize all brand elements
- [ ] Live preview shows changes instantly
- [ ] Guest site reflects branding correctly
- [ ] Emails include realtor branding

### Week 6 Success (Custom Domains):
- [ ] Realtors can add custom domains
- [ ] DNS verification working
- [ ] SSL certificates auto-provision
- [ ] Custom domains route correctly

### Full White-Label Success:
- [ ] 100% brand invisibility to guests
- [ ] All touchpoints (site, email, receipts) branded
- [ ] Realtors can fully customize experience
- [ ] Feature toggles allow flexibility
- [ ] Mobile apps with custom branding (future)

---

## 🎨 COMPONENT STRUCTURE FOR WHITE-LABEL

### Branding Settings Page
```
src/app/(realtor)/dashboard/settings/branding/
├── page.tsx                      (Main branding settings page)
└── components/
    ├── ColorPicker.tsx           (Color selection UI)
    ├── LogoUploader.tsx          (Logo upload & preview)
    ├── BrandPreview.tsx          (Live preview component)
    ├── FontSelector.tsx          (Font selection - optional)
    └── ThemeSelector.tsx         (Pre-made themes - optional)
```

### Guest Site Components (Already Exist)
```
src/app/
├── (guest)/                      (Guest-facing routes)
│   ├── layout.tsx                (Applies realtor branding)
│   ├── page.tsx                  (Home page with branding)
│   └── properties/               (Property listings)
└── middleware.ts                 (Subdomain detection)
```

---

## 🚀 QUICK START: Add Branding Page

**1. Create the branding settings page:**
```bash
mkdir -p src/app/\(realtor\)/dashboard/settings/branding
touch src/app/\(realtor\)/dashboard/settings/branding/page.tsx
```

**2. Basic branding UI:**
```typescript
"use client";

import { useState } from "react";
import { realtorService } from "@/services/realtors";
import { toast } from "react-hot-toast";

export default function BrandingSettingsPage() {
  const [branding, setBranding] = useState({
    agencyName: "My Agency",
    tagline: "Your tagline here",
    primaryColor: "#3B82F6",
    secondaryColor: "#1E40AF",
    accentColor: "#F59E0B",
    logo: null
  });

  const handleSave = async () => {
    try {
      await realtorService.updateBranding(branding);
      toast.success("Branding updated successfully!");
    } catch (error) {
      toast.error("Failed to update branding");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Branding Settings</h1>
        <p className="text-gray-600">Customize how guests see your booking site</p>
      </div>

      {/* Logo Upload */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Logo</h2>
        {/* Logo upload component */}
      </div>

      {/* Colors */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Brand Colors</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Primary Color</label>
            <input
              type="color"
              value={branding.primaryColor}
              onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
              className="w-full h-12 rounded cursor-pointer"
            />
          </div>
          {/* Secondary & Accent colors */}
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Preview</h2>
        {/* Preview component showing guest site with branding */}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
```

**3. Test the branding:**
```bash
# Start dev server
npm run dev

# Visit: http://loligoing.localhost:3000/dashboard/settings/branding
# Change colors, upload logo
# View guest site to see changes
```

---

## 📚 REFERENCES

- **Registration Preview:** `src/app/realtor/register/PreviewComponent.tsx`
- **Branding Hook:** `src/hooks/useBranding.tsx`
- **Subdomain Utilities:** `src/utils/subdomain.ts`
- **Middleware:** `middleware.ts` (subdomain detection)

---

**Need help implementing white-label features? Start with the branding settings page above!** 🎨
