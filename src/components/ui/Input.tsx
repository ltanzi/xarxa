import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`block w-full border-b bg-transparent px-0 py-2 text-sm focus:outline-none transition-colors ${
            error ? "border-accent" : "border-fg/15 focus:border-fg"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-accent">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
