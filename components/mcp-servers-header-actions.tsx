'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function McpServersHeaderActions() {
  const handleNewServer = () => {
    window.dispatchEvent(new CustomEvent('mcp-servers:new'));
  };

  return (
    <Button 
      onClick={handleNewServer}
      className="flex items-center gap-2"
    >
      <Plus size={16} />
      Novo Servidor
    </Button>
  );
} 