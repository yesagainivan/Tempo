import { motion } from 'framer-motion';
import { forwardRef, type InputHTMLAttributes } from 'react';

// =================================================================
// CHECKBOX COMPONENT
// =================================================================

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, checked = false, onCheckedChange, className = '', id, ...props }, ref) => {
        const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

        const handleChange = () => {
            onCheckedChange?.(!checked);
        };

        return (
            <label
                htmlFor={checkboxId}
                className={`inline-flex items-center gap-2 cursor-pointer select-none ${className}`}
            >
                <div className="relative">
                    <input
                        ref={ref}
                        type="checkbox"
                        id={checkboxId}
                        checked={checked}
                        onChange={handleChange}
                        className="sr-only peer"
                        {...props}
                    />
                    <motion.div
                        className={`
              w-5 h-5 rounded
              border-2 transition-colors duration-200
              flex items-center justify-center
              ${checked
                                ? 'bg-accent-primary border-accent-primary'
                                : 'bg-transparent border-border-default hover:border-text-muted'
                            }
            `}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.1 }}
                    >
                        <motion.svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-3 h-3 text-white"
                            initial={false}
                            animate={{
                                pathLength: checked ? 1 : 0,
                                opacity: checked ? 1 : 0,
                            }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                        >
                            <motion.path
                                d="M5 12l5 5L20 7"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: checked ? 1 : 0 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                            />
                        </motion.svg>
                    </motion.div>
                </div>
                {label && (
                    <span className={`text-sm transition-colors duration-200 ${checked ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                        {label}
                    </span>
                )}
            </label>
        );
    }
);

Checkbox.displayName = 'Checkbox';
