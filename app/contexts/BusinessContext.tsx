"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface BusinessData {
  type_id: string;
  vanity_url: string;
  title: string;
  image_path?: string;
  [key: string]: any;
}

interface BusinessContextType {
  businessData: BusinessData | null;
  setBusinessData: (data: BusinessData | null) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);

  return (
    <BusinessContext.Provider value={{ businessData, setBusinessData }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessData() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error("useBusinessData must be used within BusinessProvider");
  }
  return context;
}