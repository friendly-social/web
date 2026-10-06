import React from 'react';
import {Image} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {cn} from '@/lib/utils';
import remarkBreaks from 'remark-breaks';
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
        <ReactMarkdown
            remarkPlugins={[remarkBreaks, remarkGfm, remarkGemoji]}
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
            components={{
                a: ({children}) => (
                    <span className={linkClass}>
                        {children}
                    </span>
                ),
                p: ({ children }) => <>{children}<Br/></>,
                h1: ({ children }) => <><b>{children}</b><Br/></>,
                h2: ({ children }) => <><b>{children}</b><Br/></>,
                h3: ({ children }) => <><b>{children}</b><Br/></>,
                h4: ({ children }) => <><b>{children}</b><Br/></>,
                h5: ({ children }) => <><b>{children}</b><Br/></>,
                h6: ({ children }) => <><b>{children}</b><Br/></>,
                img: () => <><Image className="inline h-[1em] w-[1em]" /><Br /></>,
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
            }}
        >
            {text}
        </ReactMarkdown>
    );
}

function Br() {
    return <br className="last:hidden" />
}

export const MarkdownSpan = React.memo(MarkdownSpanComponent);
