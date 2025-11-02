"use client";

// SmartInput has been removed in favor of regular inputs across the
// registration flow. This file remains as a lightweight compatibility
// shim that renders a plain input so any lingering imports don't break
// the build. Remove this file entirely if you're certain no imports
// remain.

import React from "react";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function SmartInput(props: Props) {
  const { label, className = "", ...rest } = props;
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        {...rest}
        className={`w-full px-3 py-2 border rounded-md text-black ${
          (rest as any).disabled ? "bg-gray-50 text-gray-500" : ""
        }`}
      />
    </div>
  );
}
