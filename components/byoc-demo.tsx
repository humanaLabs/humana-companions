'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Bot, HardDrive, CheckCircle, XCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';

export function BYOCDemo() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [llmInput, setLlmInput] = useState('Olá! Como você está hoje?');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Demonstrar uso do LLM Provider configurado
  const testLLMProvider = async () => {
    try {
      setLoading(true);
      
      // Simular chamada para API que usa o provider BYOC configurado
      const response = await fetch('/api/byoc-demo/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: llmInput,
          useCustomProvider: true 
        })
      });

      const result = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        llm: {
          success: response.ok,
          response: result.response || result.error,
          provider: result.provider,
          responseTime: result.responseTime
        }
      }));

      if (response.ok) {
        toast.success(`LLM Provider (${result.provider}) respondeu com sucesso!`);
      } else {
        toast.error(`Erro no LLM Provider: ${result.error}`);
      }
    } catch (error) {
      toast.error('Erro ao testar LLM Provider');
      setTestResults(prev => ({
        ...prev,
        llm: {
          success: false,
          response: 'Erro de conexão',
          provider: 'unknown'
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  // Demonstrar uso do Storage Provider configurado
  const testStorageProvider = async () => {
    if (!uploadFile) {
      toast.error('Selecione um arquivo para testar o storage');
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('useCustomProvider', 'true');

      const response = await fetch('/api/byoc-demo/storage', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        storage: {
          success: response.ok,
          response: result.url || result.error,
          provider: result.provider,
          fileSize: result.fileSize,
          uploadTime: result.uploadTime
        }
      }));

      if (response.ok) {
        toast.success(`Arquivo enviado via ${result.provider}!`);
      } else {
        toast.error(`Erro no Storage Provider: ${result.error}`);
      }
    } catch (error) {
      toast.error('Erro ao testar Storage Provider');
      setTestResults(prev => ({
        ...prev,
        storage: {
          success: false,
          response: 'Erro de conexão',
          provider: 'unknown'
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Zap className="h-4 w-4" />
        <AlertDescription>
          <strong>BYOC Demo:</strong> Este componente demonstra como seus providers BYOC configurados são usados 
          em funcionalidades reais do sistema. Configure seus providers em Admin → BYOC Providers primeiro.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LLM Provider Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Teste do LLM Provider
            </CardTitle>
            <CardDescription>
              Envie uma mensagem usando seu LLM provider configurado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="llm-input">Mensagem para o LLM</Label>
              <Textarea
                id="llm-input"
                value={llmInput}
                onChange={(e) => setLlmInput(e.target.value)}
                placeholder="Digite sua mensagem aqui..."
                rows={3}
              />
            </div>
            
            <Button 
              onClick={testLLMProvider} 
              disabled={loading || !llmInput.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                'Testar LLM Provider'
              )}
            </Button>

            {testResults.llm && (
              <div className="mt-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {testResults.llm.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <Badge variant={testResults.llm.success ? "default" : "destructive"}>
                    {testResults.llm.provider}
                  </Badge>
                  {testResults.llm.responseTime && (
                    <Badge variant="secondary">{testResults.llm.responseTime}ms</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">Resposta:</p>
                <p className="text-sm bg-muted p-2 rounded">
                  {testResults.llm.response}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Storage Provider Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Teste do Storage Provider
            </CardTitle>
            <CardDescription>
              Faça upload de um arquivo usando seu storage provider configurado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Selecionar Arquivo</Label>
              <Input
                id="file-upload"
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                accept="image/*,.pdf,.txt,.doc,.docx"
              />
              {uploadFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Arquivo: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
            
            <Button 
              onClick={testStorageProvider} 
              disabled={loading || !uploadFile}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                'Testar Storage Provider'
              )}
            </Button>

            {testResults.storage && (
              <div className="mt-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {testResults.storage.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <Badge variant={testResults.storage.success ? "default" : "destructive"}>
                    {testResults.storage.provider}
                  </Badge>
                  {testResults.storage.uploadTime && (
                    <Badge variant="secondary">{testResults.storage.uploadTime}ms</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {testResults.storage.success ? 'URL do arquivo:' : 'Erro:'}
                </p>
                <p className="text-sm bg-muted p-2 rounded break-all">
                  {testResults.storage.response}
                </p>
                {testResults.storage.fileSize && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Tamanho: {(testResults.storage.fileSize / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos Providers BYOC</CardTitle>
          <CardDescription>
            Resumo dos providers configurados e funcionando
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                testResults.llm?.success ? 'bg-green-100 text-green-600' : 
                testResults.llm?.success === false ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <Bot className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">LLM Provider</p>
              <p className="text-xs text-muted-foreground">
                {testResults.llm?.success ? 'Funcionando' : 
                 testResults.llm?.success === false ? 'Com erro' : 'Não testado'}
              </p>
            </div>
            
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                testResults.storage?.success ? 'bg-green-100 text-green-600' : 
                testResults.storage?.success === false ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <HardDrive className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">Storage Provider</p>
              <p className="text-xs text-muted-foreground">
                {testResults.storage?.success ? 'Funcionando' : 
                 testResults.storage?.success === false ? 'Com erro' : 'Não testado'}
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 bg-gray-100 text-gray-400">
                <Zap className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">Vector Provider</p>
              <p className="text-xs text-muted-foreground">Em desenvolvimento</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 bg-gray-100 text-gray-400">
                📧
              </div>
              <p className="text-sm font-medium">Email Provider</p>
              <p className="text-xs text-muted-foreground">Em desenvolvimento</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 