import type { Metadata } from "next";
import PageContent from "./pageContent"; 

export const metadata: Metadata = {
  title: "About Us - Nature's High",

  description:
    "About Nature's High - Cannabis industry pioneers since the late 90s. Innovators in wholesale marketplace solutions, METRC compliance, and cannabis business support services.",

  keywords: [
    "cannabis pioneers",
    "cannabis industry",
    "METRC compliance",
    "cannabis marketplace",
    "cannabis history",
  ],

  authors: [{ name: "Nature's High" }],

  openGraph: {
    title: "About Us - Nature's High",
    description:
      "Pioneering cannabis industry solutions since the late 90s. Our mission: helping businesses navigate the ever-changing cannabis landscape.",
    type: "website",
    url: "https://natureshigh.com/about",
  },
};

export default function Page() {
  return <PageContent />; 
}