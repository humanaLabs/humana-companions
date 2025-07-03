'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Star, 
  Clock, 
  Brain,
  Activity
} from 'lucide-react';

interface OrganizationMetrics {
  totalCompanions: number;
  totalInteractions: number;
  averageRating: number;
  activeUsers: number;
  totalFeedback: number;
  positiveFeedbackRate: number;
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<OrganizationMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento e usar dados mock
    const timer = setTimeout(() => {
      const mockMetrics: OrganizationMetrics = {
        totalCompanions: 12,
        totalInteractions: 1847,
        averageRating: 4.3,
        activeUsers: 156,
        totalFeedback: 89,
        positiveFeedbackRate: 87,
      };
      setMetrics(mockMetrics);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-semibold">Analytics & Insights</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-xl font-semibold">Analytics & Insights</h1>
          <p className="text-sm text-muted-foreground">
            Métricas de performance e uso da sua organização
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          Tempo Real
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6 overflow-auto">
        {/* Métricas Principais */}
        <div>
          <h2 className="text-lg font-semibold mb-4">📊 Visão Geral</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">Companions</span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">
                    {metrics?.totalCompanions || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total ativos
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Interações</span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">
                    {metrics?.totalInteractions.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total este mês
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium">Rating Médio</span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">
                    {metrics?.averageRating.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metrics?.totalFeedback || 0} avaliações
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium">Usuários Ativos</span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">
                    {metrics?.activeUsers || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Últimos 30 dias
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Métricas de Performance */}
        <div>
          <h2 className="text-lg font-semibold mb-4">📈 Tendências</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Taxa de Satisfação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {metrics?.positiveFeedbackRate || 0}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  +5% vs. mês anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Tempo Médio de Resposta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  1.2s
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  -0.3s vs. mês anterior
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Informação sobre funcionalidade */}
        <div>
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">🚧 Em Desenvolvimento</h3>
              <p className="text-muted-foreground">
                Analytics detalhados de companions em desenvolvimento. 
                Esta página mostra dados simulados por enquanto.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 