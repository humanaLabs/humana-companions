'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';

export default function PeoplePage() {
  const [activeTab, setActiveTab] = useState<'users' | 'teams' | 'invites'>('users');

  // Mock data
  const users = [
    {
      id: '1',
      name: 'João Silva',
      email: 'joao@empresa.com',
      role: 'ORG_ADMIN',
      roleName: 'Admin da Organização',
      status: 'active',
      lastLogin: '2024-01-15T10:30:00Z',
      team: 'Desenvolvimento',
      avatar: null
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@empresa.com',
      role: 'TEAM_LEAD',
      roleName: 'Líder de Time',
      status: 'active',
      lastLogin: '2024-01-15T09:15:00Z',
      team: 'Design',
      avatar: null
    },
    {
      id: '3',
      name: 'Pedro Costa',
      email: 'pedro@empresa.com',
      role: 'TEAM_LEAD',
      roleName: 'Líder de Time',
      status: 'active',
      lastLogin: '2024-01-14T16:45:00Z',
      team: 'Marketing',
      avatar: null
    },
    {
      id: '4',
      name: 'Ana Oliveira',
      email: 'ana@empresa.com',
      role: 'MEMBER',
      roleName: 'Membro',
      status: 'active',
      lastLogin: '2024-01-15T08:20:00Z',
      team: 'Desenvolvimento',
      avatar: null
    },
    {
      id: '5',
      name: 'Carlos Ferreira',
      email: 'carlos@empresa.com',
      role: 'MEMBER',
      roleName: 'Membro',
      status: 'inactive',
      lastLogin: '2024-01-10T14:30:00Z',
      team: 'Marketing',
      avatar: null
    }
  ];

  const teams = [
    {
      id: '1',
      name: 'Desenvolvimento',
      description: 'Time responsável pelo desenvolvimento de software',
      memberCount: 8,
      leadName: 'João Silva',
      members: ['João Silva', 'Ana Oliveira', 'Lucas Santos', 'Carla Mendes']
    },
    {
      id: '2',
      name: 'Design',
      description: 'Time de design e experiência do usuário',
      memberCount: 4,
      leadName: 'Maria Santos',
      members: ['Maria Santos', 'Paulo Dias', 'Fernanda Costa']
    },
    {
      id: '3',
      name: 'Marketing',
      description: 'Time de marketing e comunicação',
      memberCount: 6,
      leadName: 'Pedro Costa',
      members: ['Pedro Costa', 'Carlos Ferreira', 'Julia Rocha', 'Roberto Lima']
    }
  ];

  const invites = [
    {
      id: '1',
      email: 'novo.usuario@empresa.com',
      role: 'MEMBER',
      roleName: 'Membro',
      team: 'Desenvolvimento',
      invitedBy: 'João Silva',
      invitedAt: '2024-01-15T10:00:00Z',
      status: 'pending',
      expiresAt: '2024-01-22T10:00:00Z'
    },
    {
      id: '2',
      email: 'designer@empresa.com',
      role: 'MEMBER',
      roleName: 'Membro',
      team: 'Design',
      invitedBy: 'Maria Santos',
      invitedAt: '2024-01-14T15:30:00Z',
      status: 'pending',
      expiresAt: '2024-01-21T15:30:00Z'
    },
    {
      id: '3',
      email: 'gerente@empresa.com',
      role: 'TEAM_LEAD',
      roleName: 'Líder de Time',
      team: 'Marketing',
      invitedBy: 'João Silva',
      invitedAt: '2024-01-13T09:00:00Z',
      status: 'expired',
      expiresAt: '2024-01-20T09:00:00Z'
    }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SYSTEM_ADMIN': return 'destructive';
      case 'ORG_ADMIN': return 'default';
      case 'TEAM_LEAD': return 'secondary';
      case 'MEMBER': return 'outline';
      case 'GUEST': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'pending': return 'default';
      case 'expired': return 'destructive';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getActionButton = () => {
    switch (activeTab) {
      case 'users':
        return (
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            + Adicionar Usuário
          </Button>
        );
      case 'teams':
        return (
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            + Criar Time
          </Button>
        );
      case 'invites':
        return (
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            + Enviar Convite
          </Button>
        );
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return (
          <div className="space-y-4">
            {/* Filtros para usuários */}
            <div className="flex gap-4 flex-wrap">
              <Button variant="outline" size="sm">
                Todos ({users.length})
              </Button>
              <Button variant="ghost" size="sm">
                Ativos ({users.filter(u => u.status === 'active').length})
              </Button>
              <Button variant="ghost" size="sm">
                Inativos ({users.filter(u => u.status === 'inactive').length})
              </Button>
              <Button variant="ghost" size="sm">
                Admins ({users.filter(u => u.role.includes('ADMIN')).length})
              </Button>
            </div>

            {/* Lista de usuários */}
            <div className="space-y-3">
              {users.map((user) => (
                <Card key={user.id} className="p-4 bg-card border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-foreground">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{user.name}</h3>
                          <Badge variant={getStatusColor(user.status)}>
                            {user.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <Badge variant={getRoleColor(user.role)} className="text-xs">
                            {user.roleName}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Time: {user.team}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Editar</Button>
                      <Button variant="ghost" size="sm" className="p-1">⋯</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'teams':
        return (
          <div className="space-y-4">
            {/* Grid de times */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <Card key={team.id} className="p-6 bg-card border rounded-lg">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{team.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {team.description}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="p-1">⋯</Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Membros:</span>
                        <Badge variant="secondary">{team.memberCount}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Líder:</span>
                        <span className="text-foreground">{team.leadName}</span>
                      </div>
                    </div>

                    {/* Membros do time */}
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-foreground">Membros:</span>
                      <div className="flex flex-wrap gap-1">
                        {team.members.slice(0, 3).map((member, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {member}
                          </Badge>
                        ))}
                        {team.members.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{team.members.length - 3} mais
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Ver Membros
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Editar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'invites':
        return (
          <div className="space-y-4">
            {/* Filtros para convites */}
            <div className="flex gap-4 flex-wrap">
              <Button variant="outline" size="sm">
                Todos ({invites.length})
              </Button>
              <Button variant="ghost" size="sm">
                Pendentes ({invites.filter(i => i.status === 'pending').length})
              </Button>
              <Button variant="ghost" size="sm">
                Expirados ({invites.filter(i => i.status === 'expired').length})
              </Button>
            </div>

            {/* Lista de convites */}
            <div className="space-y-3">
              {invites.map((invite) => (
                <Card key={invite.id} className="p-4 bg-card border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm">📧</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{invite.email}</h3>
                          <Badge variant={getStatusColor(invite.status)}>
                            {invite.status === 'pending' ? 'Pendente' : 'Expirado'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <Badge variant={getRoleColor(invite.role)} className="text-xs">
                            {invite.roleName}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Time: {invite.team}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Convidado por: {invite.invitedBy}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enviado em: {formatDate(invite.invitedAt)} • 
                          Expira em: {formatDate(invite.expiresAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        {invite.status === 'pending' ? 'Reenviar' : 'Renovar'}
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1">⋯</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
    }
  };

  const getTabStats = () => {
    switch (activeTab) {
      case 'users':
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{users.length}</div>
                <div className="text-sm text-muted-foreground">Total Usuários</div>
              </div>
            </Card>
            <Card className="p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {users.filter(u => u.status === 'active').length}
                </div>
                <div className="text-sm text-muted-foreground">Ativos</div>
              </div>
            </Card>
            <Card className="p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {users.filter(u => u.role.includes('ADMIN') || u.role === 'TEAM_LEAD').length}
                </div>
                <div className="text-sm text-muted-foreground">Gestores</div>
              </div>
            </Card>
            <Card className="p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {new Set(users.map(u => u.team)).size}
                </div>
                <div className="text-sm text-muted-foreground">Times</div>
              </div>
            </Card>
          </div>
        );

      case 'teams':
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{teams.length}</div>
                <div className="text-sm text-muted-foreground">Times Ativos</div>
              </div>
            </Card>
            <Card className="p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {teams.reduce((sum, team) => sum + team.memberCount, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Membros</div>
              </div>
            </Card>
            <Card className="p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {Math.round(teams.reduce((sum, team) => sum + team.memberCount, 0) / teams.length)}
                </div>
                <div className="text-sm text-muted-foreground">Média por Time</div>
              </div>
            </Card>
            <Card className="p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {teams.filter(t => t.memberCount > 5).length}
                </div>
                <div className="text-sm text-muted-foreground">Times Grandes</div>
              </div>
            </Card>
          </div>
        );

      case 'invites':
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{invites.length}</div>
                <div className="text-sm text-muted-foreground">Total Convites</div>
              </div>
            </Card>
            <Card className="p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {invites.filter(i => i.status === 'pending').length}
                </div>
                <div className="text-sm text-muted-foreground">Pendentes</div>
              </div>
            </Card>
            <Card className="p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {invites.filter(i => i.status === 'expired').length}
                </div>
                <div className="text-sm text-muted-foreground">Expirados</div>
              </div>
            </Card>
            <Card className="p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {Math.round((invites.filter(i => i.status === 'pending').length / invites.length) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Taxa Sucesso</div>
              </div>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-background/95 backdrop-blur">
        <PageHeader 
          title="Gestão de Pessoas" 
          description="Gerencie usuários, times e convites da organização"
          showBackButton={true}
        >
          {getActionButton()}
        </PageHeader>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6 max-w-6xl">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              👤 Usuários
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'teams'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              👥 Times
            </button>
            <button
              onClick={() => setActiveTab('invites')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'invites'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              📧 Convites
            </button>
          </div>

          {/* Estatísticas */}
          {getTabStats()}

          {/* Conteúdo da aba */}
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
} 