"use client";

import React, { createContext, useContext, ReactNode } from "react";

interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  muted: string;
}

interface BrandConfig {
  colors: BrandColors;
  logo?: string;
  businessName: string;
  slug: string;
}

interface BrandContextType {
  brand: BrandConfig;
  getCSSVariables: () => Record<string, string>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

interface BrandProviderProps {
  children: ReactNode;
  brand: BrandConfig;
}

export function BrandProvider({ children, brand }: BrandProviderProps) {
  const getCSSVariables = () => {
    return {
      "--color-primary": brand.colors.primary,
      "--color-secondary": brand.colors.secondary,
      "--color-accent": brand.colors.accent,
      "--color-success": brand.colors.success,
      "--color-warning": brand.colors.warning,
      "--color-danger": brand.colors.danger,
      "--color-muted": brand.colors.muted,
    };
  };

  return (
    <BrandContext.Provider value={{ brand, getCSSVariables }}>
      <div style={getCSSVariables() as React.CSSProperties}>{children}</div>
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
}
