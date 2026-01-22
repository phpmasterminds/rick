import type { Metadata } from "next";
import PageContent from "./pageContent"; 

export const metadata: Metadata = {
  title: "Pricing - Nature's High",

  description:
    "Nature's High Pricing - Affordable B2B cannabis marketplace. Free trials, flexible plans, partner agreements, and advertising opportunities.",

  keywords: [
    "cannabis marketplace pricing",
    "wholesale cannabis pricing",
    "B2B cannabis platform cost",
    "cannabis advertising",
  ],

  authors: [{ name: "Nature's High" }],

  openGraph: {
    title: "Pricing - Nature's High",
    description:
      "Save thousands compared to competitors. Flexible pricing, free trials, and custom solutions for your cannabis business.",
    type: "website",
    url: "https://natureshigh.com/pricing",
  },
};

export default function Page() {
  return <PageContent />; 
}