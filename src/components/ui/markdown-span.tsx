import 'katex/dist/katex.min.css';
import React from 'react';
import {Image} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {cn} from '@/lib/utils';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import remarkGemoji from 'remark-gemoji';

const linkClass = cn(
    'font-medium text-primary underline underline-offset-4',
    'decoration-primary/30 transition-colors hover:decoration-primary',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
);

export interface MarkdownSpanProps {
    text: string;
}

function MarkdownSpanComponent({text}: MarkdownSpanProps) {
    return (
        <span className="align-baseline">
            <ReactMarkdown
                remarkPlugins={[remarkBreaks, remarkGfm, remarkGemoji, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeKatex]}
                components={{
                    a: ({children}) => (
                        <span className={linkClass}>
                            {children}
                        </span>
                    ),
                    p: ({ children }) => <><span>{children}</span><Br /></>,
                    h1: ({ children }) => <><b>{children}</b><Br /></>,
                    h2: ({ children }) => <><b>{children}</b><Br /></>,
                    h3: ({ children }) => <><b>{children}</b><Br /></>,
                    h4: ({ children }) => <><b>{children}</b><Br /></>,
                    h5: ({ children }) => <><b>{children}</b><Br /></>,
                    h6: ({ children }) => <><b>{children}</b><Br /></>,
                    img: () => <><Image className="inline h-[0.8em] w-[0.8em] align-baseline" /></>,
                    ol: ({children}) => <ol className="list-decimal list-inside">
                        {children}
                    </ol>,
                    ul: ({children}) => <ul className={cn(
                        "list-disc list-inside marker:content-['•']",
                        "[&_li]:before:inline-block",
                        "[&_li]:before:pr-2",
                    )}>
                        {children}
                    </ul>,
                    blockquote: ({children}) => (
                        <span className={cn(
                            "text-muted-foreground bg-muted",
                            "border-s-muted-foreground border-1 border-s-4",
                            "rounded-sm px-1",
                        )}>
                            {children}
                        </span>
                    ),
                }}
            >
                {text}
            </ReactMarkdown>
        </span>
    );
}

function Br() {
    return <br className="last:hidden" />
}

export const MarkdownSpan = React.memo(MarkdownSpanComponent);
