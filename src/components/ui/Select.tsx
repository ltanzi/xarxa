import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={`block w-full border-b bg-transparent px-0 py-2 text-sm focus:outline-none transition-colors ${
            error ? "border-accent" : "border-fg/15 focus:border-fg"
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-xs text-accent">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
