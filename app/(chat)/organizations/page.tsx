import { auth } from '@/app/(auth)/auth';
import { OrganizationsPageClient } from '@/components/organizations-page-client';

export default async function OrganizationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return <div>Unauthorized</div>;
  }

  return <OrganizationsPageClient />;
} 