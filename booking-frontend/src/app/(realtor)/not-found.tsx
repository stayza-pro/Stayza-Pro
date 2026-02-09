"use client";

import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export default function RealtorNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-7xl font-bold text-gray-200">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900">Page Not Found</h2>
        <p className="mt-2 text-gray-600">
          The page you requested does not exist on this realtor workspace.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>

          <Link
            href="/realtor/login"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-gray-700 font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
