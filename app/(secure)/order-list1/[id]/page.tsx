import type { Metadata } from "next";
import PageContent from "./pageContent";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string; id: string }> 
}): Promise<Metadata> {
  const { slug, id } = await params;
  const readableName = slug.replace(/-/g, " ");
  
  return {
    title: `${readableName} | Order #${id} | Find Oklahoma Marijuana Dispensaries`,
    description: `View order details for order #${id}`,
  };
}

export default async function Page({ 
  params 
}: { 
  params: Promise<{ slug: string; id: string }> 
}) {
  const { slug, id } = await params;
  
  return <PageContent business={slug} orderId={id} />;
}