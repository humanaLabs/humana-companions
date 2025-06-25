'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Eye } from 'lucide-react';
import type { Companion } from '@/lib/db/schema';
import type {
  CompanionStructure,
  CompanionExpertise,
  CompanionSource,
  CompanionRule,
  CompanionSkill,
} from '@/lib/types';
import { companionStructureToSystemPrompt } from '@/lib/ai/companion-prompt';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';

interface CompanionFormProps {
  companion?: Companion | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export function CompanionForm({
  companion,
  onCancel,
  onSuccess,
}: CompanionFormProps) {
  // Estados básicos
  const [name, setName] = useState(companion?.name || '');
  const [role, setRole] = useState(companion?.role || '');
  const [responsibilities, setResponsibilities] = useState<string[]>(
    companion?.responsibilities
      ? Array.isArray(companion.responsibilities)
        ? companion.responsibilities
        : JSON.parse(companion.responsibilities as string)
      : [''],
  );

  // Estados de expertise
  const [expertises, setExpertises] = useState<CompanionExpertise[]>(
    companion?.expertises
      ? Array.isArray(companion.expertises)
        ? companion.expertises
        : JSON.parse(companion.expertises as string)
      : [{ area: '', topics: [''] }],
  );

  // Estados de fontes
  const [sources, setSources] = useState<CompanionSource[]>(
    companion?.sources
      ? Array.isArray(companion.sources)
        ? companion.sources
        : JSON.parse(companion.sources as string)
      : [{ type: '', description: '' }],
  );

  // Estados de regras
  const [rules, setRules] = useState<CompanionRule[]>(
    companion?.rules
      ? Array.isArray(companion.rules)
        ? companion.rules
        : JSON.parse(companion.rules as string)
      : [{ type: 'tone', description: '' }],
  );

  // Estados de política de conteúdo
  const [allowedContent, setAllowedContent] = useState<string[]>(
    companion?.contentPolicy
      ? typeof companion.contentPolicy === 'object'
        ? (companion.contentPolicy as any).allowed
        : JSON.parse(companion.contentPolicy as string).allowed
      : [''],
  );
  const [disallowedContent, setDisallowedContent] = useState<string[]>(
    companion?.contentPolicy
      ? typeof companion.contentPolicy === 'object'
        ? (companion.contentPolicy as any).disallowed
        : JSON.parse(companion.contentPolicy as string).disallowed
      : [''],
  );

  // Estados opcionais
  const [skills, setSkills] = useState<CompanionSkill[]>(
    companion?.skills
      ? Array.isArray(companion.skills)
        ? companion.skills
        : JSON.parse(companion.skills as string)
      : [],
  );
  const [fallbacks, setFallbacks] = useState({
    ambiguous: companion?.fallbacks
      ? (typeof companion.fallbacks === 'object'
          ? (companion.fallbacks as any).ambiguous
          : JSON.parse(companion.fallbacks as string).ambiguous) || ''
      : '',
    out_of_scope: companion?.fallbacks
      ? (typeof companion.fallbacks === 'object'
          ? (companion.fallbacks as any).out_of_scope
          : JSON.parse(companion.fallbacks as string).out_of_scope) || ''
      : '',
    unknown: companion?.fallbacks
      ? (typeof companion.fallbacks === 'object'
          ? (companion.fallbacks as any).unknown
          : JSON.parse(companion.fallbacks as string).unknown) || ''
      : '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const isEditing = !!companion;

  // Funções para gerenciar arrays dinâmicos
  const addResponsibility = () =>
    setResponsibilities([...responsibilities, '']);
  const removeResponsibility = (index: number) =>
    setResponsibilities(responsibilities.filter((_, i) => i !== index));
  const updateResponsibility = (index: number, value: string) => {
    const updated = [...responsibilities];
    updated[index] = value;
    setResponsibilities(updated);
  };

  const addExpertise = () =>
    setExpertises([...expertises, { area: '', topics: [''] }]);
  const removeExpertise = (index: number) =>
    setExpertises(expertises.filter((_, i) => i !== index));
  const updateExpertiseArea = (index: number, area: string) => {
    const updated = [...expertises];
    updated[index].area = area;
    setExpertises(updated);
  };
  const addExpertiseTopic = (expertiseIndex: number) => {
    const updated = [...expertises];
    updated[expertiseIndex].topics.push('');
    setExpertises(updated);
  };
  const removeExpertiseTopic = (expertiseIndex: number, topicIndex: number) => {
    const updated = [...expertises];
    updated[expertiseIndex].topics = updated[expertiseIndex].topics.filter(
      (_, i) => i !== topicIndex,
    );
    setExpertises(updated);
  };
  const updateExpertiseTopic = (
    expertiseIndex: number,
    topicIndex: number,
    value: string,
  ) => {
    const updated = [...expertises];
    updated[expertiseIndex].topics[topicIndex] = value;
    setExpertises(updated);
  };

  const addSource = () =>
    setSources([...sources, { type: '', description: '' }]);
  const removeSource = (index: number) =>
    setSources(sources.filter((_, i) => i !== index));
  const updateSource = (
    index: number,
    field: 'type' | 'description',
    value: string,
  ) => {
    const updated = [...sources];
    updated[index][field] = value;
    setSources(updated);
  };

  const addRule = () => setRules([...rules, { type: 'tone', description: '' }]);
  const removeRule = (index: number) =>
    setRules(rules.filter((_, i) => i !== index));
  const updateRule = (
    index: number,
    field: 'type' | 'description',
    value: any,
  ) => {
    const updated = [...rules];
    updated[index][field] = value;
    setRules(updated);
  };

  const addAllowedContent = () => setAllowedContent([...allowedContent, '']);
  const removeAllowedContent = (index: number) =>
    setAllowedContent(allowedContent.filter((_, i) => i !== index));
  const updateAllowedContent = (index: number, value: string) => {
    const updated = [...allowedContent];
    updated[index] = value;
    setAllowedContent(updated);
  };

  const addDisallowedContent = () =>
    setDisallowedContent([...disallowedContent, '']);
  const removeDisallowedContent = (index: number) =>
    setDisallowedContent(disallowedContent.filter((_, i) => i !== index));
  const updateDisallowedContent = (index: number, value: string) => {
    const updated = [...disallowedContent];
    updated[index] = value;
    setDisallowedContent(updated);
  };

  const addSkill = () => setSkills([...skills, { name: '', description: '' }]);
  const removeSkill = (index: number) =>
    setSkills(skills.filter((_, i) => i !== index));
  const updateSkill = (
    index: number,
    field: keyof CompanionSkill,
    value: any,
  ) => {
    const updated = [...skills];
    updated[index][field] = value;
    setSkills(updated);
  };

  // Preview do prompt
  const generatePreview = () => {
    const companionData: CompanionStructure = {
      name,
      role,
      responsibilities: responsibilities.filter((r) => r.trim()),
      expertises: expertises.filter(
        (e) => e.area.trim() && e.topics.some((t) => t.trim()),
      ),
      sources: sources.filter((s) => s.type.trim() && s.description.trim()),
      rules: rules.filter((r) => r.description.trim()),
      contentPolicy: {
        allowed: allowedContent.filter((c) => c.trim()),
        disallowed: disallowedContent.filter((c) => c.trim()),
      },
      skills: skills.filter((s) => s.name.trim() && s.description.trim()),
      fallbacks: {
        ambiguous: fallbacks.ambiguous || undefined,
        out_of_scope: fallbacks.out_of_scope || undefined,
        unknown: fallbacks.unknown || undefined,
      },
    };

    return companionStructureToSystemPrompt(companionData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !role.trim()) {
      toast.error('Nome e papel são obrigatórios');
      return;
    }

    // Validações básicas
    const validResponsibilities = responsibilities.filter((r) => r.trim());
    const validExpertises = expertises.filter(
      (e) => e.area.trim() && e.topics.some((t) => t.trim()),
    );
    const validSources = sources.filter(
      (s) => s.type.trim() && s.description.trim(),
    );
    const validRules = rules.filter((r) => r.description.trim());
    const validAllowed = allowedContent.filter((c) => c.trim());
    const validDisallowed = disallowedContent.filter((c) => c.trim());

    if (validResponsibilities.length === 0) {
      toast.error('Pelo menos uma responsabilidade é obrigatória');
      return;
    }

    if (validExpertises.length === 0) {
      toast.error('Pelo menos uma expertise é obrigatória');
      return;
    }

    if (validSources.length === 0) {
      toast.error('Pelo menos uma fonte é obrigatória');
      return;
    }

    if (validRules.length === 0) {
      toast.error('Pelo menos uma regra é obrigatória');
      return;
    }

    if (validAllowed.length === 0 || validDisallowed.length === 0) {
      toast.error(
        'Política de conteúdo deve ter pelo menos um item permitido e um não permitido',
      );
      return;
    }

    setIsLoading(true);

    try {
      const companionData = {
        name: name.trim(),
        role: role.trim(),
        responsibilities: validResponsibilities,
        expertises: validExpertises.map((e) => ({
          area: e.area.trim(),
          topics: e.topics.filter((t) => t.trim()).map((t) => t.trim()),
        })),
        sources: validSources.map((s) => ({
          type: s.type.trim(),
          description: s.description.trim(),
        })),
        rules: validRules.map((r) => ({
          type: r.type,
          description: r.description.trim(),
        })),
        contentPolicy: {
          allowed: validAllowed,
          disallowed: validDisallowed,
        },
        skills: skills
          .filter((s) => s.name.trim() && s.description.trim())
          .map((s) => ({
            name: s.name.trim(),
            description: s.description.trim(),
            tools: s.tools,
            templates: s.templates,
            dados: s.dados,
            arquivos: s.arquivos,
            example: s.example?.trim() || undefined,
          })),
        fallbacks: {
          ambiguous: fallbacks.ambiguous.trim() || undefined,
          out_of_scope: fallbacks.out_of_scope.trim() || undefined,
          unknown: fallbacks.unknown.trim() || undefined,
        },
      };

      const url = isEditing
        ? `/api/companions/${companion.id}`
        : '/api/companions';

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar companion');
      }

      toast.success(
        isEditing
          ? 'Companion atualizado com sucesso!'
          : 'Companion criado com sucesso!',
      );

      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar companion:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao salvar companion',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {isEditing ? 'Editar Companion' : 'Novo Companion'}
          </CardTitle>
          <AlertDialog open={showPreview} onOpenChange={setShowPreview}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <AlertDialogHeader>
                <AlertDialogTitle>Preview do System Prompt</AlertDialogTitle>
              </AlertDialogHeader>
              <div className="mt-4">
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                  {generatePreview()}
                </pre>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ex: CEO.ai"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Papel *</Label>
                <Input
                  id="role"
                  type="text"
                  placeholder="Ex: CEO Estratégico da Humana"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Responsabilidades */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Responsabilidades *</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addResponsibility}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              {responsibilities.map((responsibility, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Ex: Definir estratégias corporativas"
                    value={responsibility}
                    onChange={(e) =>
                      updateResponsibility(index, e.target.value)
                    }
                    disabled={isLoading}
                  />
                  {responsibilities.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeResponsibility(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Expertises */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Áreas de Expertise *</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addExpertise}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Área
                </Button>
              </div>
              {expertises.map((expertise, expertiseIndex) => (
                <Card key={expertiseIndex} className="p-4">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ex: Gestão Estratégica"
                        value={expertise.area}
                        onChange={(e) =>
                          updateExpertiseArea(expertiseIndex, e.target.value)
                        }
                        disabled={isLoading}
                      />
                      {expertises.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeExpertise(expertiseIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Tópicos</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => addExpertiseTopic(expertiseIndex)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Tópico
                        </Button>
                      </div>
                      {expertise.topics.map((topic, topicIndex) => (
                        <div key={topicIndex} className="flex gap-2">
                          <Input
                            placeholder="Ex: Planejamento Estratégico"
                            value={topic}
                            onChange={(e) =>
                              updateExpertiseTopic(
                                expertiseIndex,
                                topicIndex,
                                e.target.value,
                              )
                            }
                            disabled={isLoading}
                          />
                          {expertise.topics.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                removeExpertiseTopic(expertiseIndex, topicIndex)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Fontes de Conhecimento */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Fontes de Conhecimento *</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addSource}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              {sources.map((source, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Tipo da fonte"
                    value={source.type}
                    onChange={(e) =>
                      updateSource(index, 'type', e.target.value)
                    }
                    disabled={isLoading}
                    className="w-1/3"
                  />
                  <Input
                    placeholder="Descrição da fonte"
                    value={source.description}
                    onChange={(e) =>
                      updateSource(index, 'description', e.target.value)
                    }
                    disabled={isLoading}
                    className="flex-1"
                  />
                  {sources.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeSource(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Regras de Comportamento */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Regras de Comportamento *</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addRule}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              {rules.map((rule, index) => (
                <div key={index} className="flex gap-2">
                  <Select
                    value={rule.type}
                    onValueChange={(value) => updateRule(index, 'type', value)}
                  >
                    <SelectTrigger className="w-1/4" disabled={isLoading}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tone">Tom</SelectItem>
                      <SelectItem value="restriction">Restrição</SelectItem>
                      <SelectItem value="clarification_prompt">
                        Clarificação
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Descrição da regra"
                    value={rule.description}
                    onChange={(e) =>
                      updateRule(index, 'description', e.target.value)
                    }
                    disabled={isLoading}
                    className="flex-1"
                  />
                  {rules.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeRule(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Política de Conteúdo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Conteúdo Permitido *</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addAllowedContent}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                {allowedContent.map((content, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Ex: Análises estratégicas"
                      value={content}
                      onChange={(e) =>
                        updateAllowedContent(index, e.target.value)
                      }
                      disabled={isLoading}
                    />
                    {allowedContent.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeAllowedContent(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Conteúdo Não Permitido *</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addDisallowedContent}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                {disallowedContent.map((content, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Ex: Informações confidenciais"
                      value={content}
                      onChange={(e) =>
                        updateDisallowedContent(index, e.target.value)
                      }
                      disabled={isLoading}
                    />
                    {disallowedContent.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeDisallowedContent(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Habilidades Especializadas (Opcional) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Habilidades Especializadas (Opcional)</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addSkill}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              {skills.map((skill, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nome da habilidade"
                        value={skill.name}
                        onChange={(e) =>
                          updateSkill(index, 'name', e.target.value)
                        }
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeSkill(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Descrição da habilidade"
                      value={skill.description}
                      onChange={(e) =>
                        updateSkill(index, 'description', e.target.value)
                      }
                      disabled={isLoading}
                      rows={2}
                    />
                    <Input
                      placeholder="Exemplo de uso (opcional)"
                      value={skill.example || ''}
                      onChange={(e) =>
                        updateSkill(index, 'example', e.target.value)
                      }
                      disabled={isLoading}
                    />
                  </div>
                </Card>
              ))}
            </div>

            {/* Respostas Padrão (Opcional) */}
            <div className="space-y-2">
              <Label>Respostas Padrão (Opcional)</Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Para perguntas ambíguas</Label>
                  <Textarea
                    placeholder="Resposta padrão quando a pergunta for ambígua"
                    value={fallbacks.ambiguous}
                    onChange={(e) =>
                      setFallbacks({ ...fallbacks, ambiguous: e.target.value })
                    }
                    disabled={isLoading}
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-sm">
                    Para assuntos fora do escopo
                  </Label>
                  <Textarea
                    placeholder="Resposta padrão para assuntos fora do escopo"
                    value={fallbacks.out_of_scope}
                    onChange={(e) =>
                      setFallbacks({
                        ...fallbacks,
                        out_of_scope: e.target.value,
                      })
                    }
                    disabled={isLoading}
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-sm">
                    Para informações desconhecidas
                  </Label>
                  <Textarea
                    placeholder="Resposta padrão quando não souber a resposta"
                    value={fallbacks.unknown}
                    onChange={(e) =>
                      setFallbacks({ ...fallbacks, unknown: e.target.value })
                    }
                    disabled={isLoading}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
