'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Building2, Users, Briefcase, Target, Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from './toast';
import type { OrganizationStructure } from '@/lib/types';

interface OrganizationFormProps {
  organization?: OrganizationStructure | null;
  onClose: () => void;
  onSave: (organization: OrganizationStructure) => void;
}

export function OrganizationForm({ organization, onClose, onSave }: OrganizationFormProps) {
  const [formData, setFormData] = useState<OrganizationStructure>({
    name: '',
    description: '',
    tenantConfig: {
      timezone: 'America/Sao_Paulo',
      language: 'pt-BR',
      llm_provider: 'azure-openai',
      default_model: 'gpt-4o',
    },
    values: [{ name: '', description: '', expected_behaviors: [''] }],
    teams: [{ id: '', name: '', description: '', members: [] }],
    positions: [{ 
      id: '', 
      title: '', 
      description: '', 
      reports_to: null, 
      r_and_r: [''],
      companions: []
    }],
    orgUsers: [],
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (organization) {
      setFormData(organization);
    }
  }, [organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim()) {
      toast({
        type: 'error',
        description: 'Nome e descrição são obrigatórios.',
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const url = organization ? `/api/organizations/${organization.id}` : '/api/organizations';
      const method = organization ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar organização');
      }

      const savedOrganization = await response.json();
      onSave(savedOrganization);
      
      toast({
        type: 'success',
        description: organization ? 'Organização atualizada com sucesso!' : 'Organização criada com sucesso!',
      });
    } catch (error: any) {
      console.error('Error saving organization:', error);
      toast({
        type: 'error',
        description: error.message || 'Erro ao salvar organização. Tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (section: string, index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section as keyof OrganizationStructure].map((item: any, i: number) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addArrayItem = (section: string, newItem: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section as keyof OrganizationStructure], newItem],
    }));
  };

  const removeArrayItem = (section: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section as keyof OrganizationStructure].filter((_: any, i: number) => i !== index),
    }));
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">
              {organization ? 'Editar Organização' : 'Nova Organização'}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                <div>
                  <Label htmlFor="name">Nome da Organização *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <Label htmlFor="language">Idioma</Label>
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
                </div>
              </div>
              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  disabled={isSaving}
                  rows={3}
                />
              </div>
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
                    <div>
                      <Label>Nome do Valor</Label>
                      <Input
                        value={value.name}
                        onChange={(e) => updateNestedField('values', index, 'name', e.target.value)}
                        disabled={isSaving}
                      />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={value.description}
                        onChange={(e) => updateNestedField('values', index, 'description', e.target.value)}
                        disabled={isSaving}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Comportamentos Esperados</Label>
                      {value.expected_behaviors.map((behavior, behaviorIndex) => (
                        <div key={behaviorIndex} className="flex gap-2 mt-2">
                          <Input
                            value={behavior}
                            onChange={(e) => {
                              const newValues = [...formData.values];
                              newValues[index].expected_behaviors[behaviorIndex] = e.target.value;
                              updateField('values', newValues);
                            }}
                            disabled={isSaving}
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
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Comportamento
                      </Button>
                    </div>
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
                    <div>
                      <Label>ID da Equipe</Label>
                      <Input
                        value={team.id}
                        onChange={(e) => updateNestedField('teams', index, 'id', e.target.value)}
                        disabled={isSaving}
                        placeholder="ex: team_product"
                      />
                    </div>
                    <div>
                      <Label>Nome da Equipe</Label>
                      <Input
                        value={team.name}
                        onChange={(e) => updateNestedField('teams', index, 'name', e.target.value)}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Label>Descrição</Label>
                    <Textarea
                      value={team.description}
                      onChange={(e) => updateNestedField('teams', index, 'description', e.target.value)}
                      disabled={isSaving}
                      rows={2}
                    />
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
                      <div>
                        <Label>ID da Posição</Label>
                        <Input
                          value={position.id}
                          onChange={(e) => updateNestedField('positions', index, 'id', e.target.value)}
                          disabled={isSaving}
                          placeholder="ex: pos_ceo"
                        />
                      </div>
                      <div>
                        <Label>Título do Cargo</Label>
                        <Input
                          value={position.title}
                          onChange={(e) => updateNestedField('positions', index, 'title', e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={position.description}
                        onChange={(e) => updateNestedField('positions', index, 'description', e.target.value)}
                        disabled={isSaving}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Reporta para</Label>
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
                    </div>
                    <div>
                      <Label>Responsabilidades (R&R)</Label>
                      {position.r_and_r.map((rr, rrIndex) => (
                        <div key={rrIndex} className="flex gap-2 mt-2">
                          <Input
                            value={rr}
                            onChange={(e) => {
                              const newPositions = [...formData.positions];
                              newPositions[index].r_and_r[rrIndex] = e.target.value;
                              updateField('positions', newPositions);
                            }}
                            disabled={isSaving}
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
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar R&R
                      </Button>
                    </div>
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

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" disabled={isSaving} className="flex-1">
              {isSaving ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {organization ? 'Atualizar' : 'Criar'} Organização
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 