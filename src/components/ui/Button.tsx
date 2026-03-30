import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary: "bg-fg text-bg hover:bg-accent transition-colors duration-300",
  secondary: "bg-soft text-fg hover:bg-soft/60 transition-colors duration-300",
  outline: "border border-fg/15 text-fg hover:border-accent hover:text-accent transition-all duration-300",
  ghost: "text-muted hover:text-fg transition-colors duration-300",
  danger: "bg-accent text-bg hover:opacity-80 transition-opacity duration-300",
};

const sizes = {
  sm: "px-4 py-2 font-label",
  md: "px-5 py-2.5 font-label",
  lg: "px-7 py-3 font-label",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
