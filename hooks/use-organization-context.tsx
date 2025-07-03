'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface Organization {
  id: string;
  name: string;
  description?: string;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  switchOrganization: (organizationId: string) => void;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const { data: session, status } = useSession();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrganizations = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/organizations');
      
      console.log('🔍 Fetching organizations:', {
        userId: session.user.id,
        responseStatus: response.status,
        responseOk: response.ok
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
        
        console.log('✅ Organizations loaded successfully:', {
          count: data.organizations?.length || 0,
          organizations: data.organizations?.map((o: any) => ({ id: o.id, name: o.name })) || [],
          responseData: data
        });
        
        // Se não há organização atual mas há organizações disponíveis, selecionar a primeira
        if (!currentOrganization && data.organizations?.length > 0) {
          setCurrentOrganization(data.organizations[0]);
          console.log('🔧 Setting current organization to:', data.organizations[0]);
        }
      } else {
        console.error('❌ Failed to fetch organizations:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching organizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchOrganization = async (organizationId: string) => {
    const org = organizations.find(o => o.id === organizationId);
    if (!org) {
      console.error('Organization not found:', organizationId);
      return;
    }

    try {
      console.log('🔄 Starting organization switch to:', organizationId);
      
      // 1. Definir cookie imediatamente pelo lado do cliente
      document.cookie = `selected-organization-id=${organizationId}; Path=/; SameSite=Lax; Max-Age=2592000`;
      console.log('🍪 Cookie set on client side');
      
      // 2. Atualizar estado local
      setCurrentOrganization(org);
      localStorage.setItem('current-organization-id', organizationId);
      console.log('💾 LocalStorage updated');

      // 3. Chamar API de switching para Master Admins (para logs e validação)
      const response = await fetch('/api/organizations/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Organization switch API successful:', data);
      } else {
        const error = await response.json();
        console.warn('⚠️ API switch failed but continuing with client-side switch:', error);
      }
      
      // 4. Recarregar a página para aplicar o novo contexto organizacional
      console.log('🔄 Reloading page to apply new context...');
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Error switching organization:', error);
      
      // Fallback: garantir que pelo menos o cookie e localStorage estão definidos
      document.cookie = `selected-organization-id=${organizationId}; Path=/; SameSite=Lax; Max-Age=2592000`;
      setCurrentOrganization(org);
      localStorage.setItem('current-organization-id', organizationId);
      window.location.reload();
    }
  };

  const refreshOrganizations = async () => {
    await fetchOrganizations();
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchOrganizations();
    }
  }, [session, status]);

  useEffect(() => {
    // Tentar recuperar organização ativa de múltiplas fontes
    if (organizations.length > 0) {
      // 1. Primeiro, tentar do cookie
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('selected-organization-id='))
        ?.split('=')[1];
      
      // 2. Fallback: localStorage
      const savedOrgId = cookieValue || localStorage.getItem('current-organization-id');
      
      if (savedOrgId) {
        const savedOrg = organizations.find(o => o.id === savedOrgId);
        if (savedOrg) {
          console.log('🔧 Restoring organization from storage:', {
            source: cookieValue ? 'cookie' : 'localStorage',
            orgId: savedOrgId,
            orgName: savedOrg.name
          });
          setCurrentOrganization(savedOrg);
          return;
        }
      }
      
      // 3. Se não encontrou nada, usar a primeira organização disponível
      if (!currentOrganization) {
        console.log('🔧 Setting default organization:', organizations[0]);
        setCurrentOrganization(organizations[0]);
      }
    }
  }, [organizations]);

  const value: OrganizationContextType = {
    currentOrganization,
    organizations,
    isLoading,
    switchOrganization,
    refreshOrganizations,
  };

  // DEBUG TEMPORÁRIO: Log do valor retornado
  console.log('🔧 OrganizationProvider value:', {
    currentOrganizationId: currentOrganization?.id,
    organizationsCount: organizations.length,
    isLoading,
    userEmail: session?.user?.email
  });

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider');
  }
  return context;
}

/**
 * Hook simplificado para apenas obter a organização atual
 */
export function useCurrentOrganization() {
  const { currentOrganization, isLoading } = useOrganizationContext();
  return { currentOrganization, isLoading };
} 