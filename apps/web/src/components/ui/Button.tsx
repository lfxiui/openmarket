import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "bg-ink text-cream rounded-full shadow-sm hover:bg-ink/85",
        brand:
          "bg-brand-orange text-white rounded-full shadow-sm hover:bg-brand-orange/90",
        secondary:
          "border border-ink/15 text-ink rounded-full hover:border-ink/30 hover:bg-ink/[0.03]",
        ghost: "text-ink-light rounded-lg hover:text-ink hover:bg-ink/[0.04]",
        destructive:
          "bg-red-600 text-white rounded-full shadow-sm hover:bg-red-700",
      },
      size: {
        default: "h-10 px-6",
        sm: "h-8 px-4 text-[13px]",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
