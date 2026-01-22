import type { Metadata } from "next";
import PageContent from "./pageContent"; 

export const metadata: Metadata = {
  title: "Privacy Policy - Nature's High",

  description:
    "Nature's High Privacy Policy - How we collect, use, and protect your personal information on our B2B cannabis marketplace.",
	
  authors: [{ name: "Nature's High" }],
};

export default function Page() {
  return <PageContent />; 
}