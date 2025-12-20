import type { Metadata } from "next";
import PageContent from "./pageContent";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Customer List | Find Oklahoma Marijuana Dispensaries`,
  };
}

export default async function Page() {
  return <PageContent />;
}