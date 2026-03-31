import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-lg border border-border bg-transparent px-3.5 text-sm transition-colors placeholder:text-ink-muted focus-visible:outline-none focus-visible:border-ink/40 focus-visible:ring-1 focus-visible:ring-ink/10 disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}
