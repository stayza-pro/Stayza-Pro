import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, Wifi, Car, Waves, Star, Heart } from "lucide-react";
import { Property, BrandColors } from "../../types/preview";
import { useGradient } from "../../hooks/useGradient";
import { useCurrency } from "../../hooks/useCurrency";

interface PropertiesSectionProps {
  properties: Property[];
  colors: BrandColors;
  currency: string;
  highlightRegion?: string;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  deviceType?: "desktop" | "tablet" | "mobile";
}

const PropertySkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
    <div className="h-64 bg-gray-200" />
    <div className="p-6 space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  </div>
);

const EmptyState = ({ colors }: { colors: BrandColors }) => (
  <div className="col-span-full text-center py-16">
    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
      <MapPin className="w-12 h-12 text-gray-400" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">
      No Properties Yet
    </h3>
    <p className="text-gray-500 mb-6">
      Properties will appear here once they're added to your portfolio.
    </p>
    <button
      className="px-6 py-3 rounded-xl font-semibold text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      style={{ backgroundColor: colors.primary }}
    >
      Add First Property
    </button>
  </div>
);

const ErrorState = ({
  error,
  onRetry,
  colors,
}: {
  error: string;
  onRetry?: () => void;
  colors: BrandColors;
}) => (
  <div className="col-span-full text-center py-16">
    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
      <MapPin className="w-12 h-12 text-red-400" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">
      Error Loading Properties
    </h3>
    <p className="text-gray-500 mb-6">{error}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-6 py-3 rounded-xl font-semibold text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        style={{ backgroundColor: colors.primary }}
      >
        Try Again
      </button>
    )}
  </div>
);

export const PropertiesSection: React.FC<PropertiesSectionProps> = ({
  properties,
  colors,
  currency,
  highlightRegion,
  isLoading = false,
  error,
  onRetry,
  deviceType = "desktop",
}) => {
  const { formatPrice } = useCurrency(currency, "en");

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi":
      case "wi-fi":
        return <Wifi className="w-4 h-4" />;
      case "parking":
      case "car":
        return <Car className="w-4 h-4" />;
      case "pool":
      case "swimming pool":
        return <Waves className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <motion.section
      animate={
        highlightRegion === "properties"
          ? {
              boxShadow: "0 0 0 2px #3B82F6, 0 0 0 4px rgba(59, 130, 246, 0.2)",
              scale: 1.01,
            }
          : {}
      }
      transition={{ duration: 0.3 }}
      className="py-12 bg-gradient-to-b from-gray-50 to-white"
      id="properties"
    >
      <div
        className={`max-w-7xl mx-auto ${
          deviceType === "mobile"
            ? "px-4"
            : deviceType === "tablet"
            ? "px-6"
            : "px-8"
        }`}
      >
        {/* Section Header */}
        <div
          className={`text-center ${deviceType === "mobile" ? "mb-4" : "mb-8"}`}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`inline-block px-4 py-2 rounded-full font-medium ${
              deviceType === "mobile" ? "text-xs mb-2" : "text-sm mb-4"
            }`}
            style={{
              backgroundColor: `${colors.primary}15`,
              color: colors.primary,
            }}
          >
            Featured Properties
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`font-bold text-gray-900 ${
              deviceType === "mobile"
                ? "text-2xl mb-3"
                : deviceType === "tablet"
                ? "text-3xl mb-4"
                : "text-4xl lg:text-5xl mb-6"
            }`}
          >
            Our Properties
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`text-gray-600 max-w-3xl mx-auto ${
              deviceType === "mobile"
                ? "text-sm"
                : deviceType === "tablet"
                ? "text-base"
                : "text-xl"
            }`}
          >
            Explore our curated collection of premium properties
          </motion.p>
        </div>

        {/* Properties Grid */}
        <div
          className={`grid gap-8 ${
            deviceType === "mobile"
              ? "grid-cols-1 gap-4"
              : deviceType === "tablet"
              ? "grid-cols-2 gap-6"
              : "md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <PropertySkeleton key={idx} />
            ))
          ) : error ? (
            <ErrorState error={error} onRetry={onRetry} colors={colors} />
          ) : properties.length === 0 ? (
            <EmptyState colors={colors} />
          ) : (
            properties.map((property, idx) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className={`bg-white shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group ${
                  deviceType === "mobile" ? "rounded-xl" : "rounded-2xl"
                }`}
              >
                {/* Property Image */}
                <div
                  className={`relative overflow-hidden ${
                    deviceType === "mobile"
                      ? "h-48"
                      : deviceType === "tablet"
                      ? "h-56"
                      : "h-64"
                  }`}
                >
                  {property.images && property.images.length > 0 ? (
                    <Image
                      src={property.images[0]}
                      alt={property.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: `${colors.primary}10` }}
                    >
                      <MapPin
                        className="w-16 h-16"
                        style={{ color: colors.primary }}
                      />
                    </div>
                  )}

                  {/* Favorite Button */}
                  <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-md">
                    <Heart className="w-5 h-5 text-gray-600 hover:text-red-500" />
                  </button>

                  {/* Property Type Badge */}
                  <div className="absolute top-4 left-4">
                    <span
                      className="px-3 py-1 text-sm font-medium text-white rounded-full"
                      style={{ backgroundColor: colors.secondary }}
                    >
                      {property.type}
                    </span>
                  </div>

                  {/* Rating Badge */}
                  {property.rating && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold text-gray-900">
                        {property.rating}
                      </span>
                    </div>
                  )}
                </div>

                {/* Property Details */}
                <div
                  className={`${
                    deviceType === "mobile"
                      ? "p-4"
                      : deviceType === "tablet"
                      ? "p-5"
                      : "p-6"
                  }`}
                >
                  <h3
                    className={`font-bold text-gray-900 mb-2 line-clamp-1 ${
                      deviceType === "mobile"
                        ? "text-lg"
                        : deviceType === "tablet"
                        ? "text-lg"
                        : "text-xl"
                    }`}
                  >
                    {property.title}
                  </h3>

                  <div
                    className={`flex items-center text-gray-600 ${
                      deviceType === "mobile" ? "mb-3" : "mb-4"
                    }`}
                  >
                    <MapPin
                      className={`mr-1 flex-shrink-0 ${
                        deviceType === "mobile" ? "w-3 h-3" : "w-4 h-4"
                      }`}
                    />
                    <span
                      className={`line-clamp-1 ${
                        deviceType === "mobile" ? "text-xs" : "text-sm"
                      }`}
                    >
                      {property.location}
                    </span>
                  </div>

                  {/* Amenities */}
                  {property.amenities && property.amenities.length > 0 && (
                    <div
                      className={`flex items-center pb-4 border-b border-gray-100 ${
                        deviceType === "mobile" ? "gap-2 mb-3" : "gap-4 mb-4"
                      }`}
                    >
                      {property.amenities
                        ?.slice(0, deviceType === "mobile" ? 2 : 3)
                        .map((amenity: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 text-gray-500"
                          >
                            {getAmenityIcon(amenity)}
                            <span
                              className={`${
                                deviceType === "mobile" ? "text-xs" : "text-xs"
                              }`}
                            >
                              {deviceType === "mobile"
                                ? amenity.slice(0, 8) +
                                  (amenity.length > 8 ? "..." : "")
                                : amenity}
                            </span>
                          </div>
                        ))}
                      {property.amenities.length >
                        (deviceType === "mobile" ? 2 : 3) && (
                        <span className="text-xs text-gray-400">
                          +
                          {property.amenities.length -
                            (deviceType === "mobile" ? 2 : 3)}{" "}
                          more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price and Booking */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span
                        className={`font-bold text-gray-900 ${
                          deviceType === "mobile"
                            ? "text-lg"
                            : deviceType === "tablet"
                            ? "text-xl"
                            : "text-2xl"
                        }`}
                      >
                        {formatPrice(property.pricePerNight, currency)}
                      </span>
                      <span
                        className={`text-gray-500 ml-1 ${
                          deviceType === "mobile" ? "text-xs" : "text-sm"
                        }`}
                      >
                        /night
                      </span>
                    </div>
                    <button
                      className={`rounded-lg font-semibold text-white transition-all hover:shadow-lg transform hover:-translate-y-0.5 ${
                        deviceType === "mobile"
                          ? "px-3 py-1.5 text-sm"
                          : "px-4 py-2"
                      }`}
                      style={{ backgroundColor: colors.accent }}
                    >
                      Book
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* View All Button */}
        {!isLoading && !error && properties.length > 0 && (
          <div
            className={`text-center ${
              deviceType === "mobile" ? "mt-6" : "mt-12"
            }`}
          >
            <button
              className={`rounded-xl font-semibold text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                deviceType === "mobile"
                  ? "px-6 py-3 text-sm"
                  : deviceType === "tablet"
                  ? "px-7 py-3.5 text-base"
                  : "px-8 py-4"
              }`}
              style={{ backgroundColor: colors.primary }}
            >
              View All Properties
            </button>
          </div>
        )}
      </div>
    </motion.section>
  );
};
