import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          rows={4}
          className={`block w-full border-b bg-transparent px-0 py-2 text-sm focus:outline-none transition-colors resize-none ${
            error ? "border-accent" : "border-fg/15 focus:border-fg"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-accent">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
