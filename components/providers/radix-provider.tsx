'use client';

interface RadixProviderProps {
  children: React.ReactNode;
}

export function RadixProvider({ children }: RadixProviderProps) {
  return <>{children}</>;
} 