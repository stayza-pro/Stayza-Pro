"use client";

import React from "react";
import { AdminNavigation } from "./AdminNavigation";

interface AdminPageLayoutProps {
  children: React.ReactNode;
}

export function AdminPageLayout({ children }: AdminPageLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      <AdminNavigation />
      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
