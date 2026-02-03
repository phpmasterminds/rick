import { cookies } from "next/headers";
import UserPermissionPageWrapper from "./page-wrapper";

export async function generateMetadata() {
  return { title: `Users Permission` };
}

export default async function Page() {
  const cookieStore = await cookies();
  const slug = cookieStore.get('vanity_url')?.value || '';
  
  // ✅ Pass to wrapper
  return <UserPermissionPageWrapper business={slug} />;
}