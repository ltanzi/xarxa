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
          <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`block w-full rounded-xl border-2 px-4 py-2.5 text-sm bg-white/80 shadow-sm transition-colors focus:outline-none focus:ring-0 focus:border-violet ${
            error ? "border-coral" : "border-gray-200 hover:border-gray-300"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-coral font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
