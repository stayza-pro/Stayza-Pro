"use client";

import { useAuth } from "@/context/AuthContext";
import { useAuthStore } from "@/store/authStore";

export default function AuthDebugPage() {
  const contextAuth = useAuth();
  const storeAuth = useAuthStore();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Info</h1>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold mb-4">AuthContext</h2>
          <pre className="bg-gray-50 p-4 rounded overflow-auto">
            {JSON.stringify(
              {
                isAuthenticated: contextAuth.isAuthenticated,
                user: contextAuth.user,
                isLoading: contextAuth.isLoading,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold mb-4">AuthStore</h2>
          <pre className="bg-gray-50 p-4 rounded overflow-auto">
            {JSON.stringify(
              {
                isAuthenticated: storeAuth.isAuthenticated,
                user: storeAuth.user,
                hasAccessToken: !!storeAuth.accessToken,
                hasRefreshToken: !!storeAuth.refreshToken,
                isLoading: storeAuth.isLoading,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold mb-4">LocalStorage</h2>
          <pre className="bg-gray-50 p-4 rounded overflow-auto">
            {typeof window !== "undefined"
              ? JSON.stringify(
                  {
                    accessToken:
                      localStorage.getItem("accessToken")?.substring(0, 20) +
                      "...",
                    refreshToken:
                      localStorage.getItem("refreshToken")?.substring(0, 20) +
                      "...",
                  },
                  null,
                  2
                )
              : "Server side"}
          </pre>
        </div>

        {!contextAuth.isAuthenticated && (
          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-yellow-900 mb-2">
              ⚠️ Not Authenticated
            </h3>
            <p className="text-yellow-800 mb-4">
              You need to log in as a realtor to access the dashboard.
            </p>
            <a
              href="/login"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Login
            </a>
          </div>
        )}

        {contextAuth.isAuthenticated &&
          contextAuth.user?.role !== "REALTOR" && (
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-red-900 mb-2">
                ❌ Wrong Role
              </h3>
              <p className="text-red-800">
                You are logged in as {contextAuth.user?.role}, but you need
                REALTOR role.
              </p>
            </div>
          )}

        {contextAuth.isAuthenticated &&
          contextAuth.user?.role === "REALTOR" && (
            <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-green-900 mb-2">
                ✅ Authenticated as Realtor
              </h3>
              <p className="text-green-800">
                Welcome {contextAuth.user.firstName} {contextAuth.user.lastName}
                !
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
