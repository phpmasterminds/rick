"use client";

import { useState } from "react";
import GuestTopBar from "@/components/GuestTopBar";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GuestTopBar/>
      {children}
    </>
  );
}