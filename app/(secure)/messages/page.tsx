import type { Metadata } from "next";
import MessagesPageWrapper from "./page-wrapper";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Messages | Find Oklahoma Marijuana Dispensaries`,
  };
}

export default function Page() {
  return <MessagesPageWrapper />;
}