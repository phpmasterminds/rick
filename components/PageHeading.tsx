"use client";

import { useBusinessData } from "../app/contexts/BusinessContext";

interface PageHeadingProps {
  pageName: string;
  description?: string;
}

export default function PageHeading({
  pageName,
  description,
}: PageHeadingProps) {
  const { businessData } = useBusinessData();

  // Get title from context (already fetched by Sidebar)
  const businessTitle = businessData?.title || "";
  
  const fullTitle = businessTitle
    ? `${businessTitle} - ${pageName}`
    : pageName;

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {fullTitle}
      </h1>
      {description && (
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      )}
    </div>
  );
}