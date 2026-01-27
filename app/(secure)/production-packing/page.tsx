import type { Metadata } from "next";
import { cookies } from "next/headers";
import ProductionPackagingPageWrapper from "./page-wrapper";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Production & Packing | Find Oklahoma Marijuana Dispensaries`,
  };
}

export default function Page() {
  return <ProductionPackagingPageWrapper />;
}