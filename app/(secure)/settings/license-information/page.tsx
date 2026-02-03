import type { Metadata } from "next";
import LicenseInfoPageWrapper from "./page-wrapper";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `LicenseInformation | Find Oklahoma Marijuana Dispensaries`,
  };
}

export default function Page() {
  return <LicenseInfoPageWrapper />;
}