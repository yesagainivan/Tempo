import { forwardRef, type InputHTMLAttributes, useRef, useImperativeHandle } from 'react';
import { Input } from './Input';
import { ClockIcon } from '../icons';

// =================================================================
// TIME PICKER COMPONENT
// =================================================================

interface TimePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
}

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
    ({ className = '', ...props }, ref) => {
        const inputRef = useRef<HTMLInputElement>(null);

        useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

        const handleIconClick = () => {
            if (inputRef.current) {
                if ('showPicker' in inputRef.current) {
                    try {
                        inputRef.current.showPicker!();
                    } catch {
                        inputRef.current.focus();
                    }
                } else {
                    inputRef.current.focus();
                }
            }
        };

        return (
            <Input
                ref={inputRef}
                type="time"
                className={`hide-calendar-picker-indicator pr-10 ${className}`}
                suffix={
                    <div
                        className="text-text-muted cursor-pointer hover:text-text-primary transition-colors pointer-events-auto"
                        onClick={handleIconClick}
                    >
                        <ClockIcon size={16} />
                    </div>
                }
                {...props}
            />
        );
    }
);

TimePicker.displayName = 'TimePicker';
