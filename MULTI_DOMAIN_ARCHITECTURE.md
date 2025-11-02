# Stayza Multi-Domain Architecture

This document outlines the multi-tenant domain architecture implemented for the Stayza platform, enabling smooth transitions between the main domain and user-specific subdomains.

## Overview

The platform operates on a multi-domain structure:
- **Main Domain**: `stayza.pro` (prod) / `localhost:3000` (dev) - Admin functions and realtor registration
- **Admin Subdomain**: `admin.stayza.pro` (optional) - Admin dashboard and management
- **Realtor Subdomains**: `{slug}.stayza.pro` - Individual realtor websites and dashboards
- **Guest Access**: Guests interact with realtors on their respective subdomains

## Domain Structure

### Development Environment
```
localhost:3000                    → Main domain
admin.localhost:3000              → Admin subdomain (optional)
indigo.localhost:3000             → Realtor subdomain (example)
sunset-homes.localhost:3000       → Another realtor subdomain
```

### Production Environment
```
stayza.pro                        → Main domain
admin.stayza.pro                  → Admin subdomain (optional)
indigo.stayza.pro                 → Realtor subdomain (example)
sunset-homes.stayza.pro           → Another realtor subdomain
```

## User Journey Flows

### Realtor Registration Flow
1. **Registration**: `stayza.pro/register` → Fill out registration form
2. **Success Redirect**: Redirect to `stayza.pro/realtor/check-email`
3. **Email Verification**: Click link in email → Verify on `stayza.pro/verify-email`
4. **Post-Verification**: Auto-redirect to `{slug}.stayza.pro/realtor/dashboard`

### Admin Access Flow
1. **Login**: `stayza.pro/admin/login` or `admin.stayza.pro/login`
2. **Dashboard**: `stayza.pro/admin/dashboard` or `admin.stayza.pro/dashboard`
3. **Management**: All admin functions stay on main domain or admin subdomain

### Guest Booking Flow
1. **Discovery**: Find realtor via `{slug}.stayza.pro`
2. **Browse**: Browse properties on realtor's subdomain
3. **Registration**: Register as guest on current realtor subdomain
4. **Booking**: Complete booking process on realtor's subdomain

## Technical Implementation

### Backend Domain Utilities (`booking-backend/src/utils/domains.ts`)

Key functions for URL generation:
- `getDomainConfig()` - Environment-aware configuration
- `buildMainDomainUrl(path)` - Generate main domain URLs
- `buildSubdomainUrl(subdomain, path)` - Generate subdomain URLs
- `getEmailVerificationUrl()` - Context-aware verification links
- `getDashboardUrl()` - User-role-based dashboard URLs

### Frontend Domain Utilities (`booking-frontend/src/utils/domains.ts`)

Mirror functions for frontend navigation:
- Environment detection and URL building
- Cross-domain vs same-domain navigation detection
- User context-aware redirects

### Navigation Hook (`booking-frontend/src/hooks/useMultiDomainNavigation.ts`)

Provides navigation functions:
- `goToDashboard()` - Navigate to appropriate dashboard
- `goToLogin()` - Navigate to appropriate login
- `handleLogout()` - Logout with proper redirect
- `handleRealtorRegistrationSuccess()` - Post-registration navigation

### Middleware (`booking-frontend/middleware.ts`)

Handles request routing:
- Subdomain detection and parsing
- Tenant type identification (main/admin/realtor)
- Request header enrichment for components
- Route-specific logic

## Environment Configuration

### Backend `.env`
```bash
# Domain Configuration
MAIN_DOMAIN=stayza.pro
DEV_DOMAIN=localhost:3000
NODE_ENV=development
```

### Frontend `.env`
```bash
# Domain Configuration
NEXT_PUBLIC_MAIN_DOMAIN=stayza.pro
NEXT_PUBLIC_DEV_DOMAIN=localhost:3000
```

## API Integration

### Registration Response
Backend now returns redirect URLs for consistent navigation:
```json
{
  "success": true,
  "data": { ... },
  "redirectUrls": {
    "success": "http://localhost:3000/realtor/check-email",
    "verification": "http://indigo.localhost:3000/verify-email?token=...",
    "dashboard": "http://indigo.localhost:3000/realtor/dashboard"
  }
}
```

### Email Verification
Backend generates domain-aware verification URLs based on user type:
- **Realtors**: Verification on their subdomain after initial setup
- **Admins**: Verification on main domain
- **Guests**: Verification on current context

## Cross-Domain Navigation

### Same-Domain Navigation
Uses Next.js router for optimal performance:
```typescript
router.push('/dashboard');
```

### Cross-Domain Navigation
Uses `window.location` for domain changes:
```typescript
window.location.href = 'https://indigo.stayza.pro/realtor/dashboard';
```

### Detection Logic
```typescript
const currentHost = window.location.host;
const redirectHost = new URL(redirectUrl, window.location.origin).host;

if (currentHost !== redirectHost) {
  // Cross-domain redirect
  window.location.href = redirectUrl;
} else {
  // Same-domain redirect
  router.push(redirectUrl);
}
```

## Security Considerations

### CORS Configuration
Backend configured to accept requests from:
- Main domain: `stayza.pro` / `localhost:3000`
- All realtor subdomains: `*.stayza.pro` / `*.localhost:3000`

### Cookie Management
- JWT tokens stored in HTTP-only cookies
- Cookies configured for subdomain sharing where appropriate
- Secure flags enabled in production

### Subdomain Validation
- Backend validates realtor subdomain existence
- Frontend checks subdomain availability during registration
- Middleware enforces proper routing rules

## Deployment Considerations

### DNS Configuration
Production requires wildcard DNS:
```
stayza.pro                A     → Server IP
*.stayza.pro             CNAME → stayza.pro
```

### SSL Certificates
Wildcard SSL certificate required:
```
*.stayza.pro
```

### Load Balancer Configuration
Configure load balancer to:
- Route all `*.stayza.pro` traffic to the same application
- Pass `Host` header to application for subdomain detection
- Handle SSL termination for wildcard certificate

## Testing

### Local Development
1. Add entries to `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
```
127.0.0.1 localhost
127.0.0.1 indigo.localhost
127.0.0.1 sunset-homes.localhost
127.0.0.1 admin.localhost
```

2. Access application via:
- `http://localhost:3000` (main)
- `http://indigo.localhost:3000` (realtor)
- `http://admin.localhost:3000` (admin)

### Test Script
Run domain utilities test:
```bash
node booking-frontend/test-domains.js
```

## Troubleshooting

### Common Issues

1. **Subdomain not detected**: Check middleware logs and host header
2. **Cross-domain redirect fails**: Verify CORS configuration
3. **Authentication lost**: Check cookie domain settings
4. **Email links broken**: Verify backend domain configuration

### Debug Logging
Enable debug logging by checking browser console for:
- `[Domain Config]` - Configuration detection
- `[Navigation]` - Navigation decisions
- `[Backend Domain Config]` - Server-side URL generation

### Health Checks
- Test main domain: `GET /api/health`
- Test subdomain routing via middleware
- Verify email verification flow end-to-end

## Future Enhancements

1. **Custom Domains**: Allow realtors to use their own domains
2. **Regional Subdomains**: Support geo-specific subdomains
3. **Advanced Analytics**: Track cross-domain user journeys
4. **Performance**: Implement subdomain-specific caching strategies

---

For technical support or questions about the multi-domain architecture, consult the development team or check the implementation files referenced in this document.