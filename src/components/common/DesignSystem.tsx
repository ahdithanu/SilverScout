import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LeadStatus } from '../../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatStatusLabel(status: LeadStatus | string): string {
  switch (status) {
    case 'new': return 'New Target';
    case 'qualified': return 'Qualified Target';
    case 'outreach_triggered': return 'Outreach Triggered';
    case 'in_loi': return 'Under LOI';
    case 'archived': return 'Archived';
    default: return status ? status.replace(/_/g, ' ') : 'Unknown';
  }
}

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'xs' | 'sm' | 'md' | 'lg';
  }
>(({ className, variant = 'primary', size = 'md', ...props }, ref) => {
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 shadow-sm',
    outline: 'border border-zinc-200 bg-transparent hover:bg-zinc-50 text-zinc-700',
    ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
  };
  const sizes = {
    xs: 'px-2 py-1 text-[10px]',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});

export const Badge = ({
  children,
  className,
  variant = 'default'
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}) => {
  const variants = {
    default: 'bg-zinc-100 text-zinc-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700'
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export const Card = ({
  children,
  className,
  onClick
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={cn(
      'rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all',
      onClick && 'cursor-pointer hover:border-emerald-300 hover:shadow-md',
      className
    )}
  >
    {children}
  </div>
);
