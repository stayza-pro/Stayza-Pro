"use client";

import React from "react";
import dynamic from "next/dynamic";
import { RefreshCw } from "lucide-react";

// Dynamically import the actual page content to avoid SSR issues with QueryClient
const RefundRequestsContent = dynamic(() => import("./RefundRequestsContent"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-50 min-h-screen">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
        <p className="text-gray-600">Loading refund requests...</p>
      </div>
    </div>
  ),
});

export default function RefundRequestsPage() {
  return <RefundRequestsContent />;
}
