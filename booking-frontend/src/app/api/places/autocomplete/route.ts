import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

/**
 * GET /api/places/autocomplete
 * Location autocomplete using free Photon API (OpenStreetMap)
 * No API key required, completely free
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query =
      searchParams.get("query") ||
      searchParams.get("q") ||
      searchParams.get("input");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    // Call Photon API (free, no API key needed)
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      query
    )}&limit=5&lang=en`;

    const response = await fetch(photonUrl);

    if (!response.ok) {
      throw new Error(`Photon API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform Photon response to match expected format
    const predictions = data.features.map((feature: any) => {
      const props = feature.properties;
      const parts = [];

      // Build description from available properties
      if (props.name) parts.push(props.name);
      if (props.street) parts.push(props.street);
      if (props.city) parts.push(props.city);
      else if (props.county) parts.push(props.county);
      if (props.state) parts.push(props.state);
      if (props.country) parts.push(props.country);

      return {
        description: parts.filter(Boolean).join(", "),
        place_id: feature.properties.osm_id?.toString() || "",
        structured_formatting: {
          main_text: props.name || props.street || props.city || "",
          secondary_text: [props.city, props.state, props.country]
            .filter(Boolean)
            .join(", "),
        },
        // Include coordinates for mapping
        geometry: {
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0],
        },
        // Include full details
        details: {
          city: props.city || props.county || "",
          state: props.state || "",
          country: props.country || "",
          postcode: props.postcode || "",
          street: props.street || "",
          housenumber: props.housenumber || "",
        },
      };
    });

    return NextResponse.json({
      predictions,
      status: "OK",
    });
  } catch (error: any) {
    console.error("Autocomplete API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch location suggestions",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
