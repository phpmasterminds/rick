import { cookies } from "next/headers";
import OrderPageWrapper from "./page-wrapper";

export async function generateMetadata() {
  return { title: `Order List | Find Oklahoma...` };
}

export default async function Page() {
  const cookieStore = await cookies();
  const slug = cookieStore.get('vanity_url')?.value || '';
  
  // ✅ Pass to wrapper
  return <OrderPageWrapper business={slug} />;
}