'use client';

import { PageHeader } from '@/components/page-header';
import { UserIcon, BoxIcon, LineChartIcon, LogsIcon, LockIcon } from '@/components/icons';
import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Dashboard Administrativo" 
        description="Gerencie usuários, times e monitore o sistema"
        badge="Administração"
        showBackButton={true}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl w-full mx-auto space-y-6">
          {/* Cards Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Gestão de Usuários */}
            <Link href="/admin/users" className="group">
              <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-muted-foreground scale-[2]">
                    <UserIcon />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      Gestão
                    </span>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Usuários</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Gerencie usuários, roles e permissões do sistema
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">CRUD completo</span>
                  <div className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    Acessar →
                  </div>
                </div>
              </div>
            </Link>

            {/* Gestão de Times */}
            <Link href="/admin/teams" className="group">
              <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-muted-foreground">
                    <BoxIcon size={32} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      Equipes
                    </span>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Times</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Organize usuários em equipes e gerencie colaboração
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Colaboração</span>
                  <div className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    Acessar →
                  </div>
                </div>
              </div>
            </Link>

            {/* Gestão de Roles */}
            <Link href="/admin/roles" className="group">
              <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-muted-foreground">
                    <LockIcon size={32} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      Master Admin
                    </span>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Roles & Permissões</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Defina roles customizadas e suas permissões por menu/objeto
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Acesso restrito</span>
                  <div className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    Acessar →
                  </div>
                </div>
              </div>
            </Link>

            {/* Analytics do Sistema */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-muted-foreground">
                  <LineChartIcon size={32} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    Métricas
                  </span>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Analytics</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Monitore uso, performance e métricas do sistema
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Em breve</span>
                <div className="text-xs text-muted-foreground">
                  Desenvolvimento
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas Rápidas */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-4">Visão Geral do Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">0</div>
                <div className="text-sm text-muted-foreground">Usuários Ativos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">0</div>
                <div className="text-sm text-muted-foreground">Times Criados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">0</div>
                <div className="text-sm text-muted-foreground">Conversas Hoje</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">100%</div>
                <div className="text-sm text-muted-foreground">Sistema Online</div>
              </div>
            </div>
          </div>

          {/* Log de Auditoria */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <LogsIcon size={20} />
              <h3 className="font-semibold text-foreground">Log de Auditoria</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-muted">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-foreground">Sistema inicializado</span>
                </div>
                <span className="text-xs text-muted-foreground">Agora mesmo</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-muted">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-foreground">Banco de dados conectado</span>
                </div>
                <span className="text-xs text-muted-foreground">1 min atrás</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-foreground">Aguardando configuração inicial</span>
                </div>
                <span className="text-xs text-muted-foreground">2 min atrás</span>
              </div>
            </div>
          </div>

          {/* Recursos Administrativos */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-4">Recursos Disponíveis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <UserIcon />
                <div>
                  <div className="text-sm font-medium text-foreground">Gestão de Roles</div>
                  <div className="text-xs text-muted-foreground">Administrador, Gerente, Usuário</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <BoxIcon size={16} />
                <div>
                  <div className="text-sm font-medium text-foreground">Sistema de Times</div>
                  <div className="text-xs text-muted-foreground">Colaboração em equipe</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <LineChartIcon size={16} />
                <div>
                  <div className="text-sm font-medium text-foreground">Monitoramento</div>
                  <div className="text-xs text-muted-foreground">Métricas e analytics</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <LogsIcon size={16} />
                <div>
                  <div className="text-sm font-medium text-foreground">Auditoria</div>
                  <div className="text-xs text-muted-foreground">Log de todas as ações</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 