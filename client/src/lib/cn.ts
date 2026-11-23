// Joins class names, skipping falsy values.
// Usage: cn('px-4', isActive && 'bg-brand-50', className)
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
