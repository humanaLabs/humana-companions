'use client';

import { Plus, Trash2, Building2, Users, Briefcase, Target, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { OrganizationStructure } from '@/lib/types';

interface OrganizationFormFieldsProps {
  formData: OrganizationStructure;
  setFormData: (data: OrganizationStructure) => void;
  isSaving: boolean;
}

interface FieldWithTooltipProps {
  label: string;
  tooltip: string;
  children: React.ReactNode;
}

function FieldWithTooltip({ label, tooltip, children }: FieldWithTooltipProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Label>{label}</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {children}
    </div>
  );
}

export function OrganizationFormFields({ formData, setFormData, isSaving }: OrganizationFormFieldsProps) {
  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const updateNestedField = (section: string, index: number, field: string, value: any) => {
    setFormData({
      ...formData,
      [section]: (formData[section as keyof OrganizationStructure] as any[]).map((item: any, i: number) =>
        i === index ? { ...item, [field]: value } : item
      ),
    });
  };

  const addArrayItem = (section: string, newItem: any) => {
    setFormData({
      ...formData,
      [section]: [...(formData[section as keyof OrganizationStructure] as any[]), newItem],
    });
  };

  const removeArrayItem = (section: string, index: number) => {
    setFormData({
      ...formData,
      [section]: (formData[section as keyof OrganizationStructure] as any[]).filter((_: any, i: number) => i !== index),
    });
  };

  const addBehavior = (valueIndex: number) => {
    const newValues = [...formData.values];
    newValues[valueIndex].expected_behaviors.push('');
    updateField('values', newValues);
  };

  const removeBehavior = (valueIndex: number, behaviorIndex: number) => {
    const newValues = [...formData.values];
    newValues[valueIndex].expected_behaviors = newValues[valueIndex].expected_behaviors.filter((_, i) => i !== behaviorIndex);
    updateField('values', newValues);
  };

  const updateBehavior = (valueIndex: number, behaviorIndex: number, value: string) => {
    const newValues = [...formData.values];
    newValues[valueIndex].expected_behaviors[behaviorIndex] = value;
    updateField('values', newValues);
  };

  const addRR = (positionIndex: number) => {
    const newPositions = [...formData.positions];
    newPositions[positionIndex].r_and_r.push('');
    updateField('positions', newPositions);
  };

  const removeRR = (positionIndex: number, rrIndex: number) => {
    const newPositions = [...formData.positions];
    newPositions[positionIndex].r_and_r = newPositions[positionIndex].r_and_r.filter((_, i) => i !== rrIndex);
    updateField('positions', newPositions);
  };

  const updateRR = (positionIndex: number, rrIndex: number, value: string) => {
    const newPositions = [...formData.positions];
    newPositions[positionIndex].r_and_r[rrIndex] = value;
    updateField('positions', newPositions);
  };

  return (
    <>
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldWithTooltip
              label="Nome da Organização *"
              tooltip="Nome oficial da organização que aparecerá em todos os contextos"
            >
              <Input
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                disabled={isSaving}
                placeholder="Ex: Humana AI"
              />
            </FieldWithTooltip>
            <FieldWithTooltip
              label="Idioma"
              tooltip="Idioma principal usado na organização para comunicação e documentação"
            >
              <Select
                value={formData.tenantConfig.language}
                onValueChange={(value) => updateField('tenantConfig', { ...formData.tenantConfig, language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es-ES">Español</SelectItem>
                </SelectContent>
              </Select>
            </FieldWithTooltip>
          </div>
          <FieldWithTooltip
            label="Descrição *"
            tooltip="Descrição detalhada do propósito, missão e contexto da organização"
          >
            <Textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              disabled={isSaving}
              rows={3}
              placeholder="Ex: Plataforma de aprendizado corporativo com IA integrada..."
            />
          </FieldWithTooltip>
        </CardContent>
      </Card>

      {/* Valores Organizacionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Valores Organizacionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.values.map((value, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium">Valor {index + 1}</h4>
                {formData.values.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArrayItem('values', index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                <FieldWithTooltip
                  label="Nome do Valor"
                  tooltip="Nome conciso que identifica este valor organizacional"
                >
                  <Input
                    value={value.name}
                    onChange={(e) => updateNestedField('values', index, 'name', e.target.value)}
                    disabled={isSaving}
                    placeholder="Ex: Integridade, Inovação, Colaboração"
                  />
                </FieldWithTooltip>
                <FieldWithTooltip
                  label="Descrição"
                  tooltip="Explicação detalhada do que este valor significa para a organização"
                >
                  <Textarea
                    value={value.description}
                    onChange={(e) => updateNestedField('values', index, 'description', e.target.value)}
                    disabled={isSaving}
                    rows={2}
                    placeholder="Ex: Agir com honestidade e transparência em todas as decisões..."
                  />
                </FieldWithTooltip>
                <FieldWithTooltip
                  label="Princípios"
                  tooltip="Princípios práticos que demonstram como este valor deve ser aplicado no dia a dia"
                >
                  <div className="space-y-2">
                    {value.expected_behaviors.map((behavior, behaviorIndex) => (
                      <div key={behaviorIndex} className="flex gap-2">
                        <Input
                          value={behavior}
                          onChange={(e) => updateBehavior(index, behaviorIndex, e.target.value)}
                          disabled={isSaving}
                          placeholder="Ex: Sempre divulgar potenciais conflitos de interesse"
                        />
                        {value.expected_behaviors.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBehavior(index, behaviorIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBehavior(index)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Princípio
                    </Button>
                  </div>
                </FieldWithTooltip>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => addArrayItem('values', { name: '', description: '', expected_behaviors: [''] })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Valor
          </Button>
        </CardContent>
      </Card>

      {/* Equipes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Equipes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.teams.map((team, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium">Equipe {index + 1}</h4>
                {formData.teams.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArrayItem('teams', index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldWithTooltip
                  label="ID da Equipe"
                  tooltip="Identificador único da equipe em formato snake_case (ex: team_product)"
                >
                  <Input
                    value={team.id}
                    onChange={(e) => updateNestedField('teams', index, 'id', e.target.value)}
                    disabled={isSaving}
                    placeholder="ex: team_product"
                  />
                </FieldWithTooltip>
                <FieldWithTooltip
                  label="Nome da Equipe"
                  tooltip="Nome descritivo da equipe que será exibido na interface"
                >
                  <Input
                    value={team.name}
                    onChange={(e) => updateNestedField('teams', index, 'name', e.target.value)}
                    disabled={isSaving}
                    placeholder="Ex: Equipe de Produto"
                  />
                </FieldWithTooltip>
              </div>
              <div className="mt-3">
                <FieldWithTooltip
                  label="Descrição"
                  tooltip="Descrição das responsabilidades e foco principal desta equipe"
                >
                  <Textarea
                    value={team.description}
                    onChange={(e) => updateNestedField('teams', index, 'description', e.target.value)}
                    disabled={isSaving}
                    rows={2}
                    placeholder="Ex: Responsável pela estratégia e desenvolvimento de produtos..."
                  />
                </FieldWithTooltip>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => addArrayItem('teams', { id: '', name: '', description: '', members: [] })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Equipe
          </Button>
        </CardContent>
      </Card>

      {/* Posições */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Posições
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.positions.map((position, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium">Posição {index + 1}</h4>
                {formData.positions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArrayItem('positions', index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldWithTooltip
                    label="Título da Posição"
                    tooltip="Nome oficial da posição/cargo na organização"
                  >
                    <Input
                      value={position.title}
                      onChange={(e) => updateNestedField('positions', index, 'title', e.target.value)}
                      disabled={isSaving}
                      placeholder="Ex: Chief Executive Officer"
                    />
                  </FieldWithTooltip>
                  <FieldWithTooltip
                    label="ID da Posição"
                    tooltip="Identificador único da posição em formato snake_case (ex: pos_ceo)"
                  >
                    <Input
                      value={position.id}
                      onChange={(e) => updateNestedField('positions', index, 'id', e.target.value)}
                      disabled={isSaving}
                      placeholder="ex: pos_ceo"
                    />
                  </FieldWithTooltip>
                </div>
                <FieldWithTooltip
                  label="Descrição"
                  tooltip="Descrição detalhada do propósito e contexto desta posição na organização"
                >
                  <Textarea
                    value={position.description}
                    onChange={(e) => updateNestedField('positions', index, 'description', e.target.value)}
                    disabled={isSaving}
                    rows={2}
                    placeholder="Ex: Lidera a visão, estratégia e cultura da organização..."
                  />
                </FieldWithTooltip>
                <FieldWithTooltip
                  label="Reporta para"
                  tooltip="Posição hierárquica superior a quem esta posição se reporta"
                >
                  <Select
                    value={position.reports_to || 'none'}
                    onValueChange={(value) => updateNestedField('positions', index, 'reports_to', value === 'none' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma posição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma (CEO/Presidente)</SelectItem>
                      {formData.positions
                        .filter((_, i) => i !== index)
                        .map((pos) => (
                          <SelectItem key={pos.id} value={pos.id}>
                            {pos.title || pos.id}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </FieldWithTooltip>
                <FieldWithTooltip
                  label="Responsabilidades (R&R)"
                  tooltip="Roles & Responsibilities - principais responsabilidades e atribuições desta posição"
                >
                  <div className="space-y-2">
                    {position.r_and_r.map((rr, rrIndex) => (
                      <div key={rrIndex} className="flex gap-2">
                        <Input
                          value={rr}
                          onChange={(e) => updateRR(index, rrIndex, e.target.value)}
                          disabled={isSaving}
                          placeholder="Ex: Definir visão e missão de longo prazo"
                        />
                        {position.r_and_r.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRR(index, rrIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addRR(index)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar R&R
                    </Button>
                  </div>
                </FieldWithTooltip>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => addArrayItem('positions', {
              id: '',
              title: '',
              description: '',
              reports_to: null,
              r_and_r: [''],
              companions: []
            })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Posição
          </Button>
        </CardContent>
      </Card>
    </>
  );
} 