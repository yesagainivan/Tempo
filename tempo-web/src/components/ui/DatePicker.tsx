import { forwardRef, type InputHTMLAttributes, useRef, useImperativeHandle } from 'react';
import { Input } from './Input';
import { CalendarIcon } from '../icons';

// =================================================================
// DATE PICKER COMPONENT
// =================================================================

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
    ({ className = '', ...props }, ref) => {
        const inputRef = useRef<HTMLInputElement>(null);

        // Forward the ref to the internal input while ensuring we have access to it
        useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

        const handleIconClick = () => {
            if (inputRef.current) {
                // Try standard showPicker (modern browsers)
                if ('showPicker' in inputRef.current) {
                    try {
                        inputRef.current.showPicker!();
                    } catch {
                        // Fallback or ignore if not supported/allowed
                        inputRef.current.focus();
                    }
                } else {
                    inputRef.current.focus();
                    inputRef.current.click();
                }
            }
        };

        return (
            <Input
                ref={inputRef}
                type="date"
                className={`hide-calendar-picker-indicator pr-10 ${className}`}
                suffix={
                    <div
                        className="text-text-muted cursor-pointer hover:text-text-primary transition-colors pointer-events-auto"
                        onClick={handleIconClick}
                    >
                        <CalendarIcon size={16} />
                    </div>
                }
                {...props}
            />
        );
    }
);

DatePicker.displayName = 'DatePicker';
