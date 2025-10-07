# 🏢 Stayza: Multi-Tenant Realtor Booking SaaS Platform

![Stayza Logo](./booking-frontend/public/images/stayza.png)

> **Empowering Real Estate Professionals with Their Own Branded Booking Platforms**

Stayza is a comprehensive **Multi-Tenant Realtor Booking Software-as-a-Service (SaaS)** platform that enables real estate professionals to create their own customizable property booking websites. Think "Airbnb for Realtors" - where each realtor gets their own branded booking platform with full property and reservation management capabilities.

---

## 🎯 **Project Vision**

Create a scalable SaaS platform that democratizes property booking technology for real estate professionals, providing them with enterprise-grade booking capabilities without the technical complexity or high costs.

## 🌟 **Key Features**

### 🏠 **For Realtors**
- ✅ **Custom Branded Websites** - Personalized booking sites with custom domains
- ✅ **Property Portfolio Management** - Complete property listing and management system
- ✅ **Booking & Revenue Management** - Real-time booking tracking and financial analytics
- ✅ **Guest Communication** - Integrated messaging and notification system
- ✅ **Business Verification** - CAC (Corporate Affairs Commission) integration for Nigeria
- ✅ **Multi-language Support** - English, French, and Portuguese

### 🎫 **For Guests**
- ✅ **Advanced Property Search** - Filter by location, price, amenities, and availability
- ✅ **Secure Booking System** - Complete reservation management with payment processing
- ✅ **Review & Rating System** - Comprehensive feedback system with photo uploads
- ✅ **Payment Integration** - Paystack integration for Nigerian market
- ✅ **Booking History** - Complete transaction and stay history

### 🛡️ **For Administrators**
- ✅ **Platform Management** - User approval, verification, and system oversight
- ✅ **Financial Analytics** - Platform-wide revenue and performance metrics
- ✅ **CAC Verification** - Automated business verification workflow
- ✅ **System Configuration** - Platform settings and feature management

---

## 🏗️ **System Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                         STAYZA ECOSYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐    ┌──────────────────────────────────┐│
│  │   Frontend Layer    │    │        Backend Layer            ││
│  │   (Next.js 14)      │◄──►│     (Node.js/Express)           ││
│  │                     │    │                                  ││
│  │ ├── Multi-language  │    │ ├── REST API (OpenAPI)          ││
│  │ ├── Realtor Dash    │    │ ├── JWT Authentication          ││
│  │ ├── Guest Booking   │    │ ├── Paystack Integration        ││
│  │ ├── Admin Panel     │    │ ├── Email System (SMTP)         ││
│  │ ├── Analytics UI    │    │ ├── File Upload (Multer)        ││
│  │ └── Review System   │    │ └── Notification Service        ││
│  └─────────────────────┘    └──────────────────────────────────┘│
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    Database Layer                               │
│              PostgreSQL + Prisma ORM                           │
│                                                                 │
│  ├── User Management      ├── Property Catalog                 │
│  ├── Booking Engine       ├── Payment Processing               │
│  ├── Review System        ├── Notification Queue               │
│  └── Analytics Store      └── Audit Logging                    │
├─────────────────────────────────────────────────────────────────┤
│                   External Services                             │
│                                                                 │
│  ├── Paystack (Payments)     ├── SMTP (Email Delivery)         │
│  ├── CAC API (Verification)  ├── Cloud Storage (Files)         │
│  └── Maps API (Location)     └── CDN (Asset Delivery)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎭 **User Roles & Permissions**

### **GUEST** (End Customers)
- **Registration**: Simple email/password signup with email verification
- **Capabilities**:
  - Browse and search properties with advanced filters
  - Create and manage bookings with real-time availability
  - Process payments securely through Paystack integration
  - Leave detailed reviews with photo uploads
  - Access booking history and transaction records
  - Receive email and in-app notifications

### **REALTOR** (Property Managers)
- **Registration**: Enhanced signup with business information and CAC verification
- **Capabilities**:
  - Complete property portfolio management with unlimited listings
  - Advanced booking management with approval/rejection workflows
  - Real-time revenue analytics and performance metrics
  - Guest communication and review response system
  - Custom branding with logos, colors, and custom domains
  - Multi-property calendar management and availability control
  - Financial reporting and payout management

### **ADMIN** (Platform Operators)
- **Access**: System-wide administrative privileges
- **Capabilities**:
  - User management with approval/suspension powers
  - Platform-wide analytics and financial oversight
  - CAC verification processing and business validation
  - System configuration and feature flag management
  - Audit logging and security monitoring
  - Revenue reporting and commission tracking

---

## 💻 **Technology Stack**

### **Frontend (booking-frontend/)**
```yaml
Framework: Next.js 14 with App Router
Language: TypeScript (Strict Mode)
Styling: Tailwind CSS + Custom Component Library
State Management: Zustand + React Query
Authentication: JWT with Secure Storage
Internationalization: next-intl (EN, FR, PT)
Testing: Jest + React Testing Library
Build System: Webpack 5 + SWC
```

### **Backend (booking-backend/)**
```yaml
Runtime: Node.js 18+ with Express.js
Language: TypeScript
Database: PostgreSQL 15+ with Prisma ORM
Authentication: JWT with bcrypt password hashing
File Processing: Multer with cloud storage integration
Payment Processing: Paystack API
Email System: Nodemailer with SMTP
API Documentation: Swagger/OpenAPI 3.0
Testing: Jest + Supertest
```

### **Database Schema**
```yaml
ORM: Prisma with PostgreSQL
Migration System: Prisma Migrate
Key Models:
  - Users (Guest/Realtor/Admin roles)
  - Realtors (Business profiles with CAC integration)
  - Properties (Full property management)
  - Bookings (Reservation system)
  - Payments (Transaction processing)
  - Reviews (Rating and feedback system)
  - Notifications (Communication system)
```

---

## 📁 **Project Structure**

```
Stayza/
├── booking-frontend/                 # Next.js Frontend Application
│   ├── src/
│   │   ├── app/                     # App Router pages and layouts
│   │   │   ├── [locale]/            # Internationalized routes
│   │   │   ├── dashboard/           # User dashboards
│   │   │   ├── properties/          # Property browsing and details
│   │   │   ├── booking/             # Booking flow and payment
│   │   │   └── auth/                # Authentication pages
│   │   ├── components/              # Reusable UI components
│   │   │   ├── ui/                  # Base UI components
│   │   │   ├── auth/                # Authentication components
│   │   │   ├── property/            # Property-related components
│   │   │   ├── booking/             # Booking flow components
│   │   │   ├── dashboard/           # Dashboard interfaces
│   │   │   ├── payment/             # Payment processing UI
│   │   │   ├── review/              # Review and rating system
│   │   │   └── layout/              # Layout and navigation
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.ts           # Authentication hook
│   │   │   ├── useProperties.ts     # Property data management
│   │   │   └── notifications/       # Notification hooks
│   │   ├── services/                # API integration layer
│   │   │   ├── api.ts               # Base API client
│   │   │   ├── auth.ts              # Authentication API
│   │   │   ├── properties.ts        # Property management API
│   │   │   ├── bookings.ts          # Booking management API
│   │   │   ├── payments.ts          # Payment processing API
│   │   │   └── notifications.ts     # Notification API
│   │   ├── store/                   # Global state management
│   │   │   └── authStore.ts         # Authentication state
│   │   ├── types/                   # TypeScript type definitions
│   │   │   └── index.ts             # Shared type definitions
│   │   └── utils/                   # Utility functions
│   ├── locales/                     # Internationalization files
│   │   ├── en.json                  # English translations
│   │   ├── fr.json                  # French translations
│   │   └── pt.json                  # Portuguese translations
│   ├── public/                      # Static assets
│   └── package.json                 # Frontend dependencies
│
├── booking-backend/                  # Express.js Backend Application
│   ├── src/
│   │   ├── controllers/             # Request handlers
│   │   │   ├── authController.ts    # Authentication endpoints
│   │   │   ├── propertyController.ts # Property management
│   │   │   ├── bookingController.ts  # Booking system
│   │   │   ├── paymentController.ts  # Payment processing
│   │   │   ├── reviewController.ts   # Review system
│   │   │   ├── realtorController.ts  # Realtor management
│   │   │   ├── adminController.ts    # Admin functions
│   │   │   └── notificationController.ts # Notifications
│   │   ├── routes/                  # API route definitions
│   │   │   ├── authRoutes.ts        # Authentication routes
│   │   │   ├── propertyRoutes.ts    # Property routes
│   │   │   ├── bookingRoutes.ts     # Booking routes
│   │   │   ├── paymentRoutes.ts     # Payment routes
│   │   │   ├── reviewRoutes.ts      # Review routes
│   │   │   ├── realtorRoutes.ts     # Realtor routes
│   │   │   ├── adminRoutes.ts       # Admin routes
│   │   │   ├── webhookRoutes.ts     # Webhook handlers
│   │   │   └── notificationRoutes.ts # Notification routes
│   │   ├── services/                # Business logic layer
│   │   │   ├── email.ts             # Email service
│   │   │   ├── paystack.ts          # Payment integration
│   │   │   ├── notificationService.ts # Notification system
│   │   │   ├── photoUpload.ts       # File upload handling
│   │   │   ├── auditLogger.ts       # Activity logging
│   │   │   └── refundPolicy.ts      # Refund processing
│   │   ├── middleware/              # Express middleware
│   │   │   ├── auth.ts              # Authentication middleware
│   │   │   ├── errorHandler.ts      # Global error handling
│   │   │   └── rateLimiter.ts       # API rate limiting
│   │   ├── config/                  # Configuration files
│   │   │   ├── database.ts          # Database configuration
│   │   │   ├── swagger.ts           # API documentation
│   │   │   └── index.ts             # App configuration
│   │   ├── types/                   # TypeScript definitions
│   │   │   └── index.ts             # Shared backend types
│   │   ├── utils/                   # Utility functions
│   │   │   ├── auth.ts              # Authentication utilities
│   │   │   ├── validation.ts        # Input validation
│   │   │   └── upload.ts            # File upload utilities
│   │   └── jobs/                    # Background job processing
│   │       └── runBookingCompletion.ts # Booking completion jobs
│   ├── prisma/                      # Database schema and migrations
│   │   ├── schema.prisma            # Database schema definition
│   │   ├── seed.ts                  # Database seeding
│   │   └── migrations/              # Database migration files
│   └── package.json                 # Backend dependencies
│
└── README.md                        # This comprehensive documentation
```

---

## 🔄 **Core Business Workflows**

### **1. User Registration & Onboarding**

#### **Guest Registration Flow**
```
1. User visits registration page (/guest/register)
2. Fills basic information (email, password, name)
3. System sends email verification
4. User clicks verification link
5. Account activated → Redirect to dashboard
6. User can immediately browse and book properties
```

#### **Realtor Registration Flow**
```
1. User visits realtor registration (/realtor/register)
2. Fills comprehensive business information
3. Uploads CAC documents (Corporate Affairs Commission)
4. System creates pending realtor account
5. Admin reviews CAC documentation
6. Upon approval:
   - Realtor account activated
   - Welcome email sent with onboarding guide
   - Access to property management dashboard
7. Realtor completes branding setup (optional)
8. Can start adding properties immediately
```

### **2. Property Management Workflow**

#### **Property Creation Process**
```
1. Realtor accesses dashboard → "Add Property"
2. Fills property details form:
   - Basic info (title, description, type)
   - Location (address, city, coordinates)
   - Specifications (bedrooms, bathrooms, max guests)
   - Pricing (nightly rate, fees, currency)
   - Amenities selection
   - House rules and policies
   - Check-in/out times
3. Uploads property images (up to 8 photos)
4. Sets initial availability calendar
5. Property status: DRAFT → Realtor can preview
6. Submits for review → Status: PENDING
7. Admin reviews property listing
8. Approval → Status: APPROVED → Live on platform
9. Rejection → Status: REJECTED → Realtor can edit and resubmit
```

#### **Property Management Features**
```
- Real-time availability calendar
- Pricing management (seasonal rates, discounts)
- Image gallery management
- Booking approval/rejection
- Guest communication
- Performance analytics
- Review management and responses
```

### **3. Booking & Reservation System**

#### **Guest Booking Flow**
```
1. Guest searches properties by:
   - Location (city, address)
   - Dates (check-in/out)
   - Guest count
   - Price range
   - Amenities filter
   - Property type
2. Browses search results with:
   - Property images and details
   - Pricing breakdown
   - Availability calendar
   - Reviews and ratings
3. Selects property → Views detailed page
4. Chooses dates → System checks availability
5. Fills booking form:
   - Guest details confirmation
   - Special requests
   - Contact information
6. Reviews booking summary:
   - Dates and duration
   - Guest count
   - Pricing breakdown (subtotal, fees, taxes, total)
7. Proceeds to payment
8. Payment processing via Paystack:
   - Card payments
   - Bank transfer
   - Digital wallet
9. Payment confirmation:
   - Booking created with PENDING status
   - Email confirmation to guest
   - Notification to realtor
10. Realtor reviews and approves/rejects booking
11. Upon approval:
    - Status: CONFIRMED
    - Final confirmation emails sent
    - Calendar updated
    - Payment processed to realtor (minus platform fee)
```

#### **Booking Management Features**
```
For Guests:
- Booking history and status tracking
- Cancellation requests (with refund policy)
- Direct messaging with realtor
- Check-in/out confirmation
- Post-stay review submission

For Realtors:
- Booking approval/rejection workflow
- Guest screening and communication
- Calendar and availability management
- Revenue tracking and analytics
- Refund processing (with admin approval)
```

### **4. Payment & Financial System**

#### **Payment Processing Flow**
```
1. Booking total calculated:
   - Nightly rate × number of nights
   - Cleaning fee (if applicable)
   - Service fee (platform commission)
   - Taxes (based on location)
2. Paystack payment initialization:
   - Secure payment reference generated
   - Guest redirected to Paystack checkout
3. Payment methods available:
   - Debit/Credit cards (Visa, Mastercard, Verve)
   - Bank transfer (Nigerian banks)
   - Digital wallets (Paystack supported)
4. Payment completion:
   - Webhook notification received
   - Payment status updated in database
   - Email confirmations sent
5. Fund distribution:
   - Platform retains service fee (10%)
   - Realtor receives payout (90%)
   - Automatic payout processing (weekly/monthly)
```

#### **Refund Processing**
```
1. Guest initiates cancellation request
2. System checks cancellation policy:
   - Free cancellation period (48+ hours before)
   - Partial refund (24-48 hours before)
   - No refund (less than 24 hours)
3. Refund calculation based on policy
4. Admin approval for refunds over threshold
5. Automatic refund processing via Paystack
6. Email notifications to all parties
7. Booking status updated to REFUNDED
```

### **5. Review & Rating System**

#### **Review Submission Process**
```
1. Guest completes stay (status: CHECKED_OUT)
2. System sends review invitation email (24 hours post-checkout)
3. Guest accesses review form:
   - Overall rating (1-5 stars)
   - Category ratings:
     * Cleanliness
     * Communication
     * Check-in process
     * Accuracy of listing
     * Location quality
     * Value for money
   - Written review (optional)
   - Photo uploads (up to 5 images)
4. Review submitted → Status: PUBLISHED
5. Notification sent to realtor
6. Realtor can respond to review (optional)
7. Review appears on property page
8. Property rating automatically updated
```

#### **Review Management Features**
```
- Review moderation (admin oversight)
- Response system for realtors
- Photo upload capability
- Helpful votes from other users
- Review analytics and insights
- Dispute resolution system
```

---

## 🔐 **Security & Authentication**

### **Authentication System**
```yaml
Method: JWT (JSON Web Tokens)
Password Security: bcrypt with salt rounds (12)
Session Management: Secure token storage with refresh mechanism
Multi-factor Authentication: Email verification required
Role-based Access Control: GUEST, REALTOR, ADMIN permissions
API Security: Rate limiting, CORS configuration, input validation
```

### **Data Protection Measures**
```yaml
Input Validation: Joi schema validation on all endpoints
SQL Injection Prevention: Prisma ORM parameterized queries
XSS Protection: Content Security Policy headers
CSRF Protection: Token-based request validation
File Upload Security: Type validation, size limits, virus scanning
Environment Security: Sensitive data in environment variables
Audit Logging: Complete activity tracking for compliance
```

### **API Security Features**
```yaml
Rate Limiting: 
  - Authentication endpoints: 5 requests/minute
  - Search endpoints: 100 requests/minute
  - Booking endpoints: 10 requests/minute
  - General API: 1000 requests/hour

CORS Configuration:
  - Allowed origins: Frontend domains only
  - Credentials: Secure cookie handling
  - Headers: Restricted to required headers

Request Validation:
  - Schema validation for all inputs
  - File type and size restrictions
  - Sanitization of user content
```

---

## 💳 **Payment Integration (Paystack)**

### **Supported Payment Methods**
```yaml
Credit/Debit Cards:
  - Visa, Mastercard, Verve
  - 3D Secure authentication
  - Secure card tokenization

Bank Transfer:
  - All major Nigerian banks
  - Real-time bank account verification
  - Instant payment confirmation

Digital Wallets:
  - Paystack supported wallets
  - Quick payment processing
  - Mobile-optimized checkout
```

### **Financial Workflows**

#### **Revenue Distribution**
```
Guest Payment (100%) →
├── Platform Service Fee (10%)
├── Payment Processing Fee (~1.5%)
└── Realtor Payout (~88.5%)
```

#### **Refund Policy Matrix**
```
Cancellation Timing | Refund Percentage
48+ hours before    | 100% refund
24-48 hours before  | 50% refund
<24 hours before    | No refund
Host cancellation   | 100% refund + penalty
```

#### **Payout Schedule**
```yaml
Frequency: Weekly (Fridays)
Minimum Payout: ₦5,000 NGN
Processing Time: 1-3 business days
Method: Direct bank transfer
Reporting: Detailed payout statements
Tax Handling: Invoice generation for realtors
```

---

## 📧 **Communication & Notification System**

### **Email System**
```yaml
Transactional Emails:
  - Welcome and onboarding sequences
  - Booking confirmations and updates
  - Payment receipts and invoices
  - Review invitations and responses
  - Security and account notifications

Email Templates:
  - Responsive HTML design
  - Multi-language support (EN, FR, PT)
  - Branded templates per realtor
  - Dynamic content personalization

Delivery Infrastructure:
  - SMTP with high deliverability
  - Bounce and complaint handling
  - Unsubscribe management
  - Email analytics and tracking
```

### **In-App Notification System**
```yaml
Notification Categories:
  - Bookings (new, updates, cancellations)
  - Payments (received, refunds, payouts)
  - Reviews (new reviews, responses)
  - System (maintenance, feature updates)
  - Security (login alerts, password changes)

Delivery Channels:
  - Real-time in-app notifications
  - Email notifications (configurable)
  - Push notifications (mobile ready)
  - SMS notifications (critical only)

User Preferences:
  - Granular notification settings
  - Channel preferences per category
  - Quiet hours configuration
  - Frequency controls (instant, daily digest, weekly summary)
```

---

## 📊 **Analytics & Business Intelligence**

### **Realtor Dashboard Analytics**
```yaml
Property Performance:
  - Occupancy rates by property
  - Average daily rates (ADR)
  - Revenue per available room (RevPAR)
  - Booking lead times
  - Seasonal demand patterns

Financial Metrics:
  - Total revenue and projections
  - Monthly recurring revenue (MRR)
  - Commission and fee breakdown
  - Payout history and scheduling
  - Tax reporting and invoice generation

Guest Analytics:
  - Booking demographics
  - Guest rating distributions
  - Repeat guest percentage
  - Average length of stay
  - Cancellation rates and reasons

Marketing Insights:
  - Property view-to-booking conversion
  - Search ranking performance
  - Review impact on bookings
  - Photo performance analytics
  - Pricing optimization suggestions
```

### **Admin Platform Analytics**
```yaml
Business Metrics:
  - Total platform revenue
  - User acquisition and retention
  - Geographic performance analysis
  - Payment method preferences
  - Commission and fee collection

User Management:
  - Registration and verification rates
  - User engagement metrics
  - Support ticket analysis
  - Churn rate and reasons
  - Realtor success metrics

System Performance:
  - API response times
  - Error rates and debugging
  - Database performance metrics
  - File upload and processing stats
  - Email delivery rates

Financial Reporting:
  - Platform revenue breakdown
  - Refund and chargeback rates
  - Payout processing metrics
  - Tax collection and reporting
  - Fraud detection and prevention
```

---

## 🌍 **Multi-Tenancy & White-Label Features**

### **Tenant Isolation Architecture**
```yaml
Data Segregation:
  - Row-level security (RLS) in PostgreSQL
  - Realtor-specific data access controls
  - Isolated file storage per tenant
  - Separate analytics and reporting

Custom Branding:
  - Individual realtor themes and colors
  - Custom logo and brand asset uploads
  - Personalized welcome messages
  - Branded email templates

Domain Management:
  - Subdomain allocation (realtor.stayza.com)
  - Custom domain mapping support
  - SSL certificate management
  - DNS configuration assistance
```

### **White-Label Customization**
```yaml
Visual Branding:
  - Primary color scheme selection
  - Logo upload and positioning
  - Font family customization
  - Layout theme options

Content Personalization:
  - Custom welcome messages
  - Branded property descriptions
  - Personalized booking confirmations
  - Custom email signatures

Feature Configuration:
  - Payment method preferences
  - Booking approval workflows
  - Cancellation policy settings
  - Review and rating controls
```

---

## 🚀 **Deployment & Infrastructure**

### **Development Environment**
```yaml
Local Development:
  - Docker containerization (optional)
  - Hot reloading for both frontend and backend
  - Local PostgreSQL database
  - Environment-specific configuration

Development Tools:
  - ESLint and Prettier for code formatting
  - TypeScript strict mode enforcement
  - Prisma Studio for database management
  - Swagger UI for API documentation
  - Jest for automated testing
```

### **Production Deployment**
```yaml
Frontend Deployment:
  - Vercel or Netlify for Next.js
  - CDN integration for global performance
  - Environment-based configuration
  - SSL certificate management

Backend Deployment:
  - Railway, Heroku, or AWS for Node.js
  - PostgreSQL database (managed service)
  - Redis for session storage and caching
  - File storage (AWS S3 or Cloudinary)

Monitoring & Logging:
  - Application performance monitoring
  - Error tracking and alerting
  - Database query optimization
  - Security monitoring and intrusion detection
```

### **Scalability Considerations**
```yaml
Horizontal Scaling:
  - Stateless application architecture
  - Load balancer configuration
  - Database read replicas
  - CDN for static asset delivery

Performance Optimization:
  - Database query optimization and indexing
  - Redis caching for frequently accessed data
  - Image compression and lazy loading
  - API response caching strategies

High Availability:
  - Multi-region deployment options
  - Database backup and recovery procedures
  - Failover mechanisms
  - Health check monitoring
```

---

## 📱 **API Documentation & Integration**

### **RESTful API Design**
```yaml
Base URL: https://api.stayza.com/v1
Authentication: Bearer token (JWT)
Content Type: application/json
Rate Limiting: Included in response headers
Versioning: URL-based versioning (/v1/, /v2/)
```

### **Core API Endpoints**

#### **Authentication API**
```yaml
POST /auth/register/guest         # Guest registration
POST /auth/register/realtor       # Realtor registration
POST /auth/login                  # User login
POST /auth/logout                 # User logout
POST /auth/verify-email           # Email verification
POST /auth/forgot-password        # Password reset request
POST /auth/reset-password         # Password reset confirmation
GET  /auth/profile               # Get user profile
PUT  /auth/profile               # Update user profile
```

#### **Property Management API**
```yaml
GET    /properties                # List all properties (with filters)
GET    /properties/:id            # Get single property
POST   /properties                # Create new property (Realtor)
PUT    /properties/:id            # Update property (Owner)
DELETE /properties/:id            # Delete property (Owner)
POST   /properties/:id/images     # Upload property images
DELETE /properties/:id/images/:imageId # Delete property image
GET    /properties/:id/availability    # Check availability
POST   /properties/:id/unavailable     # Set unavailable dates
GET    /properties/search         # Advanced property search
GET    /properties/featured       # Get featured properties
```

#### **Booking Management API**
```yaml
GET    /bookings                  # List bookings (role-based)
GET    /bookings/:id              # Get single booking
POST   /bookings                  # Create new booking
PUT    /bookings/:id/status       # Update booking status
POST   /bookings/:id/cancel       # Cancel booking
POST   /bookings/check-availability # Verify booking availability
POST   /bookings/calculate        # Calculate booking total
GET    /bookings/calendar/:propertyId # Property calendar
```

#### **Payment Processing API**
```yaml
POST /payments/initialize         # Initialize payment
POST /payments/verify            # Verify payment
GET  /payments/:id               # Get payment details
GET  /payments/history           # Payment history
POST /payments/:id/refund        # Process refund
GET  /payments/:id/receipt       # Download receipt
POST /payments/webhook           # Payment webhooks
```

### **Webhook System**
```yaml
Payment Webhooks:
  - payment.success
  - payment.failed  
  - refund.processed
  - chargeback.created

Booking Webhooks:
  - booking.created
  - booking.confirmed
  - booking.cancelled
  - booking.completed

Security:
  - HMAC signature validation
  - Idempotency handling
  - Retry mechanism for failed deliveries
```

---

## 🔧 **Development Setup**

### **Prerequisites**
```bash
Node.js >= 18.0.0
PostgreSQL >= 13.0
npm or yarn package manager
Git version control
```

### **Backend Setup**
```bash
# Clone repository
git clone https://github.com/Sylester-Oputa/Multi-Tenant-Realtor-Booking-SaaS.git
cd Multi-Tenant-Realtor-Booking-SaaS/booking-backend

# Install dependencies
npm install

# Environment setup
cp .env.example .env
# Edit .env with your configuration

# Database setup
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev
```

### **Frontend Setup**
```bash
# Navigate to frontend directory
cd ../booking-frontend

# Install dependencies
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### **Environment Configuration**

#### **Backend (.env)**
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/stayza_db"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Paystack Integration
PAYSTACK_SECRET_KEY="sk_test_your_paystack_secret_key"
PAYSTACK_PUBLIC_KEY="pk_test_your_paystack_public_key"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-email-password"

# File Upload
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# CAC API (Nigeria)
CAC_API_KEY="your_cac_api_key"
CAC_API_URL="https://api.cac.gov.ng"

# App Configuration
PORT=5050
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

#### **Frontend (.env.local)**
```env
# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:5050/api"

# Paystack Public Key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_your_paystack_public_key"

# Google Maps (Optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_google_maps_key"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Stayza"
```

---

## 🧪 **Testing Strategy**

### **Backend Testing**
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm run test:auth
npm run test:bookings
npm run test:payments
```

### **Frontend Testing**
```bash
# Run component tests
npm test

# Run E2E tests
npm run test:e2e

# Run accessibility tests
npm run test:a11y
```

### **Test Coverage Requirements**
```yaml
Controllers: >= 90% coverage
Services: >= 95% coverage
API Routes: >= 85% coverage
Components: >= 80% coverage
Critical Paths: 100% coverage (auth, payments, bookings)
```

---

## 📈 **Business Model & Revenue Streams**

### **Primary Revenue Streams**

#### **1. Transaction Fees (Primary)**
```yaml
Commission Structure:
  - Standard bookings: 10% platform fee
  - Premium listings: 8% platform fee
  - Volume discounts for high-performing realtors

Revenue Distribution:
  - Guest pays total amount
  - Platform retains 10%
  - Realtor receives 90% (minus payment processing)
```

#### **2. Subscription Tiers**
```yaml
Basic Plan (Free):
  - Up to 3 property listings
  - Basic analytics
  - Standard support
  - 10% transaction fee

Professional Plan ($29/month):
  - Unlimited property listings
  - Advanced analytics and reporting
  - Priority customer support
  - Custom branding options
  - 8% transaction fee

Enterprise Plan ($99/month):
  - Everything in Professional
  - Custom domain mapping
  - API access for integrations
  - Dedicated account manager
  - 6% transaction fee
```

#### **3. Additional Revenue Streams**
```yaml
Featured Listings:
  - Premium property placement: $10/month per property
  - Homepage feature spots: $50/month
  - Search result boosting: $20/month

Value-Added Services:
  - Professional photography: $100 per session
  - Property description writing: $50 per listing
  - Legal document templates: $25 per package
  - CAC verification assistance: $15 per application

White-Label Licensing:
  - Custom deployment for large agencies: $500+ per month
  - Complete rebranding: $2,000 setup fee
  - Dedicated infrastructure: $200/month per instance
```

### **Market Opportunity**
```yaml
Target Market Size:
  - Nigeria: 50,000+ real estate professionals
  - West Africa: 200,000+ potential realtors
  - Global expansion potential: 2M+ professionals

Revenue Projections (Year 1):
  - 1,000 registered realtors
  - 10,000 monthly bookings
  - Average booking value: ₦50,000 NGN
  - Monthly platform revenue: ₦5,000,000 NGN ($12,000 USD)

Growth Targets:
  - Year 1: 1,000 realtors, ₦60M annual revenue
  - Year 3: 10,000 realtors, ₦600M annual revenue
  - Year 5: 50,000 realtors, regional expansion
```

---

## 🌟 **Future Roadmap & Enhancement Plans**

### **Phase 1: Core Platform Stability (Q1 2026)**
```yaml
- Performance optimization and scalability improvements
- Mobile app development (React Native)
- Advanced search with AI-powered recommendations
- Integration with popular calendar applications
- Enhanced security and fraud detection
```

### **Phase 2: Advanced Features (Q2-Q3 2026)**
```yaml
- IoT integration (smart locks, sensors)
- Dynamic pricing algorithms
- Multi-currency support and international expansion
- Advanced CRM features for realtors
- Automated check-in/check-out systems
```

### **Phase 3: Market Expansion (Q4 2026 - 2027)**
```yaml
- Expansion to Ghana, Kenya, and South Africa
- Partnership with banks and fintech companies
- Integration with property management systems
- B2B white-label solutions for enterprises
- AI-powered market analysis and insights
```

### **Phase 4: Innovation & Scale (2027+)**
```yaml
- Blockchain integration for transparent transactions
- Virtual reality property tours
- Predictive analytics for demand forecasting
- Carbon footprint tracking and sustainability features
- Acquisition of complementary services (cleaning, maintenance)
```

---

## 👥 **Contributing Guidelines**

### **Code Standards**
```yaml
Language: TypeScript (strict mode)
Formatting: Prettier with ESLint
Git Workflow: Feature branches with pull requests
Commit Messages: Conventional commits format
Testing: Required for all new features
Documentation: JSDoc comments for all functions
```

### **Development Workflow**
```bash
# Create feature branch
git checkout -b feature/booking-enhancement

# Make changes with tests
npm run test

# Commit with conventional format
git commit -m "feat(booking): add multi-date selection"

# Push and create pull request
git push origin feature/booking-enhancement
```

### **Pull Request Process**
```yaml
1. Create feature branch from main
2. Implement feature with comprehensive tests
3. Update documentation if needed
4. Ensure all tests pass and code coverage maintained
5. Submit pull request with detailed description
6. Code review by team members
7. Address feedback and resolve conflicts
8. Merge after approval and CI success
```

---

## 📞 **Support & Contact**

### **Technical Support**
```yaml
Documentation: https://docs.stayza.com
API Reference: https://api.stayza.com/docs
Status Page: https://status.stayza.com
GitHub Issues: https://github.com/Sylester-Oputa/Multi-Tenant-Realtor-Booking-SaaS/issues
```

### **Business Inquiries**
```yaml
General Contact: hello@stayza.com
Partnership Opportunities: partnerships@stayza.com
Enterprise Solutions: enterprise@stayza.com
Media & Press: press@stayza.com
```

### **Community**
```yaml
Discord Server: https://discord.gg/stayza
Twitter: @StayzaPlatform
LinkedIn: Stayza Platform
Blog: https://blog.stayza.com
```

---

## 📄 **License & Legal**

### **License**
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### **Legal Compliance**
```yaml
Data Protection: GDPR compliant
Nigerian Regulations: CAC integration and compliance
Payment Standards: PCI DSS compliance through Paystack
Terms of Service: https://stayza.com/terms
Privacy Policy: https://stayza.com/privacy
Cookie Policy: https://stayza.com/cookies
```

---

## 🙏 **Acknowledgments**

Special thanks to:
- **Paystack** for reliable payment infrastructure
- **Prisma** for excellent database tooling
- **Next.js** team for the amazing React framework
- **Corporate Affairs Commission (CAC)** for business verification APIs
- The Nigerian fintech ecosystem for inspiration and support

---

## 📊 **Project Status**

```yaml
Version: 1.0.0-beta
Status: Active Development
Last Updated: October 2025
Contributors: 1+ developers
GitHub Stars: ⭐ Star this repo if you find it useful!
```

---

**Built with ❤️ by Sylester Oputa and the Stayza team**

*Empowering the next generation of real estate professionals with cutting-edge booking technology.*
