import { forwardRef, type InputHTMLAttributes } from 'react';

// =================================================================
// INPUT COMPONENT
// =================================================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="flex flex-col gap-1.5">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium text-text-secondary"
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={`
            w-full px-3 py-2
            bg-bg-secondary
            border border-border-default
            rounded-lg
            text-text-primary
            placeholder:text-text-muted
            transition-all duration-200
            hover:border-border-subtle
            focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-error focus:border-error focus:ring-error' : ''}
            ${className}
          `}
                    {...props}
                />
                {error && (
                    <p className="text-sm text-error">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
