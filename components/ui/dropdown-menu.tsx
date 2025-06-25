'use client';

import * as React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropdownMenuContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
  open: false,
  onOpenChange: () => {},
});

// DropdownMenu
interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DropdownMenu = ({ children, open: controlledOpen, onOpenChange }: DropdownMenuProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [controlledOpen, onOpenChange]);

  return (
    <DropdownMenuContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      <div className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

// DropdownMenuTrigger
interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  asChild?: boolean;
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ className, children, asChild, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(DropdownMenuContext);
    
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onOpenChange(!open);
    };
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement, {
        onClick: handleClick,
        'aria-expanded': open,
        'aria-haspopup': 'menu',
        ref: ref,
        ...(props as any),
      });
    }
    
    return (
      <button
        ref={ref}
        type="button"
        className={className}
        onClick={handleClick}
        aria-expanded={open}
        aria-haspopup="menu"
        {...props}
      >
        {children}
      </button>
    );
  }
);
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

// DropdownMenuContent
interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, children, sideOffset = 4, align = 'start', side = 'bottom' }, ref) => {
    const { open, onOpenChange } = React.useContext(DropdownMenuContext);
    const contentRef = React.useRef<HTMLDivElement>(null);
    
    React.useEffect(() => {
      if (open) {
        const handleClickOutside = (event: MouseEvent) => {
          const target = event.target as Element;
          const content = contentRef.current;
          if (content && !content.contains(target)) {
            const trigger = content.closest('.relative')?.querySelector('[aria-haspopup="menu"]');
            if (trigger && !trigger.contains(target)) {
              onOpenChange(false);
            }
          }
        };
        
        const handleEscape = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            onOpenChange(false);
          }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
          document.removeEventListener('keydown', handleEscape);
        };
      }
    }, [open, onOpenChange]);
    
    if (!open) {
      return null;
    }
    
    // Posicionamento baseado no side
    const getPositionClasses = () => {
      switch (side) {
        case 'top':
          return 'bottom-full mb-2';
        case 'right':
          return 'left-full ml-2 top-0';
        case 'left':
          return 'right-full mr-2 top-0';
        case 'bottom':
        default:
          return 'top-full mt-2';
      }
    };
    
    // Alinhamento
    const getAlignClasses = () => {
      if (side === 'top' || side === 'bottom') {
        switch (align) {
          case 'end':
            return 'right-0';
          case 'center':
            return 'left-1/2 -translate-x-1/2';
          case 'start':
          default:
            // Para o sidebar, garantir que não ultrapasse a lateral direita
            return side === 'top' ? 'left-0 max-w-[calc(100%-8px)]' : 'left-0';
        }
      } else {
        // Para left/right, o alinhamento é vertical
        switch (align) {
          case 'end':
            return 'bottom-0';
          case 'center':
            return 'top-1/2 -translate-y-1/2';
          case 'start':
          default:
            return 'top-0';
        }
      }
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-[100] min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg',
          getPositionClasses(),
          getAlignClasses(),
          className,
        )}
        role="menu"
        aria-orientation="vertical"
        style={{ 
          marginTop: side === 'bottom' ? sideOffset : undefined,
          marginBottom: side === 'top' ? sideOffset : undefined,
          marginLeft: side === 'right' ? sideOffset : undefined,
          marginRight: side === 'left' ? sideOffset : undefined,
        }}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

// DropdownMenuItem
interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
    inset?: boolean;
  disabled?: boolean;
  asChild?: boolean;
  onSelect?: () => void;
}

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, inset, disabled, children, onClick, onSelect, asChild, ...props }, ref) => {
    const { onOpenChange } = React.useContext(DropdownMenuContext);
    
    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      onClick?.(event);
      onSelect?.();
      onOpenChange(false);
    };
    
    if (asChild && React.isValidElement(children)) {
      const childProps = {
        className: cn(
          'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
          inset && 'pl-8',
          disabled && 'pointer-events-none opacity-50',
          className,
          (children as any).props?.className
        ),
        onClick: (e: React.MouseEvent<any>) => {
          handleClick(e as React.MouseEvent<HTMLDivElement>);
          (children as any).props?.onClick?.(e);
        },
        role: 'menuitem',
        tabIndex: disabled ? -1 : 0,
        ref: ref,
        ...props,
      };
      
      return React.cloneElement(children as React.ReactElement, childProps);
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
          inset && 'pl-8',
          disabled && 'pointer-events-none opacity-50',
          className,
        )}
        onClick={handleClick}
        role="menuitem"
        tabIndex={disabled ? -1 : 0}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

// DropdownMenuLabel
interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  inset?: boolean;
}

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, DropdownMenuLabelProps>(
  ({ className, inset, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-2 py-1.5 text-sm font-semibold text-foreground',
        inset && 'pl-8',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
);
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

// DropdownMenuSeparator
const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-muted', className)}
      role="separator"
      {...props}
    />
  )
);
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

// Componentes auxiliares
const DropdownMenuGroup = ({ children }: { children: React.ReactNode }) => (
  <div role="group">{children}</div>
);

const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => children;

const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

const DropdownMenuSubTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent focus:bg-accent',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </div>
  )
);
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

const DropdownMenuSubContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
);
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

const DropdownMenuRadioGroup = ({ children }: { children: React.ReactNode }) => (
  <div role="radiogroup">{children}</div>
);

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest opacity-60', className)}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuShortcut,
};