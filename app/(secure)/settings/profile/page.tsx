import type { Metadata } from "next";
import ProfilePageWrapper from "./page-wrapper";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Profile | Find Oklahoma Marijuana Dispensaries`,
  };
}

export default function Page() {
  return <ProfilePageWrapper />;
}