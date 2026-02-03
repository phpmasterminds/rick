import type { Metadata } from "next";
import DashboardPageWrapper from "./page-wrapper";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Dashboard | Find Oklahoma Marijuana Dispensaries`,
  };
}

export default function Page() {
  return <DashboardPageWrapper />;
}