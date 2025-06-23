import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';

export default function PermissionsPage() {
  // Mock data baseado no sistema de roles implementado
  const roles = [
    {
      id: 'SYSTEM_ADMIN',
      name: 'Administrador do Sistema',
      description: 'Acesso completo a todas as funcionalidades',
      userCount: 2,
      color: 'red',
      permissions: ['MANAGE_ORGANIZATIONS', 'MANAGE_USERS', 'MANAGE_COMPANIONS', 'VIEW_ANALYTICS', 'MANAGE_INTEGRATIONS']
    },
    {
      id: 'ORG_ADMIN', 
      name: 'Administrador da Organização',
      description: 'Gestão completa da organização',
      userCount: 5,
      color: 'orange',
      permissions: ['MANAGE_TEAMS', 'INVITE_USERS', 'MANAGE_COMPANIONS', 'VIEW_ANALYTICS']
    },
    {
      id: 'TEAM_LEAD',
      name: 'Líder de Time',
      description: 'Gestão de time e recursos avançados',
      userCount: 12,
      color: 'blue',
      permissions: ['USE_STUDIO', 'USE_EXPERIMENTAL', 'MANAGE_TEAM_COMPANIONS']
    },
    {
      id: 'MEMBER',
      name: 'Membro',
      description: 'Acesso às funcionalidades básicas',
      userCount: 45,
      color: 'green',
      permissions: ['USE_CHAT', 'USE_UNIVERSITY', 'USE_DATA_ROOM']
    },
    {
      id: 'GUEST',
      name: 'Convidado',
      description: 'Acesso limitado apenas ao chat',
      userCount: 8,
      color: 'gray',
      permissions: ['USE_CHAT']
    }
  ];

  const allPermissions = [
    { id: 'USE_CHAT', name: 'Usar Chat', category: 'Básico' },
    { id: 'USE_UNIVERSITY', name: 'Acessar University', category: 'Básico' },
    { id: 'USE_DATA_ROOM', name: 'Acessar Data Room', category: 'Básico' },
    { id: 'USE_STUDIO', name: 'Usar Studio', category: 'Avançado' },
    { id: 'USE_EXPERIMENTAL', name: 'Recursos Experimentais', category: 'Avançado' },
    { id: 'MANAGE_COMPANIONS', name: 'Gerenciar Companions', category: 'Gestão' },
    { id: 'MANAGE_TEAMS', name: 'Gerenciar Times', category: 'Gestão' },
    { id: 'INVITE_USERS', name: 'Convidar Usuários', category: 'Gestão' },
    { id: 'MANAGE_USERS', name: 'Gerenciar Usuários', category: 'Admin' },
    { id: 'MANAGE_ORGANIZATIONS', name: 'Gerenciar Organizações', category: 'Admin' },
    { id: 'VIEW_ANALYTICS', name: 'Ver Analytics', category: 'Dados' },
    { id: 'MANAGE_INTEGRATIONS', name: 'Gerenciar Integrações', category: 'Técnico' }
  ];

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-background/95 backdrop-blur">
        <PageHeader 
          title="Controle de Acessos" 
          description="Configure permissões e níveis de acesso"
          showBackButton={true}
        >
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            + Criar Role
          </Button>
        </PageHeader>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6 max-w-6xl">
          {/* Lista de Roles */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Roles e Permissões</h2>
            <div className="space-y-3">
              {roles.map((role) => (
                <Card key={role.id} className="p-6 bg-card border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{role.name}</h3>
                        <Badge variant="secondary">{role.userCount} usuários</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {role.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.map((permission) => {
                          const permissionData = allPermissions.find(p => p.id === permission);
                          return (
                            <Badge 
                              key={permission} 
                              variant="outline" 
                              className="text-xs"
                            >
                              {permissionData?.name || permission}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1">
                        ⋯
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Matriz de Permissões */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Matriz de Permissões</h2>
            <Card className="p-6 bg-card border rounded-lg">
              <div className="overflow-x-auto">
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(
                    allPermissions.reduce((acc, permission) => {
                      if (!acc[permission.category]) {
                        acc[permission.category] = [];
                      }
                      acc[permission.category].push(permission);
                      return acc;
                    }, {} as Record<string, typeof allPermissions>)
                  ).map(([category, permissions]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium text-foreground">{category}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {permissions.map((permission) => (
                          <div 
                            key={permission.id}
                            className="p-2 bg-muted/50 rounded text-sm text-foreground"
                          >
                            {permission.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{roles.length}</div>
                <div className="text-sm text-muted-foreground">Roles Ativas</div>
              </div>
            </Card>
            <Card className="p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {roles.reduce((sum, role) => sum + role.userCount, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Usuários</div>
              </div>
            </Card>
            <Card className="p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{allPermissions.length}</div>
                <div className="text-sm text-muted-foreground">Permissões</div>
              </div>
            </Card>
            <Card className="p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {Object.keys(allPermissions.reduce((acc, p) => ({ ...acc, [p.category]: true }), {})).length}
                </div>
                <div className="text-sm text-muted-foreground">Categorias</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 