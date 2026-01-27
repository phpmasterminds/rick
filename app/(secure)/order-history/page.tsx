import { cookies } from "next/headers";
import OrderPageWrapper from "./page-wrapper";

export async function generateMetadata() {
  return { title: `Order History | Find Oklahoma Marijuana Dispensaries`, };
}

export default async function Page() {
  const cookieStore = await cookies();
  const slug = cookieStore.get('vanity_url')?.value || '';
  const typeid = cookieStore.get('type_id')?.value || '';
  
  // ✅ Pass to wrapper
  return <OrderPageWrapper business={slug} typeid={typeid} />;
}