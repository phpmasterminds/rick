import type { Metadata } from "next";
import ReportsPageWrapper from "./page-wrapper";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Reports | Find Oklahoma Marijuana Dispensaries`,
  };
}

export default function Page() {
  return <ReportsPageWrapper />;
}