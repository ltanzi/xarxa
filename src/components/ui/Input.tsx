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
          className={`block w-full border-b bg-transparent px-0 py-2 text-sm text-fg focus:outline-none transition-colors placeholder:text-muted/40 ${
            error ? "border-red-500" : "border-soft focus:border-glow"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
