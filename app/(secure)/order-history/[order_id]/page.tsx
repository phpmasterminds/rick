import type { Metadata } from "next";
import PageContent from "./pageContent";
import { cookies } from "next/headers";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ order_id: string }> 
}): Promise<Metadata> {
  const { order_id } = await params;
  
  return {
    title: ` Order #${order_id} | Find Oklahoma Marijuana Dispensaries`,
    description: `View order details for order #${order_id}`,
  };
}

export default async function Page({ 
  params 
}: { 
  params: Promise<{ order_id: string }> 
}) {
  const { order_id } = await params;
  const cookieStore = await cookies();
  const slug = cookieStore.get('vanity_url')?.value || '';
  
  return <PageContent business={slug} orderId={order_id} />;
}