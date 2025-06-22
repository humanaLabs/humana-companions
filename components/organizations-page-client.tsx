'use client';

import { useEffect, useState } from 'react';
import { Plus, Bot, Building2, Users, Briefcase, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrganizationsList } from './organizations-list';
import { OrganizationForm } from './organization-form';
import { AIOrganizationGenerator } from './ai-organization-generator';
import { OrganizationTemplateSelector } from './organization-template-selector';
import type { OrganizationStructure } from '@/lib/types';

interface UserPermissions {
  canCreateOrganization: boolean;
  isMasterAdmin: boolean;
}

export function OrganizationsPageClient() {
  const [organizations, setOrganizations] = useState<OrganizationStructure[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({
    canCreateOrganization: false,
    isMasterAdmin: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templateData, setTemplateData] = useState<any>(null);

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

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchUserPermissions(),
      fetchOrganizations()
    ]);
  }, []);

  const handleOrganizationCreated = (newOrganization: OrganizationStructure) => {
    setOrganizations(prev => [newOrganization, ...prev]);
    setShowForm(false);
    setShowAIGenerator(false);
    setTemplateData(null);
  };

  const handleOrganizationDeleted = (deletedId: string) => {
    setOrganizations(prev => prev.filter(org => org.id !== deletedId));
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setTemplateData(null);
  };

  const handleTemplateSelected = (template: any, metadata: any) => {
    setTemplateData({ template, metadata });
    setShowTemplateSelector(false);
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
          <p className="mt-2 text-muted-foreground">Carregando organizações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Organization Designer</h1>
          {userPermissions.isMasterAdmin && (
            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
              Master Admin
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-lg">
          {userPermissions.isMasterAdmin 
            ? "Gerencie todas as organizações do sistema e crie novas estruturas organizacionais."
            : "Gerencie suas organizações e crie estruturas organizacionais completas."
          }
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            <span className="font-medium">
              {userPermissions.isMasterAdmin ? 'Total Organizações' : 'Suas Organizações'}
            </span>
          </div>
          <p className="text-2xl font-bold mt-1">{organizations.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            <span className="font-medium">Equipes</span>
          </div>
          <p className="text-2xl font-bold mt-1">
            {organizations.reduce((acc, org) => acc + (org.teams?.length || 0), 0)}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-purple-500" />
            <span className="font-medium">Posições</span>
          </div>
          <p className="text-2xl font-bold mt-1">
            {organizations.reduce((acc, org) => acc + (org.positions?.length || 0), 0)}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            <span className="font-medium">Valores</span>
          </div>
          <p className="text-2xl font-bold mt-1">
            {organizations.reduce((acc, org) => acc + (org.values?.length || 0), 0)}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <Button 
          onClick={() => setShowTemplateSelector(true)}
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Usar Template
        </Button>
        <Button 
          onClick={() => setShowAIGenerator(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Bot className="h-4 w-4" />
          Gerar com IA
        </Button>
        {userPermissions.canCreateOrganization && (
          <Button 
            variant="outline"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Organização
          </Button>
        )}
      </div>

      {/* Organizations List */}
      <OrganizationsList
        organizations={organizations}
        onEdit={() => {}} // Não usado mais, a navegação é feita diretamente na lista
        onDelete={handleOrganizationDeleted}
        isMasterAdmin={userPermissions.isMasterAdmin}
      />

      {/* Template Selector */}
      <OrganizationTemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onTemplateSelected={handleTemplateSelected}
      />

      {/* AI Generator Modal */}
      {showAIGenerator && (
        <AIOrganizationGenerator
          onClose={() => setShowAIGenerator(false)}
          onOrganizationCreated={handleOrganizationCreated}
        />
      )}

      {/* Organization Form Modal - para criação ou com template */}
      {showForm && (
        <OrganizationForm
          organization={null}
          templateData={templateData}
          onClose={handleCloseForm}
          onSave={handleOrganizationCreated}
        />
      )}
    </div>
  );
} 