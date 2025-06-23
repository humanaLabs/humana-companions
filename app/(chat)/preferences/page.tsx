'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { toast } from '@/components/toast';
import { UserIcon, PaletteIcon, BellIcon, ShieldIcon } from 'lucide-react';

export default function PreferencesPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      // Simular salvamento das preferências
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        type: 'success',
        description: 'Preferências salvas com sucesso!',
      });
    } catch (error) {
      toast({
        type: 'error',
        description: 'Erro ao salvar preferências. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Preferências" 
        description="Configure suas preferências pessoais e de sistema"
        badge="Usuário"
        showBackButton={true}
      >
        <Button onClick={handleSavePreferences} disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Preferências'}
        </Button>
      </PageHeader>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl w-full mx-auto space-y-6">
          
          {/* Perfil do Usuário */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="text-muted-foreground">
                <UserIcon size={32} />
              </div>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                Perfil
              </span>
            </div>
            <h3 className="font-semibold text-foreground mb-4">Informações do Perfil</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    value={session?.user?.email || ''} 
                    disabled 
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome de Exibição</Label>
                  <Input 
                    id="name" 
                    placeholder="Seu nome completo"
                    className="bg-background text-foreground border"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Input 
                  id="bio" 
                  placeholder="Conte um pouco sobre você"
                  className="bg-background text-foreground border"
                />
              </div>
            </div>
          </div>

          {/* Aparência */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="text-muted-foreground">
                <PaletteIcon size={32} />
              </div>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                Visual
              </span>
            </div>
            <h3 className="font-semibold text-foreground mb-4">Aparência</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tema</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="bg-background text-foreground border">
                    <SelectValue placeholder="Selecione um tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tamanho da Fonte</Label>
                <Select defaultValue="medium">
                  <SelectTrigger className="bg-background text-foreground border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequena</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notificações */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="text-muted-foreground">
                <BellIcon size={32} />
              </div>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                Alertas
              </span>
            </div>
            <h3 className="font-semibold text-foreground mb-4">Notificações</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Notificações por Email</h4>
                  <p className="text-sm text-muted-foreground">Receber atualizações importantes por email</p>
                </div>
                <input type="checkbox" className="h-4 w-4 rounded border text-primary" defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Notificações Push</h4>
                  <p className="text-sm text-muted-foreground">Receber notificações em tempo real</p>
                </div>
                <input type="checkbox" className="h-4 w-4 rounded border text-primary" />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Relatórios Semanais</h4>
                  <p className="text-sm text-muted-foreground">Resumo semanal de atividades</p>
                </div>
                <input type="checkbox" className="h-4 w-4 rounded border text-primary" defaultChecked />
              </div>
            </div>
          </div>

          {/* Privacidade e Segurança */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="text-muted-foreground">
                <ShieldIcon size={32} />
              </div>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                Segurança
              </span>
            </div>
            <h3 className="font-semibold text-foreground mb-4">Privacidade e Segurança</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Dados de Analytics</h4>
                  <p className="text-sm text-muted-foreground">Permitir coleta de dados para melhorar a experiência</p>
                </div>
                <input type="checkbox" className="h-4 w-4 rounded border text-primary" defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Perfil Público</h4>
                  <p className="text-sm text-muted-foreground">Tornar seu perfil visível para outros usuários</p>
                </div>
                <input type="checkbox" className="h-4 w-4 rounded border text-primary" />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  Alterar Senha
                </Button>
                <Button variant="outline" size="sm" className="w-full text-red-600 hover:text-red-700">
                  Excluir Conta
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
} 