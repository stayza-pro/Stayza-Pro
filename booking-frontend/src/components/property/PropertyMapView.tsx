"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Property } from "../../types";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Star,
  Heart,
  Maximize2,
  Minimize2,
  Navigation,
  DollarSign,
} from "lucide-react";
import { Card } from "../ui";

interface MapViewProps {
  properties: Property[];
  selectedProperty?: Property | null;
  onPropertySelect?: (property: Property | null) => void;
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

const TILE_SIZE = 256;
const MIN_ZOOM = 1;
const MAX_ZOOM = 19;
const MAX_LATITUDE = 85.05112878;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const clampLatitude = (lat: number) => clamp(lat, -MAX_LATITUDE, MAX_LATITUDE);

const normalizeLongitude = (lng: number) => {
  const normalized = (((lng + 180) % 360) + 360) % 360;
  return normalized - 180;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const formatPriceAmount = (value: unknown): string => {
  const amount = Number(value);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return safeAmount.toLocaleString("en-US");
};

const latLngToWorld = (lat: number, lng: number, zoom: number) => {
  const scale = 2 ** zoom;
  const safeLat = clampLatitude(lat);
  const safeLng = normalizeLongitude(lng);
  const x = ((safeLng + 180) / 360) * scale * TILE_SIZE;
  const sinLat = Math.sin((safeLat * Math.PI) / 180);
  const y =
    (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) *
    scale *
    TILE_SIZE;
  return { x, y };
};

const worldToLatLng = (x: number, y: number, zoom: number) => {
  const scale = 2 ** zoom;
  const lng = (x / (scale * TILE_SIZE)) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / (scale * TILE_SIZE);
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return {
    lat: clampLatitude(lat),
    lng: normalizeLongitude(lng),
  };
};

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
          ${formatPriceAmount(property.pricePerNight)}
        </div>

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
                    ({property.reviewCount ?? 0})
                  </span>
                </div>

                <div className="mt-2">
                  <span className="font-semibold text-gray-900">
                    ${formatPriceAmount(property.pricePerNight)}
                  </span>
                  <span className="text-sm text-gray-600"> / night</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close preview"
              >
                x
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
  center = { lat: 6.5244, lng: 3.3792 },
  zoom = 12,
  showFilters = true,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredProperty, setHoveredProperty] = useState<Property | null>(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(clamp(zoom, MIN_ZOOM, MAX_ZOOM));
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setMapCenter(center);
  }, [center]);

  useEffect(() => {
    setMapZoom(clamp(zoom, MIN_ZOOM, MAX_ZOOM));
  }, [zoom]);

  useEffect(() => {
    if (!mapRef.current || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) {
        return;
      }

      setMapSize({
        width: Math.max(1, Math.floor(rect.width)),
        height: Math.max(1, Math.floor(rect.height)),
      });
    });

    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isFullscreen]);

  const viewport = useMemo(() => {
    const width = Math.max(mapSize.width, 1);
    const height = Math.max(mapSize.height, 1);
    const centerWorld = latLngToWorld(mapCenter.lat, mapCenter.lng, mapZoom);
    const topLeftX = centerWorld.x - width / 2;
    const topLeftY = centerWorld.y - height / 2;

    return {
      width,
      height,
      topLeftX,
      topLeftY,
      centerWorld,
    };
  }, [mapCenter.lat, mapCenter.lng, mapSize.height, mapSize.width, mapZoom]);

  const mapTiles = useMemo(() => {
    const tileZoom = clamp(mapZoom, MIN_ZOOM, MAX_ZOOM);
    const worldTileCount = 2 ** tileZoom;
    const maxTileY = worldTileCount - 1;
    const startX = Math.floor(viewport.topLeftX / TILE_SIZE);
    const endX = Math.floor((viewport.topLeftX + viewport.width) / TILE_SIZE);
    const startY = Math.floor(viewport.topLeftY / TILE_SIZE);
    const endY = Math.floor((viewport.topLeftY + viewport.height) / TILE_SIZE);
    const tiles: Array<{
      id: string;
      left: number;
      top: number;
      url: string;
    }> = [];

    for (let y = startY; y <= endY; y += 1) {
      if (y < 0 || y > maxTileY) {
        continue;
      }

      for (let x = startX; x <= endX; x += 1) {
        const wrappedX =
          ((x % worldTileCount) + worldTileCount) % worldTileCount;
        tiles.push({
          id: `${tileZoom}-${x}-${y}`,
          left: x * TILE_SIZE - viewport.topLeftX,
          top: y * TILE_SIZE - viewport.topLeftY,
          url: `https://tile.openstreetmap.org/${tileZoom}/${wrappedX}/${y}.png`,
        });
      }
    }

    return tiles;
  }, [
    mapZoom,
    viewport.height,
    viewport.topLeftX,
    viewport.topLeftY,
    viewport.width,
  ]);

  const visibleProperties = useMemo(() => {
    return properties
      .map((property) => {
        const lat = toNumber(property.latitude);
        const lng = toNumber(property.longitude);
        if (lat === null || lng === null) {
          return null;
        }

        const world = latLngToWorld(lat, lng, mapZoom);
        const x = world.x - viewport.topLeftX;
        const y = world.y - viewport.topLeftY;
        if (x < 0 || y < 0 || x > viewport.width || y > viewport.height) {
          return null;
        }

        return {
          property,
          x,
          y,
        };
      })
      .filter(
        (
          marker,
        ): marker is {
          property: Property;
          x: number;
          y: number;
        } => Boolean(marker),
      );
  }, [
    mapZoom,
    properties,
    viewport.height,
    viewport.topLeftX,
    viewport.topLeftY,
    viewport.width,
  ]);

  const handlePropertyHover = (property: Property | null) => {
    setHoveredProperty(property);
    onPropertyHover?.(property);
  };

  const handlePropertyClick = (property: Property) => {
    onPropertySelect?.(property);
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const centerOnUserLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter({
          lat: clampLatitude(position.coords.latitude),
          lng: normalizeLongitude(position.coords.longitude),
        });
        setMapZoom((currentZoom) => Math.max(currentZoom, 14));
      },
      () => {
        // Keep existing center if geolocation fails.
      },
    );
  };

  const zoomIn = () => {
    setMapZoom((currentZoom) => clamp(currentZoom + 1, MIN_ZOOM, MAX_ZOOM));
  };

  const zoomOut = () => {
    setMapZoom((currentZoom) => clamp(currentZoom - 1, MIN_ZOOM, MAX_ZOOM));
  };

  const currentBounds = useMemo(() => {
    const northWest = worldToLatLng(
      viewport.topLeftX,
      viewport.topLeftY,
      mapZoom,
    );
    const southEast = worldToLatLng(
      viewport.topLeftX + viewport.width,
      viewport.topLeftY + viewport.height,
      mapZoom,
    );

    return {
      north: northWest.lat,
      west: northWest.lng,
      south: southEast.lat,
      east: southEast.lng,
    };
  }, [
    mapZoom,
    viewport.height,
    viewport.topLeftX,
    viewport.topLeftY,
    viewport.width,
  ]);

  return (
    <div
      className={`relative ${
        isFullscreen ? "fixed inset-0 z-50" : "h-96"
      } ${className}`}
    >
      <div
        ref={mapRef}
        className="w-full h-full bg-gray-200 rounded-lg overflow-hidden relative"
      >
        <div className="absolute inset-0">
          {mapTiles.map((tile) => (
            <img
              key={tile.id}
              src={tile.url}
              alt=""
              draggable={false}
              className="absolute select-none pointer-events-none"
              style={{
                left: tile.left,
                top: tile.top,
                width: TILE_SIZE,
                height: TILE_SIZE,
              }}
            />
          ))}
        </div>

        <div className="absolute top-4 right-4 z-20 space-y-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            aria-label={
              isFullscreen ? "Exit fullscreen map" : "Open fullscreen map"
            }
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
            aria-label="Center map on your location"
          >
            <Navigation className="h-4 w-4" />
          </button>
        </div>

        {visibleProperties.map(({ property, x, y }) => {
          const isSelected = selectedProperty?.id === property.id;
          const isHovered = hoveredProperty?.id === property.id;

          return (
            <div
              key={property.id}
              className="absolute"
              style={{
                left: x,
                top: y,
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

        <div className="absolute bottom-4 right-4 z-20">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <button
              onClick={zoomIn}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors border-b border-gray-200"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              onClick={zoomOut}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Zoom out"
            >
              -
            </button>
          </div>
        </div>

        {showFilters && (
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
        )}

        <div className="absolute bottom-2 right-2 z-10 bg-white/80 text-[10px] px-2 py-1 rounded">
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 hover:text-gray-900"
          >
            OpenStreetMap contributors
          </a>
        </div>
      </div>

      <AnimatePresence>
        {selectedProperty && (
          <PropertyPreviewCard
            property={selectedProperty}
            onClose={() => onPropertySelect?.(null)}
            onViewDetails={() => {
              window.location.href = `/guest/browse/${selectedProperty.id}`;
            }}
          />
        )}
      </AnimatePresence>

      {isFullscreen && (
        <div className="absolute top-4 left-4 z-40">
          <Card className="p-4 bg-white shadow-xl">
            <h2 className="text-lg font-semibold mb-1">Property Map</h2>
            <p className="text-sm text-gray-600">
              Zoom: {mapZoom} | Bounds: {currentBounds.north.toFixed(2)},
              {currentBounds.west.toFixed(2)} to{" "}
              {currentBounds.south.toFixed(2)},{currentBounds.east.toFixed(2)}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
};
