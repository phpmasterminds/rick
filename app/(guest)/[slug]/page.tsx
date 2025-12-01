// app/(guest)/[slug]/page.tsx
import { Metadata } from 'next';
import DispensaryDetailPage from './pageContent';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  const formattedName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return {
    title: `${formattedName} | Nature's High`,
    description: `View menu, hours, reviews and more for ${formattedName}`,
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <DispensaryDetailPage slug={slug} />;
}