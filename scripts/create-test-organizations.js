const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { organization } = require('../lib/db/schema');

const client = postgres(process.env.POSTGRES_URL);
const db = drizzle(client);

async function createTestOrganizations() {
  console.log('🔧 Criando organizações de teste...');
  
  const testOrgs = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Humana AI Corp',
      description: 'Organização principal da Humana AI',
      userId: 'b00e5284-aa20-4b6a-9248-b7546b16499a', // eduibrahim@yahoo.com.br
      tenantConfig: {},
      values: [],
      teams: [],
      positions: [],
      orgUsers: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Inovação & Tecnologia',
      description: 'Organização focada em inovação e desenvolvimento tecnológico',
      userId: 'b00e5284-aa20-4b6a-9248-b7546b16499a', // eduibrahim@yahoo.com.br
      tenantConfig: {},
      values: [],
      teams: [],
      positions: [],
      orgUsers: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Consultoria Empresarial',
      description: 'Organização de consultoria para grandes empresas',
      userId: 'b00e5284-aa20-4b6a-9248-b7546b16499a', // eduibrahim@yahoo.com.br
      tenantConfig: {},
      values: [],
      teams: [],
      positions: [],
      orgUsers: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  try {
    // Primeiro, verificar se já existem organizações
    const existing = await db.select().from(organization);
    console.log('📊 Organizações existentes no banco:', existing.length);
    
    if (existing.length > 0) {
      console.log('🏢 Organizações encontradas:');
      existing.forEach((org, index) => {
        console.log(`  ${index + 1}. ${org.name} (ID: ${org.id})`);
      });
    }

    // Inserir organizações de teste
    console.log('🔧 Inserindo organizações de teste...');
    
    for (const testOrg of testOrgs) {
      try {
        // Verificar se a organização já existe
        const existingOrg = existing.find(org => org.id === testOrg.id);
        
        if (!existingOrg) {
          await db.insert(organization).values(testOrg);
          console.log(`✅ Organização criada: ${testOrg.name}`);
        } else {
          console.log(`⚠️ Organização já existe: ${testOrg.name}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao criar organização ${testOrg.name}:`, error.message);
      }
    }

    // Verificar resultado final
    const final = await db.select().from(organization);
    console.log('🎉 Total de organizações após inserção:', final.length);
    
    if (final.length > 0) {
      console.log('🏢 Organizações finais:');
      final.forEach((org, index) => {
        console.log(`  ${index + 1}. ${org.name} (ID: ${org.id}, Criado por: ${org.userId})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro crítico:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada');
  }
}

createTestOrganizations(); 