import type { Metadata } from "next";
import PageContent from "./pageContent";
import { cookies } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Buy Again | Find Oklahoma Marijuana Dispensaries`,
  };
}

export default async function Page() {
	const cookieStore = await cookies();
  const slug = cookieStore.get('vanity_url')?.value || '';
  
  return <PageContent business={slug}/>;
}