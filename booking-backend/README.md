# Booking System Backend
```
DATABASE_URL=postgresql://username:password@localhost:5432/booking_db
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
STRIPE_SECRET_KEY=sk_test_your_stripe_key
PAYSTACK_SECRET_KEY=sk_test_your_paystack_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PRISMA_CLIENT_ENGINE_TYPE=binary
```
- 🔄 **24-hour Refund Policy** implementation
- 📚 **Swagger API Documentation**
- 🌍 **Multi-currency Support**
- 🛡️ **Rate Limiting** and security middleware

## Tech Stack

- **Runtime**: Node.js 18+ (use the Prisma binary engine on Node 24+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Payments**: Stripe, Paystack
- **File Upload**: Cloudinary
- **Documentation**: Swagger UI
- **Validation**: Joi
- **Testing**: Jest

## Getting Started

### Prerequisites

- Node.js 18+ installed (Node 24+ works when the Prisma binary engine is enabled)
- PostgreSQL database
- Stripe and Paystack accounts
- Cloudinary account for image uploads

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd booking-backend
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env
\`\`\`

Edit the \`.env\` file with your configuration:
- Database URL
- JWT secrets
- Stripe keys
- Paystack keys
- Cloudinary credentials
- SMTP settings

4. Set up the database:
\`\`\`bash
npm run prisma:migrate
npm run prisma:generate
\`\`\`

5. Seed the database (optional):
\`\`\`bash
npm run prisma:seed
\`\`\`

6. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

The API will be available at `http://localhost:5000`

### Troubleshooting

- **TypeError: Cannot read properties of undefined (reading 'bind')** when importing `@prisma/client` indicates Prisma is trying to load the Node-API library engine on a newer Node release. Either set `PRISMA_CLIENT_ENGINE_TYPE=binary` (recommended for Node 24+) or upgrade/downgrade Node to a version supported by the library engine, then reinstall dependencies.

## API Documentation

Once the server is running, you can access:
- **API Documentation**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/health

## API Endpoints

### Authentication
- \`POST /api/auth/register\` - Register new user
- \`POST /api/auth/login\` - Login user
- \`GET /api/auth/me\` - Get current user profile
- \`PUT /api/auth/profile\` - Update user profile
- \`POST /api/auth/logout\` - Logout user
- \`POST /api/auth/refresh\` - Refresh access token

### Properties
- \`GET /api/properties\` - Get all properties (with filters)
- \`GET /api/properties/:id\` - Get single property
- \`POST /api/properties\` - Create property (Host only)
- \`PUT /api/properties/:id\` - Update property (Owner/Admin)
- \`DELETE /api/properties/:id\` - Delete property (Owner/Admin)
- \`GET /api/properties/host/:hostId\` - Get properties by host
- \`POST /api/properties/:id/images\` - Upload property images

### Bookings
- \`GET /api/bookings/availability/:propertyId\` - Check property availability
- \`POST /api/bookings\` - Create booking (Guest only)
- \`GET /api/bookings\` - Get all bookings (Admin only)
- \`GET /api/bookings/my-bookings\` - Get user's bookings
- \`GET /api/bookings/host-bookings\` - Get host's bookings (Host only)
- \`GET /api/bookings/:id\` - Get single booking
- \`PUT /api/bookings/:id/cancel\` - Cancel booking
- \`PUT /api/bookings/:id/status\` - Update booking status (Host/Admin)

### Payments
- \`POST /api/payments/create-stripe-intent\` - Create Stripe payment intent
- \`POST /api/payments/initialize-paystack\` - Initialize Paystack payment
- \`POST /api/payments/verify-paystack\` - Verify Paystack payment
- \`GET /api/payments/:id\` - Get payment details
- \`POST /api/payments/:id/refund\` - Process refund
- \`POST /api/payments/stripe-webhook\` - Stripe webhook handler
- \`POST /api/payments/paystack-webhook\` - Paystack webhook handler

### Reviews
- \`POST /api/reviews\` - Create review (Guest only)
- \`GET /api/reviews/property/:propertyId\` - Get property reviews
- \`GET /api/reviews/my-reviews\` - Get user's reviews
- \`GET /api/reviews/host-reviews\` - Get host's reviews
- \`GET /api/reviews/:id\` - Get single review
- \`PUT /api/reviews/:id\` - Update review (Author only)
- \`DELETE /api/reviews/:id\` - Delete review (Author/Admin)
- \`PATCH /api/reviews/:id/visibility\` - Toggle review visibility (Admin)

## Database Schema

The system uses the following main models:
- **User**: Stores user information with roles (Guest, Host, Admin)
- **Property**: Property listings with details and amenities
- **Booking**: Booking records with status tracking
- **Payment**: Payment transactions with multiple providers
- **Review**: User reviews and ratings
- **RefreshToken**: JWT refresh token management
- **UnavailableDate**: Property unavailable dates

## Payment Integration

### Stripe (Foreign Clients)
- Payment intents for secure payments
- Webhook handling for payment status updates
- Refund processing

### Paystack (Nigerian/African Clients)
- Transaction initialization
- Payment verification
- Refund processing

## Security Features

- JWT authentication with refresh tokens
- Role-based access control
- Rate limiting by endpoint
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers
- Password hashing with bcrypt

## Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm start\` - Start production server
- \`npm run prisma:migrate\` - Run database migrations
- \`npm run prisma:generate\` - Generate Prisma client
- \`npm run prisma:seed\` - Seed database
- \`npm run prisma:studio\` - Open Prisma Studio
- \`npm test\` - Run tests
- \`npm run lint\` - Lint code

## Environment Variables

Required environment variables (see \`.env.example\`):

\`\`\`env
DATABASE_URL=postgresql://username:password@localhost:5432/booking_db
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
STRIPE_SECRET_KEY=sk_test_your_stripe_key
PAYSTACK_SECRET_KEY=sk_test_your_paystack_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
\`\`\`

## Deployment

1. Build the application:
\`\`\`bash
npm run build
\`\`\`

2. Set production environment variables

3. Run database migrations:
\`\`\`bash
npm run prisma:migrate
\`\`\`

4. Start the production server:
\`\`\`bash
npm start
\`\`\`

## License

This project is licensed under the MIT License.