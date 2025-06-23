'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  UserCheck, 
  Bot, 
  RefreshCw,
  Download,
  Network,
  TreePine
} from 'lucide-react';

interface OrganizationVisualizerProps {
  userId: string;
}

interface OrganizationData {
  organizations: Array<{
    id: string;
    name: string;
    description: string;
    values: any;
    teams: any;
    positions: any;
    orgUsers: any;
    tenantConfig: any;
    createdAt: Date;
    updatedAt: Date;
  }>;
  companions: Array<{
    id: string;
    name: string;
    role: string;
    responsibilities: any;
    expertises: any;
    sources: any;
    rules: any;
    contentPolicy: any;
    skills: any;
    fallbacks: any;
    organizationId: string | null;
    positionId: string | null;
    linkedTeamId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export function OrganizationVisualizer({ userId }: OrganizationVisualizerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OrganizationData | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/experimental/organization-data');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        if (result.data.organizations.length > 0) {
          setSelectedOrg(result.data.organizations[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportData = useCallback(() => {
    if (!data) return;
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'organization-hierarchy.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedOrgData = data?.organizations.find(org => org.id === selectedOrg);
  const orgCompanions = data?.companions.filter(comp => comp.organizationId === selectedOrg) || [];

  return (
    <div className="flex h-full">
      {/* Painel lateral */}
      <div className="w-80 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold mb-4">Controles</h2>
          
          <div className="space-y-2">
            <Button
              onClick={loadData}
              disabled={isLoading}
              className="w-full justify-start"
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Recarregar Dados
            </Button>
            
            <Button
              onClick={exportData}
              disabled={!data}
              className="w-full justify-start"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar JSON
            </Button>
          </div>
        </div>

        {data && (
          <div className="p-4 border-b">
            <h3 className="text-sm font-medium mb-3">Estatísticas</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted p-2 rounded">
                <div className="font-medium">Organizações</div>
                <div className="text-muted-foreground">{data.organizations.length}</div>
              </div>
              <div className="bg-muted p-2 rounded">
                <div className="font-medium">Companions</div>
                <div className="text-muted-foreground">{data.companions.length}</div>
              </div>
              <div className="bg-muted p-2 rounded">
                <div className="font-medium">Vinculados</div>
                <div className="text-muted-foreground">
                  {data.companions.filter(c => c.organizationId).length}
                </div>
              </div>
              <div className="bg-muted p-2 rounded">
                <div className="font-medium">Independentes</div>
                <div className="text-muted-foreground">
                  {data.companions.filter(c => !c.organizationId).length}
                </div>
              </div>
            </div>
          </div>
        )}

        {data && data.organizations.length > 0 && (
          <div className="p-4 border-b">
            <h3 className="text-sm font-medium mb-3">Organizações</h3>
            <div className="space-y-2">
              {data.organizations.map(org => (
                <button
                  key={org.id}
                  onClick={() => setSelectedOrg(org.id)}
                  className={`w-full text-left p-2 rounded text-xs transition-colors ${
                    selectedOrg === org.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <div className="font-medium">{org.name}</div>
                  <div className={`text-xs ${
                    selectedOrg === org.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {data.companions.filter(c => c.organizationId === org.id).length} companions
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Área principal */}
      <div className="flex-1 p-6 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center h-full">
            <Card className="p-6 text-center">
              <Network className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum dado encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Crie uma organização primeiro para visualizar a hierarquia.
              </p>
              <Button variant="outline" onClick={loadData}>
                Tentar novamente
              </Button>
            </Card>
          </div>
        ) : selectedOrgData ? (
          <div className="space-y-6">
            {/* Header da Organização */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">{selectedOrgData.name}</h1>
                  <p className="text-muted-foreground mb-4">{selectedOrgData.description}</p>
                  
                  {selectedOrgData.values && Array.isArray(selectedOrgData.values) && (
                    <div className="flex flex-wrap gap-2">
                      {selectedOrgData.values.map((value: any, index: number) => (
                        <Badge key={index} variant="secondary">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Estrutura Hierárquica */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Equipes */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Equipes</h3>
                </div>
                
                {selectedOrgData.teams && Array.isArray(selectedOrgData.teams) ? (
                  <div className="space-y-3">
                    {selectedOrgData.teams.map((team: any, index: number) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="font-medium">
                          {typeof team === 'object' && team.name ? team.name : `Equipe ${index + 1}`}
                        </div>
                        {typeof team === 'object' && team.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {String(team.description)}
                          </div>
                        )}
                        {typeof team === 'object' && team.members && Array.isArray(team.members) && (
                          <div className="text-xs text-muted-foreground mt-2">
                            {team.members.length} membros
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhuma equipe definida</p>
                )}
              </Card>

              {/* Posições */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <UserCheck className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">Posições</h3>
                </div>
                
                {selectedOrgData.positions && Array.isArray(selectedOrgData.positions) ? (
                  <div className="space-y-3">
                    {selectedOrgData.positions.map((position: any, index: number) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="font-medium">
                          {typeof position === 'object' && position.title ? position.title : `Posição ${index + 1}`}
                        </div>
                        {typeof position === 'object' && position.department && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {String(position.department)}
                          </div>
                        )}
                        {typeof position === 'object' && position.level && (
                          <Badge variant="outline" className="mt-2">
                            {String(position.level)}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhuma posição definida</p>
                )}
              </Card>
            </div>

            {/* Companions Vinculados */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold">Companions Vinculados</h3>
                <Badge variant="secondary">{orgCompanions.length}</Badge>
              </div>
              
              {orgCompanions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orgCompanions.map(companion => (
                    <div key={companion.id} className="p-4 bg-muted rounded-lg">
                      <div className="font-medium mb-2">{companion.name}</div>
                      <div className="text-sm text-muted-foreground mb-3">{companion.role}</div>
                      
                      {companion.positionId && (
                        <div className="text-xs text-muted-foreground mb-2">
                          Posição: {String(companion.positionId)}
                        </div>
                      )}
                      
                      {companion.linkedTeamId && (
                        <div className="text-xs text-muted-foreground mb-2">
                          Equipe: {String(companion.linkedTeamId)}
                        </div>
                      )}
                      
                      {companion.expertises && Array.isArray(companion.expertises) && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {companion.expertises.slice(0, 3).map((expertise: any, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {expertise.area || expertise}
                            </Badge>
                          ))}
                          {companion.expertises.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{companion.expertises.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Nenhum companion vinculado a esta organização</p>
              )}
            </Card>

            {/* Companions Independentes */}
            {data.companions.filter(c => !c.organizationId).length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold">Companions Independentes</h3>
                  <Badge variant="secondary">
                    {data.companions.filter(c => !c.organizationId).length}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.companions
                    .filter(c => !c.organizationId)
                    .map(companion => (
                      <div key={companion.id} className="p-4 bg-muted rounded-lg">
                        <div className="font-medium mb-2">{companion.name}</div>
                        <div className="text-sm text-muted-foreground mb-3">{companion.role}</div>
                        
                        {companion.expertises && Array.isArray(companion.expertises) && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {companion.expertises.slice(0, 3).map((expertise: any, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {expertise.area || expertise}
                              </Badge>
                            ))}
                            {companion.expertises.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{companion.expertises.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Card className="p-6 text-center">
              <TreePine className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Selecione uma Organização</h3>
              <p className="text-muted-foreground">
                Escolha uma organização no painel lateral para visualizar sua hierarquia.
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 