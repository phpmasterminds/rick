import type { Metadata } from "next";
import PageContent from "./pageContent"; 

export const metadata: Metadata = {
  title: "Contact Us - Nature's High",

  description:
    "Contact Nature's High - Get in touch with our team. Questions about our B2B cannabis marketplace? We're here to help.",

  keywords: [
    "contact Nature's High",
    "cannabis marketplace support",
    "wholesale cannabis contact",
  ],

  authors: [{ name: "Nature's High" }],

  openGraph: {
    title: "Contact Us - Nature's High",
    description:
      "Get in touch with our team. We're here to answer your questions about our cannabis wholesale marketplace.",
    type: "website",
    url: "https://natureshigh.com/contact",
  },
};

export default function Page() {
  return <PageContent />; 
}