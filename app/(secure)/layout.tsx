// ✅ COPY THIS ENTIRE FILE INTO YOUR app/(secure)/layout.tsx

'use client';

import React, { useState, ReactNode } from "react";

import { ShopCartProvider } from "../contexts/ShopCartContext";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";


interface SecureLayoutProps {
  children: ReactNode;
}

export default function SecureLayout({ children }: SecureLayoutProps) {
	const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <ShopCartProvider>
      <div className="flex h-screen overflow-hidden">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
	  
        <TopBar isMobileOpen={false} setIsMobileOpen={() => {}} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      </div>
    </ShopCartProvider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 
// KEY CHANGES:
// 1. Added: import { ShopCartProvider } from "../contexts/ShopCartContext";
// 2. Wrapped everything with: <ShopCartProvider>
// 3. This allows all child components to use useShopCart() hook
//
// ═══════════════════════════════════════════════════════════════════════════════