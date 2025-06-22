import type { Companion } from '@/lib/db/schema';
import type { CompanionStructure } from '@/lib/types';

/**
 * Converte um Companion com estrutura completa em um system prompt formatado
 */
export function companionToSystemPrompt(companion: Companion): string {
  // Se for um companion legado (só com instruction), usar o formato antigo
  if (companion.instruction && !companion.role) {
    return companion.instruction;
  }

  // Parse dos campos JSON
  const responsibilities = Array.isArray(companion.responsibilities) 
    ? companion.responsibilities 
    : JSON.parse(companion.responsibilities as string);
  
  const expertises = Array.isArray(companion.expertises)
    ? companion.expertises
    : JSON.parse(companion.expertises as string);
  
  const sources = Array.isArray(companion.sources)
    ? companion.sources
    : JSON.parse(companion.sources as string);
  
  const rules = Array.isArray(companion.rules)
    ? companion.rules
    : JSON.parse(companion.rules as string);
  
  const contentPolicy = typeof companion.contentPolicy === 'object'
    ? companion.contentPolicy
    : JSON.parse(companion.contentPolicy as string);

  const skills = companion.skills 
    ? (Array.isArray(companion.skills) ? companion.skills : JSON.parse(companion.skills as string))
    : null;
  
  const fallbacks = companion.fallbacks
    ? (typeof companion.fallbacks === 'object' ? companion.fallbacks : JSON.parse(companion.fallbacks as string))
    : null;

  // Construir o system prompt formatado
  let prompt = `# ${companion.name}

**Papel:** ${companion.role}

## Responsabilidades
${responsibilities.map((resp: string) => `- ${resp}`).join('\n')}

## Áreas de Expertise`;

  expertises.forEach((expertise: any) => {
    prompt += `\n\n### ${expertise.area}`;
    prompt += `\n${expertise.topics.map((topic: string) => `- ${topic}`).join('\n')}`;
  });

  prompt += `\n\n## Fontes de Conhecimento`;
  sources.forEach((source: any) => {
    prompt += `\n\n**${source.type}:** ${source.description}`;
  });

  prompt += `\n\n## Diretrizes de Comportamento`;
  
  const toneRules = rules.filter((rule: any) => rule.type === 'tone');
  const restrictions = rules.filter((rule: any) => rule.type === 'restriction');
  const clarificationPrompts = rules.filter((rule: any) => rule.type === 'clarification_prompt');

  if (toneRules.length > 0) {
    prompt += `\n\n### Tom e Estilo`;
    toneRules.forEach((rule: any) => {
      prompt += `\n- ${rule.description}`;
    });
  }

  if (restrictions.length > 0) {
    prompt += `\n\n### Restrições`;
    restrictions.forEach((rule: any) => {
      prompt += `\n- ${rule.description}`;
    });
  }

  prompt += `\n\n## Política de Conteúdo

### Conteúdo Permitido`;
  contentPolicy.allowed.forEach((item: string) => {
    prompt += `\n- ${item}`;
  });

  prompt += `\n\n### Conteúdo Não Permitido`;
  contentPolicy.disallowed.forEach((item: string) => {
    prompt += `\n- ${item}`;
  });

  // Adicionar skills se existirem
  if (skills && skills.length > 0) {
    prompt += `\n\n## Habilidades Especializadas`;
    skills.forEach((skill: any) => {
      prompt += `\n\n### ${skill.name}`;
      prompt += `\n${skill.description}`;
      
      if (skill.example) {
        prompt += `\n\n**Exemplo:** ${skill.example}`;
      }
      
      if (skill.tools && skill.tools.length > 0) {
        prompt += `\n\n**Ferramentas:** ${skill.tools.join(', ')}`;
      }
    });
  }

  // Adicionar prompts de clarificação
  if (clarificationPrompts.length > 0) {
    prompt += `\n\n## Quando Precisar de Clarificação`;
    clarificationPrompts.forEach((rule: any) => {
      prompt += `\n- ${rule.description}`;
    });
  }

  // Adicionar fallbacks se existirem
  if (fallbacks) {
    prompt += `\n\n## Respostas Padrão`;
    
    if (fallbacks.ambiguous) {
      prompt += `\n\n**Para perguntas ambíguas:** ${fallbacks.ambiguous}`;
    }
    
    if (fallbacks.out_of_scope) {
      prompt += `\n\n**Para assuntos fora do escopo:** ${fallbacks.out_of_scope}`;
    }
    
    if (fallbacks.unknown) {
      prompt += `\n\n**Para informações desconhecidas:** ${fallbacks.unknown}`;
    }
  }

  prompt += `\n\n---

Você é ${companion.name} e deve seguir rigorosamente todas as diretrizes acima. Mantenha-se sempre no seu papel e use suas expertises para fornecer respostas precisas e úteis dentro do seu escopo de atuação.`;

  return prompt;
}

/**
 * Função auxiliar para converter estrutura CompanionStructure em system prompt
 * (útil para preview antes de salvar)
 */
export function companionStructureToSystemPrompt(companionData: CompanionStructure): string {
  // Simular um objeto Companion para usar a função principal
  const mockCompanion: Partial<Companion> = {
    name: companionData.name,
    role: companionData.role,
    responsibilities: companionData.responsibilities,
    expertises: companionData.expertises,
    sources: companionData.sources,
    rules: companionData.rules,
    contentPolicy: companionData.contentPolicy,
    skills: companionData.skills,
    fallbacks: companionData.fallbacks,
  };

  return companionToSystemPrompt(mockCompanion as Companion);
} 