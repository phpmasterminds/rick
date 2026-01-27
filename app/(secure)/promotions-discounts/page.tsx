import { cookies } from "next/headers";
import OrderPageWrapper from "./page-wrapper";

export async function generateMetadata() {
  return { title: `Promotions and Discounts | Find Oklahoma Marijuana Dispensaries`, };
}

export default async function Page() {
  // ✅ Pass to wrapper
  return <OrderPageWrapper/>;
}