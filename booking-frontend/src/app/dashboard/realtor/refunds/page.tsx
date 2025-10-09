"use client";

import React from "react";
import { RefundManagement } from "@/components";

// Force dynamic rendering since this page uses authentication
export const dynamic = "force-dynamic";

export default function RealtorRefundsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <RefundManagement userRole="REALTOR" />
    </div>
  );
}
