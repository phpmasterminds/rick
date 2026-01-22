import type { Metadata } from "next";
import PageContent from "./pageContent"; 

export const metadata: Metadata = {
  title: "Features - Nature's High",

  description:
    "Nature's High Features - Comprehensive B2B cannabis marketplace platform. Inventory management, order tracking, analytics, e-commerce pages, and more for wholesalers and retailers.",

  keywords: [
    "cannabis marketplace features",
    "B2B cannabis platform",
    "inventory management",
    "order tracking",
    "cannabis analytics",
    "e-commerce",
  ],

  authors: [{ name: "Nature's High" }],

  openGraph: {
    title: "Platform Features - Nature's High",
    description:
      "Discover powerful features for cannabis wholesalers and retailers. Complete platform for managing your wholesale business.",
    type: "website",
    url: "https://natureshigh.com/features",
  },
};

export default function Page() {
  return <PageContent />; 
}