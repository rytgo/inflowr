import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border border-accent/40 bg-gradient-to-b from-accent to-[#3675c9] text-white shadow-float hover:brightness-110",
  secondary:
    "border border-border bg-panel-strong text-text-secondary shadow-panel hover:border-border-strong hover:text-text-primary",
  ghost:
    "border border-transparent bg-transparent text-text-muted hover:border-border-subtle hover:bg-panel-soft hover:text-text-primary",
  destructive:
    "border border-danger/30 bg-danger-soft text-danger hover:bg-danger/20"
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm"
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium transition duration-150 ease-out disabled:pointer-events-none disabled:opacity-45 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
