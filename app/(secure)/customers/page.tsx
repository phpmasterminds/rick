import type { Metadata } from "next";
import CustomerPageWrapper from "./page-wrapper";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Customer List | Find Oklahoma Marijuana Dispensaries`,
  };
}

export default function Page() {
  return <CustomerPageWrapper />;
}