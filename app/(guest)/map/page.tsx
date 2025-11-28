import { Suspense } from "react";
import DispensaryMapPage from "./pageContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dispensary",
  description: "Locate Oklahoma Marijuana Dispensaries Providing Quality Oklahoma Marijuana Brand Products.",
  keywords: ["oklahoma dispensaries, oklahoma city, tulsa, medical marijuana, omma, ok dispensary, , oklahoma, dispensaries, dispensary, marijuana products, growers, brands, processors"],
};

export default function Page() {
  return (
    <Suspense fallback={<div>Loading map...</div>}>
      <DispensaryMapPage />
    </Suspense>
  );
}
