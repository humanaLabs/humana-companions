'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, Briefcase, Target } from 'lucide-react';
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

  useEffect(() => {
    const handleTemplate = () => setShowTemplateSelector(true);
    const handleAIGenerate = () => setShowAIGenerator(true);
    const handleNew = () => setShowForm(true);

    window.addEventListener('organizations:template', handleTemplate);
    window.addEventListener('organizations:ai-generate', handleAIGenerate);
    window.addEventListener('organizations:new', handleNew);

    return () => {
      window.removeEventListener('organizations:template', handleTemplate);
      window.removeEventListener('organizations:ai-generate', handleAIGenerate);
      window.removeEventListener('organizations:new', handleNew);
    };
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
    <div className="p-6">
        {/* Dashboard Organizações */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">
                {userPermissions.isMasterAdmin ? 'Total Organizações' : 'Suas Organizações'}
              </span>
            </div>
            <p className="text-2xl font-bold mt-1">{organizations.length}</p>
            <p className="text-sm text-muted-foreground">cadastradas</p>
          </div>
          
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Equipes</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {organizations.reduce((acc, org) => acc + (org.teams?.length || 0), 0)}
            </p>
            <p className="text-sm text-muted-foreground">criadas</p>
          </div>
          
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Posições</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {organizations.reduce((acc, org) => acc + (org.positions?.length || 0), 0)}
            </p>
            <p className="text-sm text-muted-foreground">definidas</p>
          </div>
          
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Valores</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {organizations.reduce((acc, org) => acc + (org.values?.length || 0), 0)}
            </p>
            <p className="text-sm text-muted-foreground">estabelecidos</p>
          </div>
        </div>

        <OrganizationsList
          organizations={organizations}
          onEdit={() => {}} // Navegação é feita diretamente na lista
          onDelete={handleOrganizationDeleted}
          isMasterAdmin={userPermissions.isMasterAdmin}
        />

        <OrganizationTemplateSelector
          isOpen={showTemplateSelector}
          onClose={() => setShowTemplateSelector(false)}
          onTemplateSelected={handleTemplateSelected}
        />

        {showAIGenerator && (
          <AIOrganizationGenerator
            onClose={() => setShowAIGenerator(false)}
            onOrganizationCreated={handleOrganizationCreated}
          />
        )}

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