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
import type { User, Role } from '@/lib/db/schema';

interface UserWithRole extends User {
  role: Role;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Mock data para demonstração
  useEffect(() => {
    const mockUsers: UserWithRole[] = [
      {
        id: '1',
        email: 'admin@humana.com',
        name: 'Administrador Sistema',
        image: null,
        roleId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: {
          id: '1',
          name: 'Administrador',
          description: 'Acesso total ao sistema',
          permissions: ['read', 'write', 'delete', 'admin'],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      },
      {
        id: '2',
        email: 'gerente@humana.com',
        name: 'Maria Silva',
        image: null,
        roleId: '2',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: {
          id: '2',
          name: 'Gerente',
          description: 'Gerenciamento de equipes',
          permissions: ['read', 'write'],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      },
      {
        id: '3',
        email: 'usuario@humana.com',
        name: 'João Santos',
        image: null,
        roleId: '3',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: {
          id: '3',
          name: 'Usuário',
          description: 'Usuário padrão',
          permissions: ['read'],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
    ];

    const mockRoles: Role[] = [
      {
        id: '1',
        name: 'Administrador',
        description: 'Acesso total ao sistema',
        permissions: ['read', 'write', 'delete', 'admin'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Gerente',
        description: 'Gerenciamento de equipes',
        permissions: ['read', 'write'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'Usuário',
        description: 'Usuário padrão',
        permissions: ['read'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    setUsers(mockUsers);
    setRoles(mockRoles);
    setLoading(false);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.roleId === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'administrador':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'gerente':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'usuário':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
    toast.success('Usuário removido com sucesso!');
  };

  const handleEditUser = (userId: string) => {
    toast.info('Funcionalidade de edição será implementada');
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
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Gestão de Usuários" 
        description="Gerencie usuários, roles e permissões do sistema"
        badge="Administração"
        showBackButton={true}
      >
        <Button className="flex items-center gap-2">
          <PlusIcon size={16} />
          Novo Usuário
        </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{users.length}</div>
              <div className="text-sm text-muted-foreground">Total de Usuários</div>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {users.filter(u => u.role.name === 'Administrador').length}
              </div>
              <div className="text-sm text-muted-foreground">Administradores</div>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {users.filter(u => u.role.name === 'Gerente').length}
              </div>
              <div className="text-sm text-muted-foreground">Gerentes</div>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {users.filter(u => u.role.name === 'Usuário').length}
              </div>
              <div className="text-sm text-muted-foreground">Usuários</div>
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
                              {user.name || 'Sem nome'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-foreground">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge 
                          variant="outline" 
                          className={getRoleBadgeColor(user.role.name)}
                        >
                          {user.role.name}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-muted-foreground">
                          {user.createdAt.toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user.id)}
                            className="h-8 w-8 p-0"
                          >
                            <PencilEditIcon size={14} />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreIcon size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleEditUser(user.id)}
                              >
                                <PencilEditIcon size={14} className="mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600"
                              >
                                <TrashIcon size={14} className="mr-2" />
                                Excluir
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
  );
} 