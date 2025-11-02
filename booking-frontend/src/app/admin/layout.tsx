"use client";

import React from "react";
import { usePathname } from "next/navigation";
import ProtectedRouteWrapper from "../../components/auth/ProtectedRouteWrapper";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Pages that don't require authentication
  const publicPages = ["/admin/login", "/admin/register"];
  const isPublicPage = publicPages.includes(pathname);

  // If it's a public page (login/register), render without protection
  if (isPublicPage) {
    return <>{children}</>;
  }

  // For all other admin pages, require authentication but no wrapper layout
  return (
    <ProtectedRouteWrapper requiredRole="ADMIN" redirectTo="/admin/login">
      {children}
    </ProtectedRouteWrapper>
  );
}
