import type { Metadata } from "next";
import PageContent from "./pageContent"; 

export const metadata: Metadata = {
  title: "For Retailers - Nature's High",

  description:
    "Nature's High for Retailers - Source premium cannabis products from licensed brands. Simplify ordering, discover new products, and save on wholesale costs.",

  keywords: [
    "cannabis retailers",
    "dispensary wholesale",
    "cannabis products",
    "B2B cannabis marketplace",
    "wholesale ordering",
  ],

  authors: [{ name: "Nature's High" }],

  openGraph: {
    title: "For Retailers - Nature's High",
    description:
      "Discover and order premium cannabis products from licensed brands. Simple ordering, competitive pricing, nationwide access.",
    type: "website",
    url: "https://natureshigh.com/retailers",
  },
};

export default function Page() {
  return <PageContent />; 
}