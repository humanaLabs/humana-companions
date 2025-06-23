'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  MessageSquare, 
  Clock, 
  Target,
  Zap,
  Brain,
  Calendar,
  ThumbsUp,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// import { Progress } from '@/components/ui/progress'; // Temporariamente removido
import { Separator } from '@/components/ui/separator';

interface CompanionAnalyticsProps {
  companionId: string;
  onRunMCPCycle?: () => void;
}

interface Analytics {
  performance: any;
  recentFeedback: any[];
  recentInteractions: any[];
  latestMcpReport: any;
  summary: {
    totalFeedback: number;
    averageRating: number;
    totalInteractions: number;
    lastActivity: string | null;
  };
}

export function CompanionAnalytics({ companionId, onRunMCPCycle }: CompanionAnalyticsProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningMCP, setIsRunningMCP] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [companionId]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/companions/${companionId}/analytics`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunMCPCycle = async () => {
    setIsRunningMCP(true);
    try {
      const response = await fetch(`/api/companions/${companionId}/mcp-cycle`, {
        method: 'POST',
      });
      
      if (response.ok) {
        await fetchAnalytics(); // Atualizar dados após o ciclo
        onRunMCPCycle?.();
      }
    } catch (error) {
      console.error('Error running MCP cycle:', error);
    } finally {
      setIsRunningMCP(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Dados de analytics não disponíveis</p>
      </div>
    );
  }

  const { performance, summary, latestMcpReport } = analytics;

  return (
    <div className="space-y-6">
      {/* Header com ação MCP */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Performance & Analytics</h3>
        <Button 
          onClick={handleRunMCPCycle}
          disabled={isRunningMCP}
          className="flex items-center gap-2"
        >
          <Brain className="h-4 w-4" />
          {isRunningMCP ? 'Executando...' : 'Executar Ciclo MCP'}
        </Button>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium">Rating Médio</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {summary.averageRating.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">
                {summary.totalFeedback} avaliações
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Interações</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {performance?.totalInteractions || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                Total de interações
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Taxa Positiva</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {performance?.positiveFeedbackRate || 0}%
              </div>
              <div className="text-xs text-muted-foreground">
                Feedback positivo
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">Score MCP</span>
            </div>
            <div className="mt-2">
              <div className={`text-2xl font-bold ${getPerformanceColor(parseInt(performance?.mcpScore || '0'))}`}>
                {performance?.mcpScore || 'N/A'}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(performance?.improvementTrend)}
                {performance?.improvementTrend || 'unknown'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Último Relatório MCP */}
      {latestMcpReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Último Ciclo MCP
              <Badge variant="outline">
                {formatDate(latestMcpReport.cycleDate)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Score Geral */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Score Geral</span>
                <span className={`font-bold ${getPerformanceColor(latestMcpReport.analysis?.score_geral || 0)}`}>
                  {latestMcpReport.analysis?.score_geral || 'N/A'}/10
                </span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all" 
                  style={{ width: `${(latestMcpReport.analysis?.score_geral || 0) * 10}%` }}
                />
              </div>
            </div>

            <Separator />

            {/* Pontos Fortes */}
            {latestMcpReport.analysis?.pontos_fortes && (
              <div>
                <h4 className="font-medium text-green-600 mb-2">Pontos Fortes</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {latestMcpReport.analysis.pontos_fortes.slice(0, 3).map((ponto: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      {ponto}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pontos de Melhoria */}
            {latestMcpReport.analysis?.pontos_melhoria && (
              <div>
                <h4 className="font-medium text-yellow-600 mb-2">Pontos de Melhoria</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {latestMcpReport.analysis.pontos_melhoria.slice(0, 3).map((ponto: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                      {ponto}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Próximos Passos */}
            {latestMcpReport.nextSteps && latestMcpReport.nextSteps.length > 0 && (
              <div>
                <h4 className="font-medium text-blue-600 mb-2">Próximos Passos</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {latestMcpReport.nextSteps.slice(0, 3).map((passo: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      {passo}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feedback Recente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recentFeedback.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentFeedback.slice(0, 5).map((feedback, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={feedback.type === 'positive' ? 'default' : 
                                feedback.type === 'negative' ? 'destructive' : 'secondary'}
                      >
                        {feedback.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {feedback.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${
                            i < parseInt(feedback.rating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm">{feedback.comment}</p>
                  <div className="text-xs text-muted-foreground mt-2">
                    {formatDate(feedback.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum feedback disponível ainda</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Atividade Recente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.lastActivity ? (
            <div className="text-sm">
              <p className="text-muted-foreground">Última atividade:</p>
              <p className="font-medium">{formatDate(summary.lastActivity)}</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma atividade registrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 