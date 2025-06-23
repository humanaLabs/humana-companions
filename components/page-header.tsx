'use client';

import { useWindowSize } from 'usehooks-ts';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  children?: React.ReactNode;
  showBackButton?: boolean;
}

export function PageHeader({ title, description, badge, children, showBackButton = false }: PageHeaderProps) {
  const { open, state } = useSidebar();
  const { width: windowWidth } = useWindowSize();
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          {(state === 'collapsed' || !open || windowWidth < 768) && <SidebarToggle />}
          <div className="flex items-start gap-3">
            <div>
              <div className="flex items-center gap-2">
                {showBackButton && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleBack}
                    className="h-5 w-5 p-0 text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 rounded-sm"
                  >
                    <ArrowLeft size={11} strokeWidth={1.5} />
                  </Button>
                )}
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                {badge && (
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    {badge}
                  </div>
                )}
              </div>
              {description && (
                <p className="text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
} 