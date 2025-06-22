import { z } from 'zod';

export const companionExpertiseSchema = z.object({
  area: z.string().min(1, 'Área é obrigatória'),
  topics: z.array(z.string().min(1, 'Tópico não pode estar vazio')).min(1, 'Pelo menos um tópico é obrigatório'),
});

export const companionSourceSchema = z.object({
  type: z.string().min(1, 'Tipo da fonte é obrigatório'),
  description: z.string().min(1, 'Descrição da fonte é obrigatória'),
});

export const companionRuleSchema = z.object({
  type: z.enum(['tone', 'restriction', 'clarification_prompt']),
  description: z.string().min(1, 'Descrição da regra é obrigatória'),
});

export const companionContentPolicySchema = z.object({
  allowed: z.array(z.string().min(1, 'Item permitido não pode estar vazio')).min(1, 'Pelo menos um item permitido é obrigatório'),
  disallowed: z.array(z.string().min(1, 'Item não permitido não pode estar vazio')).min(1, 'Pelo menos um item não permitido é obrigatório'),
});

export const companionSkillDataSchema = z.object({
  origem: z.string().min(1, 'Origem é obrigatória'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
});

export const companionSkillFileSchema = z.object({
  nome: z.string().min(1, 'Nome do arquivo é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
});

export const companionSkillSchema = z.object({
  name: z.string().min(1, 'Nome da habilidade é obrigatório'),
  description: z.string().min(1, 'Descrição da habilidade é obrigatória'),
  tools: z.array(z.string()).optional(),
  templates: z.array(z.string()).optional(),
  dados: z.array(companionSkillDataSchema).optional(),
  arquivos: z.array(companionSkillFileSchema).optional(),
  example: z.string().optional(),
});

export const companionFallbacksSchema = z.object({
  ambiguous: z.string().optional(),
  out_of_scope: z.string().optional(),
  unknown: z.string().optional(),
});

export const createCompanionSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  role: z.string().min(1, 'Papel é obrigatório'),
  responsibilities: z.array(z.string().min(1, 'Responsabilidade não pode estar vazia')).min(1, 'Pelo menos uma responsabilidade é obrigatória'),
  expertises: z.array(companionExpertiseSchema).min(1, 'Pelo menos uma expertise é obrigatória'),
  sources: z.array(companionSourceSchema).min(1, 'Pelo menos uma fonte é obrigatória'),
  rules: z.array(companionRuleSchema).min(1, 'Pelo menos uma regra é obrigatória'),
  contentPolicy: companionContentPolicySchema,
  skills: z.array(companionSkillSchema).optional(),
  fallbacks: companionFallbacksSchema.optional(),
});

export const updateCompanionSchema = createCompanionSchema;

export type CreateCompanionRequest = z.infer<typeof createCompanionSchema>;
export type UpdateCompanionRequest = z.infer<typeof updateCompanionSchema>; 