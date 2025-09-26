"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { Header } from "../components/layout/Header";
import { SearchFilters } from "../components/property/SearchFilters";
import { PropertyGrid } from "../components/property/PropertyGrid";
import { Footer } from "../components/layout/Footer";
import Loading from "../components/ui/Loading";
import { useProperties } from "../hooks/useProperties";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  // Fetch properties using the properties hook
  const { data: propertiesResponse, isLoading: propertiesLoading } =
    useProperties(
      undefined, // filters
      { page: 1, limit: 12 } // searchParams
    );

  useEffect(() => {
    // Simulate loading check
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        {/* Simple Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find Your Perfect Stay
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-blue-100">
              Discover amazing places to stay around the world
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-8">
            <SearchFilters />
            <PropertyGrid
              properties={propertiesResponse?.data || []}
              loading={propertiesLoading}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
