"use client";

import React from "react";

interface GuestAuthShellProps {
  primaryColor: string;
  primaryDark: string;
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export function GuestAuthShell({
  primaryColor,
  primaryDark,
  leftPanel,
  rightPanel,
}: GuestAuthShellProps) {
  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-[40%] relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
        }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[length:48px_48px]" />
        <div className="relative flex flex-col justify-center px-12 xl:px-16 py-16 w-full">
          {leftPanel}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-md space-y-8">{rightPanel}</div>
      </div>
    </div>
  );
}

