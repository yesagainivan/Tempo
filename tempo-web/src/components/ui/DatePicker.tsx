import { forwardRef, type InputHTMLAttributes } from 'react';
import { Input } from './Input';

// =================================================================
// DATE PICKER COMPONENT
// =================================================================

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
    ({ className = '', ...props }, ref) => {
        return (
            <Input
                ref={ref}
                type="date"
                className={className}
                {...props}
            />
        );
    }
);

DatePicker.displayName = 'DatePicker';
