// ✅ FIXED: Sidebar is now INSIDE BusinessProvider
'use client';
import React, { useState, ReactNode } from "react";
import { ShopCartProvider } from "../contexts/ShopCartContext";
import { BusinessProvider } from "../contexts/BusinessContext";
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
      <BusinessProvider>  {/* ✅ MOVED: Wraps everything now */}
        <div className="flex h-screen overflow-hidden">
          {/* ✅ Sidebar is now INSIDE BusinessProvider */}
          <Sidebar
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar 
              isMobileOpen={isMobileOpen} 
              setIsMobileOpen={setIsMobileOpen} 
            />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </BusinessProvider>  {/* ✅ Closing tag */}
    </ShopCartProvider>
  );
}