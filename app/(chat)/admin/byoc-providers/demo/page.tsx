'use client';

import { PageHeader } from '@/components/page-header';
import { BYOCDemo } from '@/components/byoc-demo';

export default function BYOCDemoPage() {
  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="BYOC Demo" 
        description="Teste seus providers BYOC configurados em ação"
        badge="Demonstração"
        showBackButton={true}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl w-full mx-auto">
          <BYOCDemo />
        </div>
      </div>
    </div>
  );
} 