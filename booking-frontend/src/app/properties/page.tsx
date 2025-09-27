"use client";

import { useProperties } from "../../hooks/useProperties";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { PropertyGrid } from "../../components/property/PropertyGrid";
import { SearchFilters } from "../../components/property/SearchFilters";
import { useState } from "react";
import type { PropertyFilters } from "../../types";

export default function PropertiesPage() {
  const [filters, setFilters] = useState<PropertyFilters>({});

  const { data: propertiesResponse, isLoading } = useProperties(filters, {
    page: 1,
    limit: 20,
  });

  const handleFiltersChange = (newFilters: PropertyFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Properties</h1>
            <p className="mt-2 text-gray-600">
              Discover amazing places to stay around the world
            </p>
          </div>

          <SearchFilters onFiltersChange={handleFiltersChange} />

          <PropertyGrid
            properties={propertiesResponse?.data || []}
            loading={isLoading}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
