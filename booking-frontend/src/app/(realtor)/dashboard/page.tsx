"use client";

import React from "react";
import { RealtorDashboard } from "@/components/dashboard/RealtorDashboard";

export default function RealtorDashboardPage() {
  // ProtectedRoute in layout handles:
  // - Token restoration from URL
  // - Authentication checks
  // - Role validation
  // Just render the dashboard component
  return <RealtorDashboard />;
}
