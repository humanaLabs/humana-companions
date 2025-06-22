import { z } from 'zod';

// Schema para configuração do tenant
export const tenantConfigSchema = z.object({
  timezone: z.string().min(1, 'Timezone é obrigatório'),
  language: z.string().min(1, 'Idioma é obrigatório'),
  llm_provider: z.string().min(1, 'Provedor LLM é obrigatório'),
  default_model: z.string().min(1, 'Modelo padrão é obrigatório'),
});

// Schema para valores organizacionais
export const organizationValueSchema = z.object({
  name: z.string().min(1, 'Nome do valor é obrigatório'),
  description: z.string().min(1, 'Descrição do valor é obrigatória'),
  expected_behaviors: z.array(z.string().min(1, 'Comportamento não pode estar vazio')),
});

// Schema para membros de equipe
export const teamMemberSchema = z.object({
  user_id: z.string().min(1, 'ID do usuário é obrigatório'),
  role: z.enum(['admin', 'viewer', 'editor'], {
    required_error: 'Papel é obrigatório',
  }),
  permissions: z.array(z.string()),
});

// Schema para equipes
export const teamSchema = z.object({
  id: z.string().min(1, 'ID da equipe é obrigatório'),
  name: z.string().min(1, 'Nome da equipe é obrigatório'),
  description: z.string().min(1, 'Descrição da equipe é obrigatória'),
  members: z.array(teamMemberSchema),
});

// Schema para companions de posição
export const positionCompanionSchema = z.object({
  companion_id: z.string().min(1, 'ID do companion é obrigatório'),
  name: z.string().min(1, 'Nome do companion é obrigatório'),
  status: z.enum(['active', 'inactive', 'draft'], {
    required_error: 'Status é obrigatório',
  }),
  linked_team_id: z.string().min(1, 'ID da equipe vinculada é obrigatório'),
});

// Schema para posições/cargos
export const positionSchema = z.object({
  id: z.string().min(1, 'ID da posição é obrigatório'),
  title: z.string().min(1, 'Título da posição é obrigatório'),
  description: z.string().min(1, 'Descrição da posição é obrigatória'),
  reports_to: z.string().nullable(),
  r_and_r: z.array(z.string().min(1, 'R&R não pode estar vazio')),
  companions: z.array(positionCompanionSchema),
});

// Schema para usuários da organização
export const orgUserSchema = z.object({
  id: z.string().min(1, 'ID do usuário é obrigatório'),
  name: z.string().min(1, 'Nome do usuário é obrigatório'),
  email: z.string().email('Email inválido'),
  teams: z.array(z.string()),
  accessible_companions: z.array(z.string()),
});

// Schema principal para organizações
export const organizationSchema = z.object({
  name: z.string().min(1, 'Nome da organização é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().min(1, 'Descrição da organização é obrigatória'),
  tenantConfig: tenantConfigSchema,
  values: z.array(organizationValueSchema).min(1, 'Pelo menos um valor é obrigatório'),
  teams: z.array(teamSchema).min(1, 'Pelo menos uma equipe é obrigatória'),
  positions: z.array(positionSchema).min(1, 'Pelo menos uma posição é obrigatória'),
  orgUsers: z.array(orgUserSchema),
});

// Schema para criação de organização (sem ID)
export const createOrganizationSchema = organizationSchema;

// Schema para atualização de organização (todos os campos opcionais)
export const updateOrganizationSchema = organizationSchema.partial();

// Schema para input de geração de organização com IA
export const generateOrganizationInputSchema = z.object({
  name: z.string().min(1, 'Nome da organização é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().min(1, 'Descrição da organização é obrigatória').max(500, 'Descrição muito longa'),
  orgChart: z.string().min(1, 'Estrutura organizacional é obrigatória').max(2000, 'Estrutura muito longa'),
});

export type OrganizationInput = z.infer<typeof organizationSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type GenerateOrganizationInput = z.infer<typeof generateOrganizationInputSchema>; 