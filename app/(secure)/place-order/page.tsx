import type { Metadata } from "next";
import PlaceOrder from "./pageContent";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `PlaceOrder | Find Oklahoma Marijuana Dispensaries`,
  };
}

export default async function Page() {
  return <PlaceOrder/>;
}