import type { Metadata } from "next";
import PageContent from "./pageContent";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const readableName = slug.replace(/-/g, " ");

  return {
    title: `${readableName} | Order List | Find Oklahoma Marijuana Dispensaries`,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PageContent business={slug} />;
}