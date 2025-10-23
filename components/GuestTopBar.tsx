'use client';

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";


export default function GuestTopBar() {
	const router = useRouter();
	
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
    <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
		<Link href="/home">
			<div className="flex items-center gap-2">
				<img
				src="/images/natures-high-logo.png"
				alt="Nature's High"
				className="h-9 w-9 rounded-full object-cover shadow-md"
				/>
				<span className="font-semibold">Nature's High</span>
			</div>
		</Link>
      <nav className="hidden items-center gap-6 text-sm text-slate-700 md:flex ml-auto">
        <Link className="hover:text-slate-900" href="/shop">
          Shop
        </Link>
        <Link className="hover:text-slate-900" href="/deals">
          Deals
        </Link>
        <Link className="hover:text-slate-900" href="/featured">
          Featured
        </Link>
        <Link className="hover:text-slate-900" href="/strains">
          Strains
        </Link>
        <Link className="hover:text-slate-900" href="/learn">
          Learn
        </Link>
      </nav>
      <div className="hidden md:flex items-center gap-4 ml-6">
        <Link href="/login" className="hover:text-slate-900 text-sm">
          Sign in
        </Link>
        <Link href="/register"
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Sign up
        </Link>
      </div>
    </div>
  </header>
  );
}
