'use client';

import { useState, useEffect } from 'react';
import { Plus, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateOrganizationModal } from '@/components/create-organization-modal';

interface UserPermissions {
  canCreateOrganization: boolean;
  isMasterAdmin: boolean;
}

export function OrganizationsHeaderActions() {
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({
    canCreateOrganization: false,
    isMasterAdmin: false,
  });

  const fetchUserPermissions = async () => {
    try {
      const response = await fetch('/api/user/permissions');
      if (response.ok) {
        const permissions = await response.json();
        setUserPermissions(permissions);
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error);
    }
  };

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const handleTemplateClick = () => {
    window.dispatchEvent(new CustomEvent('organizations:template'));
  };

  const handleAIGenerateClick = () => {
    window.dispatchEvent(new CustomEvent('organizations:ai-generate'));
  };

  const handleNewOrganizationClick = () => {
    // Recarregar organizações após criar
    window.dispatchEvent(new CustomEvent('organizations:reload'));
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        onClick={handleTemplateClick}
        className="flex items-center gap-2"
      >
        <Sparkles className="h-4 w-4" />
        Usar Template
      </Button>
      <Button 
        onClick={handleAIGenerateClick}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Bot className="h-4 w-4" />
        Gerar com IA
      </Button>
      {userPermissions.canCreateOrganization && (
        <CreateOrganizationModal onCreateSuccess={handleNewOrganizationClick} />
      )}
    </div>
  );
} 