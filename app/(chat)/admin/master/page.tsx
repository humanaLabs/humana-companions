'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { UserIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface MasterUser {
  id: string;
  email: string;
  isMasterAdmin: boolean;
  createdAt: string;
  lastLogin?: string;
}

export default function MasterAdminPage() {
  const [users, setUsers] = useState<MasterUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Carregar usuários e verificar permissões
  useEffect(() => {
    let isMounted = true;
    let hasLoaded = false; // Prevenir múltiplas chamadas
    
    async function loadData() {
      if (hasLoaded || !isMounted) return;
      hasLoaded = true;
      
      try {
        console.log('🚀 Iniciando carregamento dos dados...');
        
        // Verificar se é Master Admin
        const permissionsResponse = await fetch('/api/user/permissions');
        console.log('📊 Response permissions:', permissionsResponse.status);
        
        if (!isMounted) return;
        
        if (permissionsResponse.ok) {
          const permissionsData = await permissionsResponse.json();
          console.log('🔑 Permissions data:', permissionsData);
          
          setIsMasterAdmin(permissionsData.isMasterAdmin || false);
          setCurrentUserId(permissionsData.userId || '');
          
          if (!permissionsData.isMasterAdmin) {
            console.log('❌ Usuário não é Master Admin, redirecionando...');
            toast.error('Acesso negado. Apenas Master Admin pode acessar esta página.');
            setTimeout(() => {
              window.location.href = '/admin';
            }, 1500);
            return;
          }
        } else {
          console.error('❌ Erro ao verificar permissões:', permissionsResponse.status);
          toast.error('Erro ao verificar permissões');
          return;
        }
        
        // Carregar usuários
        console.log('📥 Carregando usuários...');
        const usersResponse = await fetch('/api/admin/master-users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('📊 Response users:', usersResponse.status);
        
        if (!isMounted) return;
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          console.log(`✅ Users data recebido: ${usersData.users?.length || 0} usuários`);
          setUsers(usersData.users || []);
        } else {
          console.error('❌ Erro ao carregar usuários:', usersResponse.status);
          toast.error('Erro ao carregar usuários');
        }
      } catch (error) {
        console.error('💥 Erro ao carregar dados:', error);
        if (isMounted) {
          toast.error('Erro ao carregar dados');
        }
      } finally {
        console.log('🏁 Finalizando carregamento...');
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    // Delay pequeno para evitar múltiplas chamadas simultâneas
    const timeoutId = setTimeout(loadData, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleMasterAdmin = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUserId) {
      toast.error('Você não pode alterar seu próprio status de Master Admin.');
      return;
    }

    try {
      const response = await fetch('/api/admin/master-users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          isMasterAdmin: !currentStatus,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, isMasterAdmin: !currentStatus }
            : user
        ));
        
        const action = !currentStatus ? 'promovido para' : 'removido de';
        toast.success(`Usuário ${action} Master Admin com sucesso!`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar usuário');
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <PageHeader 
          title="Administração Master" 
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
            <div className="mx-auto mb-4 text-red-500 text-5xl">
              🔒
            </div>
            <div className="text-lg font-semibold text-foreground mb-2">Acesso Ultra Restrito</div>
            <div className="text-muted-foreground">Esta página é acessível apenas para Master Admin</div>
          </div>
        </div>
      </div>
    );
  }

  const masterAdmins = filteredUsers.filter(user => user.isMasterAdmin);
  const regularUsers = filteredUsers.filter(user => !user.isMasterAdmin);

  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Administração Master" 
        description="Gerencie usuários com privilégios de Master Admin"
        badge="Master Admin"
        showBackButton={true}
      >
        <div className="flex items-center gap-2">
          👑 <span className="text-sm text-muted-foreground">Máximo Privilégio</span>
        </div>
      </PageHeader>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl w-full mx-auto space-y-6">
          
          {/* Aviso de Segurança */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 text-xl mt-0.5">⚠️</span>
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1">⚠️ Área de Máxima Segurança</h3>
                <p className="text-sm text-yellow-700">
                  Esta área permite conceder ou revogar privilégios de <strong>Master Admin</strong>. 
                  Use com extrema cautela. Master Admins têm acesso total ao sistema.
                </p>
              </div>
            </div>
          </div>

          {/* Aviso de Limitação */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 text-xl mt-0.5">ℹ️</span>
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">📊 Escopo de Visualização</h3>
                <p className="text-sm text-blue-700">
                  <strong>Master Admin:</strong> Vê todos os usuários de todas as organizações (limitado a 50).<br/>
                  <strong>Admin de Organização:</strong> Vê apenas usuários da própria organização.<br/>
                  Use a busca para encontrar usuários específicos.
                </p>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">👑</span>
                <h3 className="font-semibold text-foreground">Master Admins</h3>
              </div>
              <div className="text-3xl font-bold text-foreground">{masterAdmins.length}</div>
              <div className="text-sm text-muted-foreground">Usuários com máximo privilégio</div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <UserIcon />
                <h3 className="font-semibold text-foreground">Usuários Regulares</h3>
              </div>
              <div className="text-3xl font-bold text-foreground">{regularUsers.length}</div>
              <div className="text-sm text-muted-foreground">Usuários sem privilégio master</div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-green-600 text-2xl">🛡️</span>
                <h3 className="font-semibold text-foreground">Total de Usuários</h3>
              </div>
              <div className="text-3xl font-bold text-foreground">{users.length}</div>
              <div className="text-sm text-muted-foreground">Usuários no sistema</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-card border rounded-lg p-4">
            <Input
              placeholder="Buscar usuários por email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Lista de Master Admins */}
          <div className="bg-card border rounded-lg">
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <span className="text-xl">👑</span>
                <h3 className="font-semibold text-foreground">Master Administradores</h3>
                <Badge variant="secondary">{masterAdmins.length}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Usuários com privilégios máximos de administração
              </p>
            </div>
            <div className="divide-y">
              {masterAdmins.length > 0 ? (
                masterAdmins.map((user) => (
                  <div key={user.id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">👑</span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{user.email}</div>
                        <div className="text-sm text-muted-foreground">
                          Master Admin • Criado em {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        Master Admin
                      </Badge>
                      {user.id !== currentUserId && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              Remover Master
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover Master Admin</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover os privilégios de Master Admin de <strong>{user.email}</strong>?
                                Esta ação é irreversível e o usuário perderá acesso total ao sistema.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleToggleMasterAdmin(user.id, user.isMasterAdmin)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remover Master Admin
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {user.id === currentUserId && (
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          Você
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  Nenhum Master Admin encontrado
                </div>
              )}
            </div>
          </div>

          {/* Lista de Usuários Regulares */}
          <div className="bg-card border rounded-lg">
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <UserIcon />
                <h3 className="font-semibold text-foreground">Usuários Regulares</h3>
                <Badge variant="secondary">{regularUsers.length}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Usuários que podem ser promovidos para Master Admin
              </p>
            </div>
            <div className="divide-y">
              {regularUsers.length > 0 ? (
                regularUsers.map((user) => (
                  <div key={user.id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <UserIcon />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{user.email}</div>
                        <div className="text-sm text-muted-foreground">
                          Usuário Regular • Criado em {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Usuário Regular</Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-yellow-600 hover:text-yellow-700">
                            👑 Promover para Master
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Promover para Master Admin</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja promover <strong>{user.email}</strong> para Master Admin?
                              Este usuário terá acesso total ao sistema, incluindo a capacidade de gerenciar outros Master Admins.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleToggleMasterAdmin(user.id, user.isMasterAdmin)}
                              className="bg-yellow-600 hover:bg-yellow-700"
                            >
                              Promover para Master Admin
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  Nenhum usuário regular encontrado
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 