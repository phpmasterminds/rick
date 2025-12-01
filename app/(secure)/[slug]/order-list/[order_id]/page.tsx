import type { Metadata } from "next";
import PageContent from "./pageContent";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string; order_id: string }> 
}): Promise<Metadata> {
  const { slug, order_id } = await params;
  const readableName = slug.replace(/-/g, " ");
  
  return {
    title: `${readableName} | Order #${order_id} | Find Oklahoma Marijuana Dispensaries`,
    description: `View order details for order #${order_id}`,
  };
}

export default async function Page({ 
  params 
}: { 
  params: Promise<{ slug: string; order_id: string }> 
}) {
  const { slug, order_id } = await params;
  
  return <PageContent business={slug} orderId={order_id} />;
}