/**
 * Example: Realtor Subdomain Homepage
 *
 * This page is served when accessing a realtor's subdomain:
 * - anderson-properties.stayza.pro
 * - anderson-properties.localhost:3000 (development)
 *
 * Place this at: src/app/[subdomain]/page.tsx (if using dynamic routes)
 * Or use middleware rewriting to serve from specific route
 */

import { Metadata } from "next";
import { headers } from "next/headers";
import { getSubdomainFromHeaders, getTenantType } from "@/utils/subdomain";

interface RealtorHomeProps {
  params: {
    subdomain: string;
  };
}

// Server-side data fetching
async function getRealtorData(subdomain: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

  try {
    const response = await fetch(
      `${apiUrl}/api/realtors/subdomain/${subdomain}`,
      {
        cache: "no-store", // or 'force-cache' with revalidation
      }
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch realtor data:", error);
    return null;
  }
}

async function getRealtorProperties(realtorId: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

  try {
    const response = await fetch(
      `${apiUrl}/api/properties/realtor/${realtorId}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Failed to fetch properties:", error);
    return [];
  }
}

// Generate metadata dynamically
export async function generateMetadata({
  params,
}: RealtorHomeProps): Promise<Metadata> {
  const { subdomain } = params;
  const realtorData = await getRealtorData(subdomain);

  if (!realtorData) {
    return {
      title: "Realtor Not Found",
    };
  }

  const businessName =
    realtorData.data.businessName || realtorData.data.user.fullName;

  return {
    title: `${businessName} - Property Listings`,
    description:
      realtorData.data.businessDescription ||
      `Browse properties from ${businessName}`,
    openGraph: {
      title: `${businessName} - Property Listings`,
      description: realtorData.data.businessDescription,
      images: realtorData.data.businessLogo
        ? [realtorData.data.businessLogo]
        : [],
    },
  };
}

export default async function RealtorHomePage({ params }: RealtorHomeProps) {
  const { subdomain } = params;
  const headersList = headers();
  const tenantType = getTenantType(headersList);

  // Fetch realtor data
  const realtorData = await getRealtorData(subdomain);

  if (!realtorData || !realtorData.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Realtor Not Found</h1>
          <p className="text-gray-600 mb-8">
            The subdomain "{subdomain}" does not correspond to any registered
            realtor.
          </p>
          <a
            href="https://stayza.pro"
            className="text-blue-600 hover:underline"
          >
            Go to Main Platform
          </a>
        </div>
      </div>
    );
  }

  const realtor = realtorData.data;
  const properties = await getRealtorProperties(realtor.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Realtor Header/Banner */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-6">
            {realtor.businessLogo && (
              <img
                src={realtor.businessLogo}
                alt={realtor.businessName}
                className="w-24 h-24 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {realtor.businessName || realtor.user.fullName}
              </h1>
              {realtor.businessDescription && (
                <p className="mt-2 text-gray-600">
                  {realtor.businessDescription}
                </p>
              )}
              <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                {realtor.businessPhone && (
                  <span>📞 {realtor.businessPhone}</span>
                )}
                {realtor.businessAddress && (
                  <span>📍 {realtor.businessAddress}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold mb-6">Available Properties</h2>

        {properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No properties available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property: any) => (
              <a
                key={property.id}
                href={`/property/${property.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
                <img
                  src={property.images?.[0] || "/placeholder-property.jpg"}
                  alt={property.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">
                    {property.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {property.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-600 font-bold">
                      ₦{property.pricePerNight?.toLocaleString()}/night
                    </span>
                    <span className="text-sm text-gray-500">
                      {property.city}, {property.state}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === "development" && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-gray-100 p-4 rounded">
            <p className="text-sm font-mono">
              Subdomain: {subdomain} | Tenant: {tenantType} | Realtor ID:{" "}
              {realtor.id}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
