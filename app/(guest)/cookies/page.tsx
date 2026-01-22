import type { Metadata } from "next";
import PageContent from "./pageContent"; 

export const metadata: Metadata = {
  title: "Cookies - Nature's High",

  description:
    "Nature's High Cookies Service - Legal terms and conditions for using our B2B cannabis wholesale marketplace platform.",
	
  authors: [{ name: "Nature's High" }],
};

export default function Page() {
  return <PageContent />; 
}