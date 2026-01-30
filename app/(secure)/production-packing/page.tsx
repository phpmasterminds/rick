import type { Metadata } from "next";
import { cookies } from "next/headers";
import ProductionPackagingPageWrapper from "./page-wrapper";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Production & Packing | Find Oklahoma Marijuana Dispensaries`,
  };
}

export default async function Page() {
	const cookieStore = await cookies();
  const slug = cookieStore.get('vanity_url')?.value || '';
  
  return <ProductionPackagingPageWrapper business={slug} />;
}