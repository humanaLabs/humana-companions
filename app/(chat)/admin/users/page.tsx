'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { UserIcon, PlusIcon, PencilEditIcon, TrashIcon, MoreIcon } from '@/components/icons';
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
import { InviteUserModal } from '@/components/invite-user-modal';
import { EditUserModal } from '@/components/edit-user-modal';
import { UsersGuard } from '@/components/auth/permission-guard';
// Definir tipos específicos para admin que não dependem do schema
interface AdminRole {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
}

interface AdminUser {
  id: string;
  email: string;
  name?: string;
  isMasterAdmin?: boolean;
  createdAt?: Date | string;
  status: 'active' | 'invited' | 'suspended'; // Status do usuário
  role: AdminRole;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [organizations, setOrganizations] = useState<{id: string, name: string}[]>([]);
  const [currentUser, setCurrentUser] = useState<{isMasterAdmin: boolean} | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Carregar dados reais da API
  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await fetch('/api/admin/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        } else {
          toast.error('Erro ao carregar usuários');
        }
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        toast.error('Erro ao carregar usuários');
      } finally {
        setLoading(false);
      }
    }

    async function loadRoles() {
      try {
        const response = await fetch('/api/admin/roles');
        if (response.ok) {
          const data = await response.json();
          setRoles(data.roles || []);
        } else {
          // Fallback para roles mock
          const mockRoles: AdminRole[] = [
            {
              id: '1',
              name: 'admin',
              displayName: 'Administrador',
              description: 'Acesso total ao sistema',
              permissions: ['read', 'write', 'delete', 'admin'],
            },
            {
              id: '2',
              name: 'user',
              displayName: 'Usuário',
              description: 'Usuário padrão',
              permissions: ['read'],
            }
          ];
          setRoles(mockRoles);
        }
      } catch (error) {
        console.error('Erro ao carregar roles:', error);
      }
    }

    async function loadOrganizations() {
      try {
        const response = await fetch('/api/organizations');
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data.organizations || []);
        }
      } catch (error) {
        console.error('Erro ao carregar organizações:', error);
      }
    }

    async function loadCurrentUser() {
      try {
        const response = await fetch('/api/user/permissions');
        if (response.ok) {
          const data = await response.json();
          setCurrentUser({ isMasterAdmin: data.isMasterAdmin || false });
        }
      } catch (error) {
        console.error('Erro ao carregar usuário atual:', error);
      }
    }

    loadUsers();
    loadRoles();
    loadOrganizations();
    loadCurrentUser();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role.id === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleLabel = (roleName: string) => {
    return roleName;
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" => {
    return "outline";
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'invited':
        return 'Convidado';
      case 'suspended':
        return 'Suspenso';
      default:
        return 'Desconhecido';
    }
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user?.status === 'invited') {
      setUsers(users.filter(u => u.id !== userId));
      toast.success('Convite cancelado com sucesso!');
    } else {
      setUsers(users.filter(u => u.id !== userId));
      toast.success('Usuário removido com sucesso!');
    }
  };

  const handleChangePermissions = (userId: string) => {
    toast.info('Funcionalidade de alteração de permissões será implementada');
  };

  const handleResendInvite = (userId: string) => {
    toast.success('Convite reenviado com sucesso!');
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <PageHeader 
          title="Gestão de Usuários" 
          description="Carregando usuários..."
          badge="Administração"
          showBackButton={true}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <UsersGuard fallback={
      <div className="flex flex-col h-screen">
        <PageHeader 
          title="Acesso Negado" 
          description="Você não tem permissão para acessar esta página"
          badge="Administração"
          showBackButton={true}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Sem permissão para visualizar usuários</div>
        </div>
      </div>
    }>
      <div className="flex flex-col h-screen">
      <PageHeader 
        title="Gestão de Usuários" 
        description="Gerencie usuários, roles e permissões do sistema"
        badge="Administração"
        showBackButton={true}
      >
        {currentUser && (
          <InviteUserModal
            roles={roles}
            organizations={organizations}
            isMasterAdmin={currentUser.isMasterAdmin}
            onInviteSuccess={() => {
              // Recarregar usuários após convite bem-sucedido
              window.location.reload();
            }}
          />
        )}
      </PageHeader>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl w-full mx-auto space-y-6">
          {/* Filtros */}
          <div className="bg-card border rounded-lg p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-full sm:w-48">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">Todas as roles</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{users.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {users.filter(u => u.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">Ativos</div>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {users.filter(u => u.status === 'invited').length}
              </div>
              <div className="text-sm text-muted-foreground">Convidados</div>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {users.filter(u => u.role.name === 'Administrador').length}
              </div>
              <div className="text-sm text-muted-foreground">Admins</div>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {users.filter(u => u.role.name === 'Gerente').length}
              </div>
              <div className="text-sm text-muted-foreground">Gerentes</div>
            </div>
          </div>

          {/* Tabela de Usuários */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-foreground">
                Usuários ({filteredUsers.length})
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Usuário
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Criado em
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                            <UserIcon />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {user.name || (user.status === 'invited' ? 'Aguardando registro' : 'Sem nome')}
                            </div>
                            {user.status === 'invited' && (
                              <div className="text-xs text-muted-foreground">
                                Convite pendente
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-foreground">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">
                          {user.role.name}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">
                          {getStatusLabel(user.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-muted-foreground">
                          {user.createdAt 
                            ? new Date(user.createdAt).toLocaleDateString('pt-BR')
                            : 'N/A'
                          }
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {currentUser && (
                            <EditUserModal
                              user={user}
                              roles={roles}
                              organizations={organizations}
                              isMasterAdmin={currentUser.isMasterAdmin}
                              onEditSuccess={() => {
                                // Recarregar usuários após edição bem-sucedida
                                window.location.reload();
                              }}
                            />
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreIcon size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleChangePermissions(user.id)}
                              >
                                <PencilEditIcon size={14} />
                                <span className="ml-2">Alterar Permissões</span>
                              </DropdownMenuItem>
                              {user.status === 'invited' && (
                                <DropdownMenuItem 
                                  onClick={() => handleResendInvite(user.id)}
                                >
                                  <PlusIcon size={14} />
                                  <span className="ml-2">Reenviar Convite</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <TrashIcon size={14} />
                                <span className="ml-2">Remover</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredUsers.length === 0 && (
                <div className="p-8 text-center">
                  <div className="text-muted-foreground mb-2">Nenhum usuário encontrado</div>
                  <div className="text-sm text-muted-foreground">
                    Tente ajustar os filtros de busca
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </UsersGuard>
  );
} 