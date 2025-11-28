"use client";

import React, { useState } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  showSidebar = false,
  showHeader = true,
  showFooter = true,
  className = "",
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showHeader && (
        <GuestHeader
          currentPage="profile"
          searchPlaceholder="Search location..."
        />
      )}

      <div className="flex flex-1">
        {showSidebar && (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        <main className={`flex-1 ${showSidebar ? "lg:ml-0" : ""} ${className}`}>
          {showSidebar && (
            <div className="lg:hidden p-4 border-b border-gray-200 bg-white">
              <button
                onClick={toggleSidebar}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <span className="text-sm font-medium">Menu</span>
              </button>
            </div>
          )}

          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>

      {showFooter && <Footer />}
    </div>
  );
};
