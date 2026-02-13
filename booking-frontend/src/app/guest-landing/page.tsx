"use client";

import React from "react";
import Link from "next/link";
import { Search, MapPin, Calendar, Shield, Award, HeadphonesIcon } from "lucide-react";
import { Button, Input, Skeleton } from "@/components/ui";
import { PropertyCard } from "@/components/property/PropertyCard";
import { useProperties } from "@/hooks/useProperties";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";

export default function GuestLandingPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const {
    brandColor: primaryColor,
    tagline,
  } = useRealtorBranding();

  const { data: propertiesResponse, isLoading } = useProperties({}, { page: 1, limit: 3 });
  const featuredProperties = propertiesResponse?.data || [];

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <section className="relative bg-gradient-to-br from-slate-50 to-slate-100 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
              Find Your Perfect <span className="inline-block" style={{ color: primaryColor }}>Home</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {tagline || "Discover premium properties from trusted realtors across the country"}
            </p>

            <div className="bg-white rounded-2xl shadow-lg p-3 max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Location, city, or neighborhood"
                    className="pl-10 h-12 bg-transparent border-0 focus-visible:ring-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Link href={`/guest/browse${searchQuery ? `?location=${encodeURIComponent(searchQuery)}` : ""}`}>
                  <Button size="lg" className="w-full sm:w-auto text-white" style={{ backgroundColor: primaryColor }}>
                    <Search className="w-5 h-5 mr-2" />
                    Search
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-gray-500">Popular:</span>
              {["Lagos", "Abuja", "Port Harcourt", "Ibadan"].map((city) => (
                <Link
                  key={city}
                  href={`/guest/browse?location=${encodeURIComponent(city)}`}
                  className="px-3 py-1 rounded-full bg-white hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  {city}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Why Choose Us</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Premium real estate booking made simple and secure</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Verified Properties",
                description: "Every property is verified and approved by our team for quality assurance.",
              },
              {
                icon: Award,
                title: "Trusted Realtors",
                description: "Work with experienced and certified real estate professionals.",
              },
              {
                icon: HeadphonesIcon,
                title: "24/7 Support",
                description: "Our support team is always available to help with your needs.",
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-white" style={{ backgroundColor: primaryColor }}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">Featured Properties</h2>
              <p className="text-gray-600">Handpicked properties you'll love</p>
            </div>
            <Link href="/guest/browse">
              <Button variant="outline" className="hidden sm:flex">View All</Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="space-y-3">
                  <Skeleton className="h-64 rounded-xl" />
                  <Skeleton className="h-6 w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link href="/guest/browse">
              <Button variant="outline" className="w-full sm:w-auto">View All Properties</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl p-8 md:p-12 text-center text-white" style={{ backgroundColor: primaryColor }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Find Your Dream Home?</h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of satisfied clients who found their perfect property with us.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/guest/browse">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  <Search className="w-5 h-5 mr-2" />
                  Browse Properties
                </Button>
              </Link>
              <Link href="/guest/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border-white/20 text-white">
                  <Calendar className="w-5 h-5 mr-2" />
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
