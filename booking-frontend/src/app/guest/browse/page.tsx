"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Home,
  Building2,
  Castle,
  X,
  ChevronDown,
} from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { useProperties } from "@/hooks/useProperties";
import { useBrandTokens } from "@/providers/BrandTokenProvider";
import type { PropertyFilters, PropertyType } from "@/types";

const propertyTypes = [
  { value: "all", label: "All Types", icon: Home },
  { value: "house", label: "House", icon: Home },
  { value: "apartment", label: "Apartment", icon: Building2 },
  { value: "villa", label: "Villa", icon: Castle },
  { value: "studio", label: "Studio", icon: Building2 },
];

const sortOptions = [
  { value: "relevant", label: "Most Relevant" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest" },
];

const bedroomOptions = [
  { value: "any", label: "Any bedrooms" },
  { value: "1", label: "1+ bedroom" },
  { value: "2", label: "2+ bedrooms" },
  { value: "3", label: "3+ bedrooms" },
  { value: "4", label: "4+ bedrooms" },
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <div className="aspect-[4/3] animate-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 rounded-lg animate-shimmer" />
        <div className="h-4 w-1/2 rounded-lg animate-shimmer" />
        <div className="h-4 w-full rounded-lg animate-shimmer" />
      </div>
    </div>
  );
}

export default function BrowsePropertiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000000);
  const [bedrooms, setBedrooms] = useState("any");
  const [sortBy, setSortBy] = useState("relevant");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const tokens = useBrandTokens();

  useEffect(() => {
    const location = new URLSearchParams(window.location.search).get("location");
    if (location) setSearchQuery(location);
  }, []);

  const filters: PropertyFilters = useMemo(
    () => ({
      city: searchQuery || undefined,
      minPrice: minPrice > 0 ? minPrice : undefined,
      maxPrice: maxPrice < 10000000 ? maxPrice : undefined,
      type: propertyType !== "all" ? (propertyType.toUpperCase() as PropertyType) : undefined,
      isActive: true,
      isApproved: true,
    }),
    [searchQuery, minPrice, maxPrice, propertyType]
  );

  const { data: propertiesResponse, isLoading } = useProperties(filters, {
    page: 1,
    limit: 30,
  });

  const properties = useMemo(() => {
    const items = [...(propertiesResponse?.data || [])];
    const filtered = bedrooms === "any" ? items : items.filter((p) => p.bedrooms >= Number(bedrooms));

    switch (sortBy) {
      case "price-low": return filtered.sort((a, b) => a.pricePerNight - b.pricePerNight);
      case "price-high": return filtered.sort((a, b) => b.pricePerNight - a.pricePerNight);
      case "rating": return filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      case "newest": return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      default: return filtered;
    }
  }, [propertiesResponse?.data, bedrooms, sortBy]);

  const hasActiveFilters = propertyType !== "all" || bedrooms !== "any" || minPrice > 0 || maxPrice < 10000000;

  const resetFilters = () => {
    setPropertyType("all");
    setBedrooms("any");
    setMinPrice(0);
    setMaxPrice(10000000);
    setSearchQuery("");
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Property Type */}
      <div>
        <label className="text-sm font-semibold text-gray-900 mb-3 block">Property Type</label>
        <div className="grid grid-cols-2 gap-2">
          {propertyTypes.map((type) => {
            const Icon = type.icon;
            const active = propertyType === type.value;
            return (
              <button
                key={type.value}
                onClick={() => setPropertyType(type.value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  active
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Icon size={16} />
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-sm font-semibold text-gray-900 mb-1 block">Price Range</label>
        <p className="text-xs text-gray-500 mb-3">
          {"NGN"} {minPrice.toLocaleString()} - {"NGN"} {maxPrice.toLocaleString()}
        </p>
        <div className="space-y-3">
          <input
            type="range"
            min={0}
            max={10000000}
            step={50000}
            value={minPrice}
            onChange={(e) => setMinPrice(Number(e.target.value))}
            className="w-full accent-[var(--brand-primary)]"
          />
          <input
            type="range"
            min={0}
            max={10000000}
            step={50000}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-[var(--brand-primary)]"
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="text-sm font-semibold text-gray-900 mb-3 block">Bedrooms</label>
        <div className="flex flex-wrap gap-2">
          {bedroomOptions.map((opt) => {
            const active = bedrooms === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setBedrooms(opt.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                  active
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Browse Properties</h1>
          <p className="text-sm text-gray-500">Find your perfect stay from our collection</p>
        </div>

        {/* Search + Filter bar */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by location, city, or property name..."
              className="w-full h-11 pl-10 pr-4 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowMobileFilters(true)}
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors relative"
            aria-label="Open filters"
          >
            <SlidersHorizontal size={18} />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--brand-primary)]" />
            )}
          </button>
        </div>

        {/* Mobile filter sheet */}
        {showMobileFilters && (
          <>
            <div className="fixed inset-0 bg-black/30 z-40 md:hidden animate-fade-in" onClick={() => setShowMobileFilters(false)} />
            <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl md:hidden animate-fade-in-up max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <div className="flex items-center gap-3">
                  {hasActiveFilters && (
                    <button onClick={resetFilters} className="text-xs font-medium text-[var(--brand-primary)]">
                      Reset
                    </button>
                  )}
                  <button onClick={() => setShowMobileFilters(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <FilterContent />
              </div>
              <div className="sticky bottom-0 p-4 border-t border-gray-100 bg-white">
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full h-12 rounded-xl text-sm font-semibold text-white transition-all bg-[var(--brand-primary)] hover:opacity-90"
                >
                  Show {properties.length} properties
                </button>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="sticky top-20 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
                {hasActiveFilters && (
                  <button onClick={resetFilters} className="text-xs font-medium text-[var(--brand-primary)] hover:underline">
                    Reset
                  </button>
                )}
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Property grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5 gap-4">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{properties.length}</span> properties found
              </p>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none h-9 pl-3 pr-8 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] cursor-pointer"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : properties.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No properties found</h3>
                <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or search criteria</p>
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
