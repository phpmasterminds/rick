// app/(guest)/[slug]/page.tsx
import { Metadata } from 'next';
import DispensaryDetailPage from './pageContent';
import { cookies } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Preivew Business | Find Oklahoma Marijuana Dispensaries`,
  };
}

export default async function Page() {
  const cookieStore = await cookies();
  const slug = cookieStore.get('vanity_url')?.value || '';
  
  return <DispensaryDetailPage slug={slug} />;
}