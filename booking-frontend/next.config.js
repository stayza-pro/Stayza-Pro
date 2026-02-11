/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Optimize for modern browsers
  swcMinify: true,
  
  // Server-side redirects for better SEO
  async redirects() {
    return [
      // Redirect common alternate URLs to canonical versions
      {
        source: '/home',
        destination: '/en',
        permanent: true,
      },
      {
        source: '/index',
        destination: '/en',
        permanent: true,
      },
      {
        source: '/index.html',
        destination: '/en',
        permanent: true,
      },
      // Legacy route cleanup redirects
      {
        source: '/guest/browse/:id',
        destination: '/browse/:id',
        permanent: true,
      },
      {
        source: '/realtor/verify-email',
        destination: '/verify-email',
        permanent: true,
      },
      {
        source: '/payments',
        destination: '/dashboard/payments',
        permanent: true,
      },
      {
        source: '/reset-password',
        destination: '/realtor/reset-password',
        permanent: true,
      },
    ];
  },
  
  // Security and SEO headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },
  
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY,
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
  },
}

export default nextConfig;
