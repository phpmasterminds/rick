import RegistrationPage from './pageContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Admin Registration Approval',
  description: 'Approve or reject business registrations',
};

export default async function AdminApprovalPage({ params }: PageProps) {
  const resolvedParams = await params;
  const registrationId = resolvedParams?.id;

  return <RegistrationPage registrationId={registrationId} />;
}