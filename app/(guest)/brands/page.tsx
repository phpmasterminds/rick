import type { Metadata } from "next";
import PageContent from "./pageContent"; 

export const metadata: Metadata = {
  title: "For Brands - Nature's High",

  description:
    "Nature's High for Brands - Powerful wholesale tools for cannabis brands. Reach more retailers, manage orders efficiently, and grow your distribution network.",

  keywords: [
    "cannabis brands",
    "wholesale platform",
    "cannabis distribution",
    "B2B cannabis",
    "wholesale management",
  ],

  authors: [{ name: "Nature's High" }],

  openGraph: {
    title: "For Brands - Nature's High",
    description:
      "Grow your cannabis brand with powerful wholesale tools. Save thousands compared to competitors.",
    type: "website",
    url: "https://natureshigh.com/brands",
  },
};

export default function Page() {
  return <PageContent />; 
}