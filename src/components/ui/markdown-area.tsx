import React, {useMemo, useEffect, useState} from 'react';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import ReactMarkdown from 'react-markdown';
import {useTheme} from '@/components/theme-provider';
import {cn} from '@/lib/utils';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import {oneLight} from 'react-syntax-highlighter/dist/esm/styles/prism'
import {oneDark} from 'react-syntax-highlighter/dist/esm/styles/prism'

const linkClass = cn(
    'font-medium text-primary underline underline-offset-4',
    'decoration-primary/30 transition-colors hover:decoration-primary',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
);

interface MarkdownAreaProps {
    text: string;
    className?: string;
    ref?: React.Ref<HTMLDivElement>;
}

function MarkdownAreaComponent(
    {text, className, ref}: MarkdownAreaProps,
) {
    const codeStyle = useCodeStyle();

    return (
        <div
            ref={ref}
            className={cn(
                "w-full min-w-0",
                "overflow-x-auto overflow-y-hidden scrollbar-none",
                "break-words space-y-[1em] leading-5",
                className,
            )}>
            <ReactMarkdown
                remarkPlugins={[remarkBreaks, remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={{
                    img: ({ node, ...props }) => (
                        <img className="rounded-lg" {...props} />
                    ),
                    a: ({href, children}) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={linkClass}
                        >
                            {children}
                        </a>
                    ),
                    blockquote: ({children}) => <blockquote className="text-sm">{children}</blockquote>,
                    ol: ({children}) => <ol className="list-decimal list-inside">
                        {children}
                    </ol>,
                    ul: ({children}) =>
                        <ul className={cn(
                            "list-disc list-inside marker:content-['•']",
                        )}>
                            {children}
                        </ul>,
                    li: ({children}) => (
                        <div className="grid grid-cols-[min-content_1fr]">
                            <li className="list-item" />
                            <div className="w-full ps-1 space-y-[1em] break-words overflow-x-hidden">
                                {children}
                            </div>
                        </div>
                    ),
                    table: ({children}) => (
                        <div className="overflow-x-auto scrollbar-none">
                            <table>
                                {children}
                            </table>
                        </div>
                    ),
                    code: ({children, className, node, ...rest}) => {
                        const match = /language-(\w+)/.exec(className || '')
                        return <SyntaxHighlighter
                            className="overflow-x-auto scrollbar-none text-xs"
                            language={match?.[1]}
                            style={codeStyle}
                            wrapLongLines={true}
                            customStyle={{
                                backgroundColor: 'var(--color-muted)',
                                padding: 8,
                            }}
                            lineProps={{
                                style: {
                                    display: 'block',
                                    padding: 0,
                                },
                            }}>
                        {String(children)}
                        </SyntaxHighlighter>
                    },
                    sub: ({children}) => (
                        <span className="inline-block mb-1">
                            <sub>{children}</sub>
                        </span>
                    ),
                }}
            >
                {text}
            </ReactMarkdown>
        </div>
    );
}

function useCodeStyle() {
    const theme = useTheme().theme;
    const [codeStyle, setCodeStyle] = useState(oneLight);

    useEffect(() => {
        switch (theme) {
        case 'light':
            setCodeStyle(oneLight);
            return () => {};
        case 'dark':
            setCodeStyle(oneDark);
            return () => {};
        case 'system':
            const mediaQuery = window.matchMedia(
                '(prefers-color-scheme: dark)',
            );
            const handleChange = () => {
                setCodeStyle(
                    window.matchMedia('(prefers-color-scheme: dark)')
                        .matches ? oneDark : oneLight,
                );
            };
            handleChange();
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    return codeStyle;
}

export const MarkdownArea = React.memo(MarkdownAreaComponent);
