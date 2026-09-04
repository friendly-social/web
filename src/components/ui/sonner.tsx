'use client';

import {
    CircleCheckIcon,
    InfoIcon,
    Loader2Icon,
    OctagonXIcon,
    TriangleAlertIcon,
} from 'lucide-react';
import {useTheme} from 'next-themes';
import {Toaster as Sonner, type ToasterProps} from 'sonner';

const Toaster = ({...props}: ToasterProps) => {
    const {theme = 'system'} = useTheme();

    return (
        <Sonner
            theme={theme as ToasterProps['theme']}
            className="toaster group"
            icons={{
                success: <CircleCheckIcon className="size-4" />,
                info: <InfoIcon className="size-4" />,
                warning: <TriangleAlertIcon className="size-4" />,
                error: <OctagonXIcon className="size-4" />,
                loading: <Loader2Icon className="size-4 animate-spin" />,
            }}
            toastOptions={{
                classNames: {
                    // Toasts now carry a description, and sonner gives title and
                    // description the same size and colour -- without a weight
                    // jump the two lines read as one paragraph. Dimming the
                    // description instead would push it under 4.5:1 on the
                    // rich-colour background.
                    title: 'font-semibold!',
                },
            }}
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                    '--border-radius': 'var(--radius)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
};

export {Toaster};
