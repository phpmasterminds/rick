import type { Metadata } from "next";
import { cookies } from "next/headers";
import PageContent from "./pageContent";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Order History | Find Oklahoma Marijuana Dispensaries`,
  };
}

export default async function Page() {
  const cookieStore = await cookies();
  const slug = cookieStore.get('vanity_url')?.value || '';

  return <PageContent business={slug} />;
}