"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";
import { ShopCartProvider } from "../contexts/ShopCartContext";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShopCartProvider>
		
      <TopBar/>
      {children}
    </ShopCartProvider>
  );
}