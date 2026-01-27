import type { Metadata } from "next";
import InventoryPageWrapper from "./page-wrapper";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Inventory | Find Oklahoma Marijuana Dispensaries`,
  };
}

export default function Page() {
  return <InventoryPageWrapper />;
}