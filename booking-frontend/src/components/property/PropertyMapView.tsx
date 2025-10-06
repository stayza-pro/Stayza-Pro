"use client";

import React, { useState, useRef, useEffect } from "react";
import { Property } from "../../types";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Star,
  Heart,
  Maximize2,
  Minimize2,
  Navigation,
  Filter,
  DollarSign,
} from "lucide-react";
import { Card } from "../ui";

interface MapViewProps {
  properties: Property[];
  selectedProperty?: Property | null;
  onPropertySelect?: (property: Property) => void;
  onPropertyHover?: (property: Property | null) => void;
  className?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  showFilters?: boolean;
}

interface MapMarkerProps {
  property: Property;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const MapMarker: React.FC<MapMarkerProps> = ({
  property,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <motion.div
      className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer"
      style={{
        left: "50%",
        top: "100%",
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: isSelected || isHovered ? 1.1 : 1,
        opacity: 1,
        zIndex: isSelected || isHovered ? 20 : 10,
      }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={`
          relative px-3 py-2 rounded-lg shadow-lg cursor-pointer transition-all
          ${
            isSelected
              ? "bg-blue-600 text-white ring-2 ring-blue-200"
              : isHovered
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-900 border border-gray-200"
          }
        `}
      >
        <div className="text-sm font-semibold">
          ${property.pricePerNight.toLocaleString()}
        </div>

        {/* Pointer/Arrow */}
        <div
          className={`
            absolute left-1/2 transform -translate-x-1/2 top-full
            w-0 h-0 border-l-4 border-r-4 border-t-6
            ${
              isSelected
                ? "border-l-transparent border-r-transparent border-t-blue-600"
                : isHovered
                ? "border-l-transparent border-r-transparent border-t-blue-500"
                : "border-l-transparent border-r-transparent border-t-white"
            }
          `}
        />
      </div>
    </motion.div>
  );
};

const PropertyPreviewCard: React.FC<{
  property: Property;
  onClose: () => void;
  onViewDetails: () => void;
}> = ({ property, onClose, onViewDetails }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-4 left-4 right-4 z-30 max-w-md"
    >
      <Card className="p-4 bg-white shadow-xl">
        <div className="flex items-start space-x-4">
          {/* Property Image */}
          <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
            {property.images && property.images.length > 0 ? (
              <img
                src={property.images[0].url}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Property Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 truncate">
                  {property.title}
                </h3>
                <p className="text-sm text-gray-600 truncate">
                  {property.city}, {property.country}
                </p>

                <div className="flex items-center mt-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600 ml-1">
                    {property.averageRating?.toFixed(1) || "New"}
                  </span>
                  <span className="text-sm text-gray-400 ml-1">
                    ({property.reviewCount || 0})
                  </span>
                </div>

                <div className="mt-2">
                  <span className="font-semibold text-gray-900">
                    ${property.pricePerNight.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-600"> / night</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="flex items-center justify-between mt-3">
              <button
                onClick={onViewDetails}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                View Details
              </button>

              <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <Heart className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export const PropertyMapView: React.FC<MapViewProps> = ({
  properties,
  selectedProperty,
  onPropertySelect,
  onPropertyHover,
  className = "",
  center = { lat: 6.5244, lng: 3.3792 }, // Lagos, Nigeria default
  zoom = 12,
  showFilters = true,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredProperty, setHoveredProperty] = useState<Property | null>(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);

  // Mock map bounds - in real implementation, this would come from the map library
  const mapBounds = {
    north: mapCenter.lat + 0.1,
    south: mapCenter.lat - 0.1,
    east: mapCenter.lng + 0.1,
    west: mapCenter.lng - 0.1,
  };

  // Filter properties within map bounds
  const visibleProperties = properties.filter((property) => {
    if (!property.latitude || !property.longitude) return false;

    return (
      property.latitude >= mapBounds.south &&
      property.latitude <= mapBounds.north &&
      property.longitude >= mapBounds.west &&
      property.longitude <= mapBounds.east
    );
  });

  const handlePropertyClick = (property: Property) => {
    onPropertySelect?.(property);
  };

  const handlePropertyHover = (property: Property | null) => {
    setHoveredProperty(property);
    onPropertyHover?.(property);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const centerOnUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setMapZoom(14);
        },
        (error) => {
          console.warn("Geolocation error:", error);
        }
      );
    }
  };

  // Convert property coordinates to pixel positions (mock implementation)
  const getPropertyPosition = (property: Property) => {
    if (!property.latitude || !property.longitude) return { x: 0, y: 0 };

    // Mock conversion - in real implementation, use map library's projection
    const x =
      ((property.longitude - mapBounds.west) /
        (mapBounds.east - mapBounds.west)) *
      100;
    const y =
      ((mapBounds.north - property.latitude) /
        (mapBounds.north - mapBounds.south)) *
      100;

    return { x: `${x}%`, y: `${y}%` };
  };

  return (
    <div
      className={`relative ${
        isFullscreen ? "fixed inset-0 z-50" : "h-96"
      } ${className}`}
    >
      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-full bg-gray-100 rounded-lg overflow-hidden relative"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
            linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
          `,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
        }}
      >
        {/* Mock Map Tiles */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 opacity-30" />

        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-20 space-y-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={centerOnUserLocation}
            className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <Navigation className="h-4 w-4" />
          </button>
        </div>

        {/* Property Markers */}
        {visibleProperties.map((property) => {
          const position = getPropertyPosition(property);
          const isSelected = selectedProperty?.id === property.id;
          const isHovered = hoveredProperty?.id === property.id;

          return (
            <div
              key={property.id}
              className="absolute"
              style={{
                left: position.x,
                top: position.y,
              }}
            >
              <MapMarker
                property={property}
                isSelected={isSelected}
                isHovered={isHovered}
                onClick={() => handlePropertyClick(property)}
                onMouseEnter={() => handlePropertyHover(property)}
                onMouseLeave={() => handlePropertyHover(null)}
              />
            </div>
          );
        })}

        {/* Property Count Badge */}
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-white rounded-lg shadow-md px-3 py-2">
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="font-medium">
                {visibleProperties.length}{" "}
                {visibleProperties.length === 1 ? "property" : "properties"}
              </span>
            </div>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 z-20">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <button
              onClick={() => setMapZoom(Math.min(mapZoom + 1, 18))}
              className="block w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors border-b border-gray-200"
            >
              +
            </button>
            <button
              onClick={() => setMapZoom(Math.max(mapZoom - 1, 1))}
              className="block w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              −
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-20">
          <Card className="p-3 bg-white shadow-md">
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-4 bg-white border border-gray-300 rounded flex items-center justify-center">
                  <DollarSign className="h-2 w-2" />
                </div>
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-4 bg-blue-600 rounded flex items-center justify-center">
                  <DollarSign className="h-2 w-2 text-white" />
                </div>
                <span>Selected</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Property Preview Card */}
      <AnimatePresence>
        {selectedProperty && (
          <PropertyPreviewCard
            property={selectedProperty}
            onClose={() => onPropertySelect?.(null)}
            onViewDetails={() => {
              // Navigate to property details
              window.location.href = `/properties/${selectedProperty.id}`;
            }}
          />
        )}
      </AnimatePresence>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div className="absolute top-4 left-4 z-40">
          <Card className="p-4 bg-white shadow-xl">
            <h2 className="text-lg font-semibold mb-2">Property Map</h2>
            <p className="text-sm text-gray-600">
              Click on price markers to view property details
            </p>
          </Card>
        </div>
      )}
    </div>
  );
};
