# Booking System Frontend

A modern, responsive frontend for the property booking system built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 🎨 **Modern UI/UX** with responsive design
- 🔐 **Authentication System** with JWT token management
- 🏠 **Property Listings** with search and filtering
- 📅 **Interactive Booking** with date picker and availability checking
- 💳 **Payment Integration** supporting Stripe and Paystack
- ⭐ **Review System** with ratings and comments
- 👥 **Role-based Dashboards** for Guests, Hosts, and Admins
- 📱 **Mobile Responsive** design
- ⚡ **Performance Optimized** with Next.js features
- 🎭 **Smooth Animations** with Framer Motion

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Forms**: React Hook Form
- **Payments**: Stripe Elements, Paystack
- **Date Handling**: React DatePicker, date-fns
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running (see booking-backend)

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd booking-frontend
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit the \`.env.local\` file:
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

4. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

The application will be available at \`http://localhost:3000\`

## Project Structure

\`\`\`
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── properties/        # Property pages
│   ├── bookings/          # Booking pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Layout components
│   ├── forms/            # Form components
│   └── features/         # Feature-specific components
├── context/              # React contexts
├── hooks/                # Custom React hooks
├── services/             # API services
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
└── styles/               # Global styles
\`\`\`

## Key Components

### Authentication
- Login/Register forms with validation
- JWT token management
- Protected routes
- Role-based access control

### Property Management
- Property listing with search/filters
- Property detail pages with image galleries
- Host property management dashboard
- Property creation/editing forms

### Booking System
- Interactive calendar for date selection
- Availability checking
- Booking flow with multi-step forms
- Booking management dashboard

### Payment Processing
- Stripe integration for foreign clients
- Paystack integration for Nigerian/African clients
- Payment status tracking
- Refund processing

### Review System
- Rating and review components
- Review listing and filtering
- Review management

## Features by User Role

### Guest Users
- Browse and search properties
- View property details and reviews
- Create bookings with payment
- Manage booking history
- Leave reviews for completed stays

### Host Users
- List and manage properties
- Upload property images
- Manage bookings and availability
- View earnings and analytics
- Respond to guest inquiries

### Admin Users
- Manage all users and properties
- Monitor bookings and payments
- Moderate reviews
- System analytics dashboard
- Content management

## Responsive Design

The application is fully responsive with breakpoints:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px  
- **Desktop**: > 1024px

## Performance Optimizations

- Next.js Image optimization
- Code splitting with dynamic imports
- React Query for efficient data fetching
- Optimistic updates for better UX
- Lazy loading of components

## Development Workflow

### Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run lint\` - Run ESLint
- \`npm run type-check\` - Run TypeScript checks
- \`npm test\` - Run tests

### Code Quality

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Husky for pre-commit hooks

## Styling Guidelines

Using Tailwind CSS with custom design system:

### Colors
- **Primary**: Blue shades for main actions
- **Secondary**: Gray shades for neutral elements
- **Success**: Green for positive actions
- **Warning**: Yellow for warnings
- **Error**: Red for errors

### Typography
- Font family: Inter
- Responsive text sizing
- Consistent line heights

### Components
- Reusable UI components in \`components/ui/\`
- Consistent spacing and styling
- Accessible design patterns

## API Integration

The frontend communicates with the backend API through:

- **Axios** for HTTP requests
- **React Query** for data fetching and caching
- **Custom hooks** for API operations
- **Error handling** with user-friendly messages

## State Management

Using Zustand for global state:
- User authentication state
- Booking flow state  
- UI state (modals, loading, etc.)
- Shopping cart for bookings

## Deployment

### Build for Production

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set production environment variables

3. Build the application:
\`\`\`bash
npm run build
\`\`\`

4. Start the production server:
\`\`\`bash
npm start
\`\`\`

### Deploy to Vercel

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Contributing

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature/new-feature\`
3. Make your changes
4. Commit your changes: \`git commit -am 'Add new feature'\`
5. Push to the branch: \`git push origin feature/new-feature\`
6. Submit a pull request

## License

This project is licensed under the MIT License.