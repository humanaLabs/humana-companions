import { db } from './index';
import { role } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Script para popular as tabelas de administração com dados iniciais
 * - Roles do sistema (Admin, Manager, User)
 */

const systemRoles = [
  {
    name: 'admin',
    displayName: 'Administrador',
    description: 'Acesso completo ao sistema, pode gerenciar usuários, organizações e configurações',
    permissions: [
      // Usuários
      'users.view',
      'users.create',
      'users.edit',
      'users.delete',
      'users.roles.manage',
      
      // Organizações
      'organizations.view',
      'organizations.create',
      'organizations.edit',
      'organizations.delete',
      'organizations.members.manage',
      
      // Times
      'teams.view',
      'teams.create',
      'teams.edit',
      'teams.delete',
      'teams.members.manage',
      
      // Companions
      'companions.view',
      'companions.create',
      'companions.edit',
      'companions.delete',
      'companions.analytics.view',
      
      // MCP Servers
      'mcp-servers.view',
      'mcp-servers.create',
      'mcp-servers.edit',
      'mcp-servers.delete',
      'mcp-servers.test',
      
      // Data Room
      'data-room.view',
      'data-room.documents.manage',
      'data-room.templates.manage',
      'data-room.integrations.manage',
      
      // Studio
      'studio.view',
      'studio.organizations.design',
      'studio.companions.design',
      
      // Aplicativos
      'applications.view',
      'applications.manage',
      
      // University
      'university.view',
      'university.manage',
      
      // Sistema
      'system.audit.view',
      'system.settings.manage',
    ],
    isSystemRole: true,
  },
  {
    name: 'manager',
    displayName: 'Gerente',
    description: 'Pode gerenciar sua organização, times e recursos associados',
    permissions: [
      // Usuários (limitado à organização)
      'users.view',
      'users.edit.own_organization',
      'users.roles.manage.own_organization',
      
      // Organizações (apenas a própria)
      'organizations.view.own',
      'organizations.edit.own',
      'organizations.members.manage.own',
      
      // Times (apenas da organização)
      'teams.view.own_organization',
      'teams.create.own_organization',
      'teams.edit.own_organization',
      'teams.delete.own_organization',
      'teams.members.manage.own_organization',
      
      // Companions (apenas da organização)
      'companions.view.own_organization',
      'companions.create.own_organization',
      'companions.edit.own_organization',
      'companions.delete.own_organization',
      'companions.analytics.view.own_organization',
      
      // MCP Servers (apenas da organização)
      'mcp-servers.view.own_organization',
      'mcp-servers.create.own_organization',
      'mcp-servers.edit.own_organization',
      'mcp-servers.delete.own_organization',
      'mcp-servers.test.own_organization',
      
      // Data Room (apenas da organização)
      'data-room.view.own_organization',
      'data-room.documents.manage.own_organization',
      'data-room.templates.manage.own_organization',
      'data-room.integrations.manage.own_organization',
      
      // Studio (apenas da organização)
      'studio.view.own_organization',
      'studio.organizations.design.own',
      'studio.companions.design.own_organization',
      
      // Aplicativos (apenas da organização)
      'applications.view.own_organization',
      'applications.manage.own_organization',
      
      // University (apenas da organização)
      'university.view.own_organization',
      'university.manage.own_organization',
    ],
    isSystemRole: true,
  },
  {
    name: 'user',
    displayName: 'Usuário',
    description: 'Acesso básico para usar o sistema e recursos permitidos',
    permissions: [
      // Companions (apenas próprios ou compartilhados)
      'companions.view.own',
      'companions.view.shared',
      'companions.create.own',
      'companions.edit.own',
      'companions.delete.own',
      'companions.use',
      
      // MCP Servers (apenas próprios)
      'mcp-servers.view.own',
      'mcp-servers.create.own',
      'mcp-servers.edit.own',
      'mcp-servers.delete.own',
      'mcp-servers.test.own',
      
      // Data Room (apenas próprios ou compartilhados)
      'data-room.view.own',
      'data-room.view.shared',
      'data-room.documents.view.own',
      'data-room.documents.create.own',
      'data-room.templates.view',
      
      // Chat
      'chat.create',
      'chat.view.own',
      'chat.edit.own',
      'chat.delete.own',
      'chat.folders.manage.own',
      
      // Studio (visualização apenas)
      'studio.view.limited',
      
      // Aplicativos (uso básico)
      'applications.view.public',
      'applications.use',
      
      // University (uso básico)
      'university.view.public',
      'university.participate',
      
      // Perfil próprio
      'profile.view.own',
      'profile.edit.own',
    ],
    isSystemRole: true,
  },
];

export async function seedAdminData() {
  console.log('🌱 Populando dados de administração...');
  
  try {
    // Inserir roles do sistema
    for (const roleData of systemRoles) {
      const existingRole = await db
        .select()
        .from(role)
        .where(eq(role.name, roleData.name))
        .limit(1);
      
      if (existingRole.length === 0) {
        await db.insert(role).values(roleData);
        console.log(`✅ Role '${roleData.displayName}' criado`);
      } else {
        // Atualizar permissões se o role já existe
        await db
          .update(role)
          .set({
            permissions: roleData.permissions,
            description: roleData.description,
            updatedAt: new Date(),
          })
          .where(eq(role.name, roleData.name));
        console.log(`🔄 Role '${roleData.displayName}' atualizado`);
      }
    }
    
    console.log('✅ Dados de administração populados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao popular dados de administração:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedAdminData()
    .then(() => {
      console.log('🎉 Seed concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro no seed:', error);
      process.exit(1);
    });
} 