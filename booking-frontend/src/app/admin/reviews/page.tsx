"use client";

import React from "react";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { ReviewManagementDashboard } from "@/components/review/ReviewManagementDashboard";

export default function AdminReviewsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <main className="px-4 pb-10 pt-20 sm:px-6 lg:px-8">
        <ReviewManagementDashboard scope="admin" />
      </main>
    </div>
  );
}
