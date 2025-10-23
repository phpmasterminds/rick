import type { Metadata } from "next";
import PageContent from "./pageContent"; // ✅ correct import

export const metadata: Metadata = {
  title: "Find Oklahoma Marijuana Dispensaries and Products.",
  description: "Locate Oklahoma Marijuana Dispensaries Providing Quality Oklahoma Marijuana Brand Products.",
  keywords: ["oklahoma dispensaries, oklahoma city, tulsa, medical marijuana, omma, ok dispensary, , oklahoma, dispensaries, dispensary, marijuana products, growers, brands, processors"],
};

export default function Page() {
  return <PageContent />; // ✅ capitalized component name
}
