import type { Metadata } from "next";
import PageContent from "./pageContent";

export async function generateMetadata({ params }: { params: Promise<{ business: string }> }): Promise<Metadata> {
  const { business } = await params;
  const readableName = business.replace(/-/g, " ");

  return {
    title: `${readableName} | Wholesale Order | Find Oklahoma Marijuana Dispensaries`,
  };
}

export default async function Page({ params }: { params: Promise<{ business: string }> }) {
  const { business } = await params;
  return <PageContent business={business} />;
}