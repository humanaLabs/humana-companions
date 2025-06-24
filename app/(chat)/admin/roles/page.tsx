'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { LockIcon, PlusIcon, PencilEditIcon, TrashIcon, MoreIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

// Definir tipos específicos para roles admin
interface Permission {
  resource: string;
  action: string;
  conditions?: {
    own_only?: boolean;
    organization_only?: boolean;
    team_only?: boolean;
  };
}

interface AdminRole {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
  userCount: number;
  createdAt?: Date | string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);

  // Carregar dados reais da API
  useEffect(() => {
    async function loadRoles() {
      try {
        const response = await fetch('/api/admin/roles');
        if (response.ok) {
          const data = await response.json();
          setRoles(data.roles || []);
        } else if (response.status === 403) {
          toast.error('Acesso negado. Apenas Master Admin pode gerenciar roles.');
          // Redirecionar para admin dashboard
          window.location.href = '/admin';
        } else {
          toast.error('Erro ao carregar roles');
        }
      } catch (error) {
        console.error('Erro ao carregar roles:', error);
        toast.error('Erro ao carregar roles');
      } finally {
        setLoading(false);
      }
    }

    async function checkMasterAdmin() {
      try {
        const response = await fetch('/api/user/permissions');
        if (response.ok) {
          const data = await response.json();
          setIsMasterAdmin(data.isMasterAdmin || false);
          if (!data.isMasterAdmin) {
            toast.error('Acesso negado. Apenas Master Admin pode acessar esta página.');
            window.location.href = '/admin';
            return;
          }
        }
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        window.location.href = '/admin';
        return;
      }
    }

    checkMasterAdmin().then(() => {
      loadRoles();
    });
  }, []);

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPermissionLevel = (action: string) => {
    switch (action) {
      case 'manage':
        return 'Gerenciar';
      case 'create':
      case 'write':
        return 'Criar';
      case 'read':
      case 'view':
        return 'Visualizar';
      default:
        return action;
    }
  };

  const getConditionText = (permission: Permission) => {
    if (permission.conditions?.own_only) return 'Próprio';
    if (permission.conditions?.organization_only) return 'Organização';
    if (permission.conditions?.team_only) return 'Time';
    return 'Global';
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystemRole) {
      toast.error('Não é possível excluir roles do sistema');
      return;
    }
    if (role?.userCount && role.userCount > 0) {
      toast.error(`Não é possível excluir role com ${role.userCount} usuários associados`);
      return;
    }
    setRoles(roles.filter(r => r.id !== roleId));
    toast.success('Role removida com sucesso!');
  };

  const handleEditRole = (roleId: string) => {
    toast.info('Modal de edição de role será implementado');
  };

  const handleCreateRole = () => {
    toast.info('Modal de criação de role será implementado');
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <PageHeader 
          title="Gestão de Roles" 
          description="Carregando..."
          badge="Master Admin"
          showBackButton={true}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!isMasterAdmin) {
    return (
      <div className="flex flex-col h-screen">
        <PageHeader 
          title="Acesso Negado" 
          description="Apenas Master Admin pode acessar esta página"
          badge="Erro"
          showBackButton={true}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 text-muted-foreground">
              <LockIcon size={48} />
            </div>
            <div className="text-lg font-semibold text-foreground mb-2">Acesso Restrito</div>
            <div className="text-muted-foreground">Esta página é acessível apenas para Master Admin</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Gestão de Roles" 
        description="Defina roles customizadas e suas permissões por menu/objeto"
        badge="Master Admin"
        showBackButton={true}
      >
        <Button className="flex items-center gap-2" onClick={handleCreateRole}>
          <PlusIcon size={16} />
          Nova Role
        </Button>
      </PageHeader>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl w-full mx-auto space-y-6">
          {/* Filtros */}
          <div className="bg-card border rounded-lg p-4">
            <Input
              placeholder="Buscar roles por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md"
            />
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{roles.length}</div>
              <div className="text-sm text-muted-foreground">Total de Roles</div>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {roles.filter(r => r.isSystemRole).length}
              </div>
              <div className="text-sm text-muted-foreground">Roles do Sistema</div>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {roles.filter(r => !r.isSystemRole).length}
              </div>
              <div className="text-sm text-muted-foreground">Roles Customizadas</div>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {roles.reduce((sum, role) => sum + role.userCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Usuários Associados</div>
            </div>
          </div>

          {/* Lista de Roles */}
          <div className="space-y-4">
            {filteredRoles.map((role) => (
              <div key={role.id} className="bg-card border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">
                      <LockIcon size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{role.displayName}</h3>
                        {role.isSystemRole && (
                          <Badge variant="outline">
                            Sistema
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{role.userCount} usuários</span>
                        <span>•</span>
                        <span>{role.permissions.length} permissões</span>
                        {role.createdAt && (
                          <>
                            <span>•</span>
                            <span>
                              {new Date(role.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreIcon size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditRole(role.id)}>
                        <PencilEditIcon size={14} />
                        <span className="ml-2">Editar Permissões</span>
                      </DropdownMenuItem>
                      {!role.isSystemRole && (
                        <DropdownMenuItem 
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <TrashIcon size={14} />
                          <span className="ml-2">Excluir Role</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Permissões */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Permissões</span>
                    <Badge variant="outline" className="text-xs">
                      {role.permissions.length}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {role.permissions.slice(0, 9).map((permission, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
                        <span className="font-medium text-foreground">{permission.resource}</span>
                        <Badge variant="outline">
                          {getPermissionLevel(permission.action)}
                        </Badge>
                        <span className="text-muted-foreground">
                          ({getConditionText(permission)})
                        </span>
                      </div>
                    ))}
                    {role.permissions.length > 9 && (
                      <div className="flex items-center justify-center p-2 bg-muted/30 rounded text-xs text-muted-foreground">
                        +{role.permissions.length - 9} mais
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredRoles.length === 0 && (
            <div className="bg-card border rounded-lg p-8 text-center">
              <div className="mx-auto mb-4 text-muted-foreground">
                <LockIcon size={48} />
              </div>
              <div className="text-muted-foreground mb-2">Nenhuma role encontrada</div>
              <div className="text-sm text-muted-foreground mb-4">
                {searchTerm ? 'Tente ajustar os filtros de busca' : 'Crie sua primeira role customizada'}
              </div>
              {!searchTerm && (
                <Button onClick={handleCreateRole}>
                  <PlusIcon size={16} />
                  Criar Role
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 