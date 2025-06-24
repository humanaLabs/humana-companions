'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { BoxIcon, UserIcon, PlusIcon, PencilEditIcon, TrashIcon, MoreIcon } from '@/components/icons';
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
import { CreateTeamModal } from '@/components/create-team-modal';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  createdAt?: Date | string;
  color: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [organizations, setOrganizations] = useState<{id: string, name: string}[]>([]);
  const [users, setUsers] = useState<{id: string, email: string, name?: string}[]>([]);
  const [currentUser, setCurrentUser] = useState<{isMasterAdmin: boolean} | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar dados reais da API
  useEffect(() => {
    async function loadTeams() {
      try {
        const response = await fetch('/api/admin/teams');
        if (response.ok) {
          const data = await response.json();
          setTeams(data.teams || []);
        } else {
          toast.error('Erro ao carregar teams');
        }
      } catch (error) {
        console.error('Erro ao carregar teams:', error);
        toast.error('Erro ao carregar teams');
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

    async function loadUsers() {
      try {
        const response = await fetch('/api/admin/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
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
      } finally {
        setLoading(false);
      }
    }

    loadTeams();
    loadOrganizations();
    loadUsers();
    loadCurrentUser();
  }, []);

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMembers = teams.reduce((sum, team) => sum + team.members.length, 0);

  const handleDeleteTeam = (teamId: string) => {
    setTeams(teams.filter(t => t.id !== teamId));
    toast.success('Time removido com sucesso!');
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <PageHeader 
          title="Gestão de Times" 
          description="Carregando..."
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
        title="Gestão de Times" 
        description="Organize usuários em equipes e gerencie colaboração"
        badge="Administração"
        showBackButton={true}
      >
        {currentUser && (
          <CreateTeamModal
            organizations={organizations}
            users={users}
            teams={teams}
            isMasterAdmin={currentUser.isMasterAdmin}
            onCreateSuccess={() => {
              // Recarregar teams após criação bem-sucedida
              window.location.reload();
            }}
          />
        )}
      </PageHeader>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl w-full mx-auto space-y-6">
          {/* Filtros */}
          <div className="bg-card border rounded-lg p-4">
            <Input
              placeholder="Buscar times..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md"
            />
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{teams.length}</div>
              <div className="text-sm text-muted-foreground">Times Ativos</div>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{totalMembers}</div>
              <div className="text-sm text-muted-foreground">Total de Membros</div>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {teams.length > 0 ? (totalMembers / teams.length).toFixed(1) : '0'}
              </div>
              <div className="text-sm text-muted-foreground">Média por Time</div>
            </div>
          </div>

          {/* Grid de Times */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => (
              <div key={team.id} className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">
                      <BoxIcon size={24} />
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreIcon size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <div className="mr-2">
                          <PencilEditIcon size={14} />
                        </div>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <div className="mr-2">
                          <PlusIcon size={14} />
                        </div>
                        Adicionar Membro
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteTeam(team.id)}
                      >
                        <div className="mr-2">
                          <TrashIcon size={14} />
                        </div>
                        Excluir Time
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h3 className="font-semibold text-foreground mb-2">{team.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {team.description}
                </p>

                {/* Membros */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Membros</span>
                    <Badge variant="outline" className="text-xs">
                      {team.members.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {team.members.slice(0, 3).map((member) => (
                      <div key={member.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                          <UserIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-foreground truncate">
                            {member.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {member.role}
                          </div>
                        </div>
                      </div>
                    ))}
                    {team.members.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{team.members.length - 3} outros membros
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-muted">
                  <span className="text-xs text-muted-foreground">
                    {team.createdAt 
                      ? new Date(team.createdAt).toLocaleDateString('pt-BR')
                      : 'N/A'
                    }
                  </span>
                  <Button variant="outline" size="sm">
                    <div className="mr-1">
                      <PlusIcon size={12} />
                    </div>
                    Membro
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredTeams.length === 0 && (
            <div className="bg-card border rounded-lg p-8 text-center">
              <div className="text-muted-foreground mb-2">Nenhum time encontrado</div>
              <div className="text-sm text-muted-foreground mb-4">
                {searchTerm ? 'Tente ajustar os filtros de busca' : 'Crie seu primeiro time'}
              </div>
              {!searchTerm && (
                <Button>
                  <div className="mr-2">
                    <PlusIcon size={16} />
                  </div>
                  Criar Time
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 