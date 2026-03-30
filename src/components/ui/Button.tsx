import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary: "bg-fg text-bg hover:opacity-80",
  secondary: "bg-soft text-fg hover:bg-soft/60",
  outline: "border border-fg/20 text-fg hover:border-fg/50",
  ghost: "text-muted hover:text-fg",
  danger: "bg-accent text-white hover:opacity-80",
};

const sizes = {
  sm: "px-3 py-1 text-[10px]",
  md: "px-4 py-1.5 text-[10px]",
  lg: "px-5 py-2 text-[11px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center uppercase tracking-widest font-medium transition-all focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
