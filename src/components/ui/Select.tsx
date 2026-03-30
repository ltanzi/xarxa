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
          <label htmlFor={id} className="font-label text-muted block mb-3">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={`block w-full border-b bg-transparent px-0 py-3 text-[15px] font-body focus:outline-none transition-colors duration-300 ${
            error ? "border-accent" : "border-fg/10 focus:border-fg"
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-2 font-label text-accent">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
