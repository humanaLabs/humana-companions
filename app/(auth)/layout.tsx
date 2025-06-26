import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Autenticação - Humana Companions',
  description: 'Entre ou cadastre-se no Humana Companions',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
} 