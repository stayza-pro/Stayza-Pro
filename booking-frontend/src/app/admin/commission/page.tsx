"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminNavigation } from "@/components/admin/AdminNavigation";

export default function CommissionPageCompat() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/settings?tab=finance");
  }, [router]);

  return (
    <>
      <AdminNavigation />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Finance Settings Moved
            </h1>
            <p className="mt-3 text-gray-600">
              Commission and fee controls now live in Admin Settings under the Finance tab.
            </p>
            <Link
              href="/admin/settings?tab=finance"
              className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Open Finance Settings
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
