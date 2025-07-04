import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Database, Shield, FileText, AlertCircle, ExternalLink } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AuditoriaByocPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuração de Auditoria BYOC</h1>
          <p className="text-muted-foreground mt-1">
            Configure seu sistema de auditoria preferido - Database tradicional ou Blockchain imutável
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          ROADMAP 2025
        </Badge>
      </div>

      {/* Status Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Funcionalidade Futura:</strong> Esta configuração estará disponível 6-12 meses após a foundation.
          Atualmente em fase de planejamento estratégico.
        </AlertDescription>
      </Alert>

      {/* Provider Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Traditional Database Audit */}
        <Card className="border-2 border-dashed border-muted">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              <CardTitle>Auditoria Tradicional</CardTitle>
              <Badge variant="outline">Padrão</Badge>
            </div>
            <CardDescription>
              Sistema de auditoria usando banco de dados relacional para compliance básico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Storage:</span>
                <span>PostgreSQL/MySQL</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Performance:</span>
                <span>&lt; 100ms queries</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Custo:</span>
                <span>Incluído no BYOC</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Compliance:</span>
                <span>SOC 2, ISO 27001</span>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="font-medium mb-2">Casos de Uso:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Troubleshooting e debugging</li>
                <li>• Compliance corporativo básico</li>
                <li>• Relatórios de acesso</li>
                <li>• Performance monitoring</li>
              </ul>
            </div>

            <Button disabled className="w-full">
              Configurar Database Audit
            </Button>
          </CardContent>
        </Card>

        {/* Blockchain Audit */}
        <Card className="border-2 border-dashed border-muted">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              <CardTitle>Auditoria Blockchain</CardTitle>
              <Badge variant="outline">Premium</Badge>
            </div>
            <CardDescription>
              Sistema de auditoria imutável usando blockchain para compliance avançado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Padrão Humana:</span>
                <span>Hyperledger Besu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">BYOC Choice:</span>
                <span>Fabric, Ethereum, Polygon</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Custo:</span>
                <span>+$50-100/usuário/mês</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Compliance:</span>
                <span>SOX, HIPAA, FDA</span>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="font-medium mb-2">Casos de Uso:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Auditoria regulatory rigorosa</li>
                <li>• Certificação de documentos</li>
                <li>• AI decision accountability</li>
                <li>• Compliance automático</li>
              </ul>
            </div>

            <Button disabled className="w-full">
              Configurar Blockchain Audit
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Roadmap de Implementação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Badge variant="outline">Fase 1 (Meses 1-3)</Badge>
                <div className="text-sm">
                  <div className="font-medium">Database Audit Provider</div>
                  <div className="text-muted-foreground">Provider pattern + basic logging</div>
                </div>
              </div>
              <div className="space-y-2">
                <Badge variant="outline">Fase 2 (Meses 4-6)</Badge>
                <div className="text-sm">
                  <div className="font-medium">Besu Integration</div>
                  <div className="text-muted-foreground">Blockchain provider + smart contracts</div>
                </div>
              </div>
              <div className="space-y-2">
                <Badge variant="outline">Fase 3 (Meses 7-9)</Badge>
                <div className="text-sm">
                  <div className="font-medium">Multi-blockchain</div>
                  <div className="text-muted-foreground">Fabric, Ethereum, Polygon support</div>
                </div>
              </div>
              <div className="space-y-2">
                <Badge variant="outline">Fase 4 (Meses 10-12)</Badge>
                <div className="text-sm">
                  <div className="font-medium">Advanced Features</div>
                  <div className="text-muted-foreground">Compliance templates + automation</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Impact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Eliminação de Disputas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Histórico imutável elimina completamente disputas sobre dados e decisões
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Redução de Custos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              60-80% redução em gastos com auditoria manual e compliance
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Vantagem Competitiva</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Única plataforma AI companions com audit blockchain configurável
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Documentation Links */}
      <Card>
        <CardHeader>
          <CardTitle>Documentação Técnica</CardTitle>
          <CardDescription>
            Acesse a documentação completa do planejamento de auditoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start" asChild>
              <a href="/projeto/features/04-enterprise/byoc-audit-configuration.md" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                BYOC Audit Configuration
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/projeto/foundation/ARQUITETURA_COMPLETA.md#blockchain-audit" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Arquitetura Completa - Blockchain
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 