import type { Metadata } from "next";
import CompanyprofilePageWrapper from "./page-wrapper";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Company Settings Page | Find Oklahoma Marijuana Dispensaries`,
  };
}

export default function Page() {
  return <CompanyprofilePageWrapper />;
}