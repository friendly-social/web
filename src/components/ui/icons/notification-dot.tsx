import * as React from 'react';

export function NotificationDotIcon(props: React.ComponentProps<'svg'>) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <circle cx="8" cy="8" r="6" fill="#ef4444" stroke="#000000" />
        </svg>
    );
}
