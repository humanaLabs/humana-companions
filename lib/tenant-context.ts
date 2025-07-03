import { headers } from 'next/headers';
import { auth } from '@/app/(auth)/auth';

/**
 * Gets the organization ID from the request headers
 * This is injected by the tenant middleware
 * FALLBACK: Para Master Admins, tenta obter da sessão se não estiver nos headers
 */
export async function getOrganizationId(): Promise<string | null> {
  try {
    const headersList = await headers();
    const organizationId = headersList.get('x-organization-id');

    if (!organizationId) {
      console.warn('🚨 No organization ID found in headers');
      
      // SOLUÇÃO TEMPORÁRIA: Fallback para Master Admins
      try {
        const session = await auth();
        if (session?.user?.isMasterAdmin) {
          const fallbackOrganizationId = session.user.organizationId || '00000000-0000-0000-0000-000000000003';
          console.log('🔧 Tenant Context - Master Admin fallback:', fallbackOrganizationId);
          return fallbackOrganizationId;
        }
      } catch (authError) {
        console.error('Error getting session for fallback:', authError);
      }
      
      return null;
    }

    return organizationId;
  } catch (error) {
    console.error('Error getting organization ID from headers:', error);
    return null;
  }
}

/**
 * Gets the user ID from the request headers
 */
export async function getUserId(): Promise<string | null> {
  try {
    const headersList = await headers();
    return headersList.get('x-user-id');
  } catch (error) {
    console.error('Error getting user ID from headers:', error);
    return null;
  }
}

/**
 * Gets the user type from the request headers
 */
export async function getUserType(): Promise<'guest' | 'regular' | null> {
  try {
    const headersList = await headers();
    const userType = headersList.get('x-user-type');
    return userType as 'guest' | 'regular' | null;
  } catch (error) {
    console.error('Error getting user type from headers:', error);
    return null;
  }
}

/**
 * Gets the user email from the request headers
 */
export async function getUserEmail(): Promise<string | null> {
  try {
    const headersList = await headers();
    return headersList.get('x-user-email');
  } catch (error) {
    console.error('Error getting user email from headers:', error);
    return null;
  }
}

