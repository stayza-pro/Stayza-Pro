import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { dimensions: string[] } }
) {
  const { dimensions } = params;

  let width = 400;
  let height = 300;

  if (dimensions && dimensions.length >= 2) {
    width = parseInt(dimensions[0]) || 400;
    height = parseInt(dimensions[1]) || 300;
  } else if (dimensions && dimensions.length === 1) {
    const dim = parseInt(dimensions[0]) || 400;
    width = dim;
    height = dim;
  }

  // Generate SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle" dy=".3em">
        ${width} × ${height}
      </text>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000",
    },
  });
}
