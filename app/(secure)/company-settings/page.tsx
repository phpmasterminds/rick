import { cookies } from "next/headers";
import type { Metadata } from "next";
import CompanyprofilePageWrapper from "./page-wrapper";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Company Settings Page | Find Oklahoma Marijuana Dispensaries`,
  };
}

export default async function Page() {
	const cookieStore = await cookies();
  const slug = cookieStore.get('vanity_url')?.value || '';
  
  // ✅ Pass to wrapper
  return <CompanyprofilePageWrapper business={slug} />;
}