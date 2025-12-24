import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  // TODO: Implement Google Places Autocomplete API integration
  return NextResponse.json({
    predictions: [],
    message: "Places autocomplete not yet implemented",
  });
}
