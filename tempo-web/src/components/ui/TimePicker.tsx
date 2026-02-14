import { forwardRef, type InputHTMLAttributes } from 'react';
import { Input } from './Input';

// =================================================================
// TIME PICKER COMPONENT
// =================================================================

interface TimePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
}

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
    ({ className = '', ...props }, ref) => {
        return (
            <Input
                ref={ref}
                type="time"
                className={className}
                {...props}
            />
        );
    }
);

TimePicker.displayName = 'TimePicker';
