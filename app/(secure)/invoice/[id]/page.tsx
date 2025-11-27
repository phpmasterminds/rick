import type { Metadata } from "next";
import PageContent from "./pageContent";

export async function generateMetadata({ params }: { params: Promise<{ business: string }> }): Promise<Metadata> {
  return {
    title: `Invoice | Find Oklahoma Marijuana Dispensaries`,
  };
}

export default async function Page({ params }: { params: Promise<{ business: string }> }) {
  return <PageContent />;
}