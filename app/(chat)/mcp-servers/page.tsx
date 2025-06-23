import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { McpServersPageClient } from '@/components/mcp-servers-page-client';

export default async function McpServersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Gerenciador MCP" 
        description="Configure e gerencie servidores Model Context Protocol"
      />
      
      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-auto">
        <McpServersPageClient />
      </div>
    </div>
  );
} 