'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { isValidElement, cloneElement } from 'react';

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

interface TooltipProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
  sideOffset?: number;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

const TooltipContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  delayDuration: number;
}>({
  open: false,
  setOpen: () => {},
  delayDuration: 700,
});

const TooltipProvider = ({
  children,
  delayDuration = 700,
}: TooltipProviderProps) => {
  return <div>{children}</div>;
};

const Tooltip = ({
  children,
  open: controlledOpen,
  onOpenChange,
  className = 'relative inline-block',
}: TooltipProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [controlledOpen, onOpenChange],
  );

  return (
    <TooltipContext.Provider value={{ open, setOpen, delayDuration: 700 }}>
      <div className={className}>{children}</div>
    </TooltipContext.Provider>
  );
};

const TooltipTrigger = React.forwardRef<HTMLDivElement, TooltipTriggerProps>(
  ({ children, asChild, className, ...props }, ref) => {
    const { setOpen } = React.useContext(TooltipContext);

    const triggerProps = {
      ref,
      className,
      onMouseEnter: () => setOpen(true),
      onMouseLeave: () => setOpen(false),
      onFocus: () => setOpen(true),
      onBlur: () => setOpen(false),
      ...props,
    };

    if (asChild && isValidElement(children)) {
      return cloneElement(children, triggerProps);
    }

    // Use <button> para acessibilidade, mas não passe ref (evita conflito de tipos)
    const { ref: _ref, ...buttonProps } = triggerProps;
    return (
      <button type="button" {...buttonProps}>
        {children}
      </button>
    );
  },
);
TooltipTrigger.displayName = 'TooltipTrigger';

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, sideOffset = 4, side = 'top', children, ...props }, ref) => {
    const { open } = React.useContext(TooltipContext);

    if (!open) return null;

    const sideClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95',
          sideClasses[side],
          className,
        )}
        style={{ marginBottom: side === 'top' ? sideOffset : undefined }}
        {...props}
      >
        {children}
      </div>
    );
  },
);
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
