'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ExperimentalButtonProps {
  children: React.ReactNode;
  variant?: 'gradient' | 'neon' | 'morphing' | 'glitch';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function ExperimentalButton({
  children,
  variant = 'gradient',
  size = 'md',
  onClick,
  disabled = false,
  className
}: ExperimentalButtonProps) {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);
    onClick?.();
  };

  const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    gradient: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transform hover:scale-105 focus:ring-blue-500',
    neon: 'bg-gray-900 text-cyan-400 border border-cyan-400 hover:bg-cyan-400 hover:text-gray-900 hover:shadow-lg hover:shadow-cyan-400/50 focus:ring-cyan-400',
    morphing: 'bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-900 hover:text-white hover:border-gray-900 focus:ring-gray-500',
    glitch: 'bg-red-600 text-white hover:bg-red-700 relative overflow-hidden focus:ring-red-500'
  };

  const clickedClasses = isClicked ? 'scale-95' : '';

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        clickedClasses,
        className
      )}
    >
      {variant === 'glitch' && (
        <>
          <span className="relative z-10">{children}</span>
          <div className="absolute inset-0 bg-red-500 opacity-0 hover:opacity-100 transition-opacity duration-100 animate-pulse"></div>
        </>
      )}
      {variant !== 'glitch' && children}
    </button>
  );
}

// Exemplo de uso e documentação
export function ExperimentalButtonShowcase() {
  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Botões Experimentais
      </h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Variantes</h4>
          <div className="flex flex-wrap gap-3">
            <ExperimentalButton variant="gradient">
              Gradiente
            </ExperimentalButton>
            <ExperimentalButton variant="neon">
              Neon
            </ExperimentalButton>
            <ExperimentalButton variant="morphing">
              Morphing
            </ExperimentalButton>
            <ExperimentalButton variant="glitch">
              Glitch
            </ExperimentalButton>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tamanhos</h4>
          <div className="flex flex-wrap gap-3 items-center">
            <ExperimentalButton size="sm" variant="gradient">
              Pequeno
            </ExperimentalButton>
            <ExperimentalButton size="md" variant="gradient">
              Médio
            </ExperimentalButton>
            <ExperimentalButton size="lg" variant="gradient">
              Grande
            </ExperimentalButton>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estados</h4>
          <div className="flex flex-wrap gap-3">
            <ExperimentalButton variant="gradient">
              Normal
            </ExperimentalButton>
            <ExperimentalButton variant="gradient" disabled>
              Desabilitado
            </ExperimentalButton>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Código de Exemplo</h4>
        <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
{`<ExperimentalButton 
  variant="gradient" 
  size="md"
  onClick={() => console.log('Clicado!')}
>
  Meu Botão
</ExperimentalButton>`}
        </pre>
      </div>
    </div>
  );
} 