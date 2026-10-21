import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      style={{ willChange: 'transform', transform: 'translateZ(0)', contain: 'strict' }}
      className={cn('inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent', className)}
    />
  );
}
