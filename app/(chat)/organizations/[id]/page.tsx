import { auth } from '@/app/(auth)/auth';
import { getOrganizationById } from '@/lib/db/queries';
import { OrganizationEditClient } from '@/components/organization-edit-client';
import { notFound } from 'next/navigation';

interface OrganizationEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizationEditPage({ params }: OrganizationEditPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return <div>Unauthorized</div>;
  }

  const organization = await getOrganizationById(id, session.user.id);

  if (!organization) {
    notFound();
  }

  return <OrganizationEditClient organization={organization} />;
} 