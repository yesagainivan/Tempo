import React from 'react';

// Common props for all icons
export interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    className?: string;
}

const IconBase = ({
    size = '1em',
    className = "",
    children,
    viewBox = "0 0 24 24",
    ...props
}: IconProps & { children: React.ReactNode }) => (
    <svg
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
    >
        {children}
    </svg>
);

export const SearchIcon = (props: IconProps) => (
    <IconBase {...props}>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </IconBase>
);

export const SparklesIcon = (props: IconProps) => (
    <IconBase {...props}>
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </IconBase>
);

export const CalendarIcon = (props: IconProps) => (
    <IconBase {...props}>
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
    </IconBase>
);

export const HelpIcon = (props: IconProps) => (
    <IconBase {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
    </IconBase>
);

export const CheckIcon = (props: IconProps) => (
    <IconBase {...props}>
        <path d="M20 6 9 17l-5-5" />
    </IconBase>
);

export const CircleIcon = (props: IconProps) => (
    <IconBase {...props}>
        <circle cx="12" cy="12" r="10" />
    </IconBase>
);

export const ChevronLeftIcon = (props: IconProps) => (
    <IconBase {...props}>
        <path d="m15 18-6-6 6-6" />
    </IconBase>
);

export const ChevronRightIcon = (props: IconProps) => (
    <IconBase {...props}>
        <path d="m9 18 6-6-6-6" />
    </IconBase>
);

export const CornerDownLeftIcon = (props: IconProps) => (
    <IconBase {...props}>
        <polyline points="9 10 4 15 9 20" />
        <path d="M20 4v7a4 4 0 0 1-4 4H4" />
    </IconBase>
);

export const CommandIcon = (props: IconProps) => (
    <IconBase {...props}>
        <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
    </IconBase>
);

export const XIcon = (props: IconProps) => (
    <IconBase {...props}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </IconBase>
);

export const ListIcon = (props: IconProps) => (
    <IconBase {...props}>
        <line x1="8" x2="21" y1="6" y2="6" />
        <line x1="8" x2="21" y1="12" y2="12" />
        <line x1="8" x2="21" y1="18" y2="18" />
        <line x1="3" x2="3.01" y1="6" y2="6" />
        <line x1="3" x2="3.01" y1="12" y2="12" />
        <line x1="3" x2="3.01" y1="18" y2="18" />
    </IconBase>
);

export const TrashIcon = (props: IconProps) => (
    <IconBase {...props}>
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        <line x1="10" x2="10" y1="11" y2="17" />
        <line x1="14" x2="14" y1="11" y2="17" />
    </IconBase>
);

export const PencilIcon = (props: IconProps) => (
    <IconBase {...props}>
        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
        <path d="m15 5 4 4" />
    </IconBase>
);

export const HomeIcon = (props: IconProps) => (
    <IconBase {...props}>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </IconBase>
);
