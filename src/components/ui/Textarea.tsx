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
          <label htmlFor={id} className="font-label text-muted block mb-3">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          rows={4}
          className={`block w-full border-b bg-transparent px-0 py-3 text-[15px] font-body focus:outline-none transition-colors duration-300 resize-none placeholder:text-muted/50 ${
            error ? "border-accent" : "border-fg/10 focus:border-fg"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-2 font-label text-accent">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
