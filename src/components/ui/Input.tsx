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
          <label htmlFor={id} className="block text-[10px] uppercase tracking-widest text-muted mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`block w-full border-b bg-transparent px-0 py-2 text-[12px] focus:outline-none transition-colors placeholder:text-muted/40 ${
            error ? "border-accent" : "border-fg/12 focus:border-fg"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-[10px] text-accent">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
