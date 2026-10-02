import React, {createContext, useContext, useEffect, useState} from 'react';
import remarkBreaks from 'remark-breaks';
import remarkGemoji from 'remark-gemoji';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, {defaultSchema} from 'rehype-sanitize';
import ReactMarkdown, {type Components, type ExtraProps} from 'react-markdown';
import {useTheme} from '@/components/theme-provider';
import {cn} from '@/lib/utils';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {oneLight} from 'react-syntax-highlighter/dist/esm/styles/prism';
import {oneDark} from 'react-syntax-highlighter/dist/esm/styles/prism';
import type {Root} from 'mdast';
import {visit} from 'unist-util-visit';

const linkClass = cn(
    'font-medium text-primary underline underline-offset-4',
    'decoration-primary/30 transition-colors hover:decoration-primary',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
);

const sanitizeSchema = {
    ...defaultSchema,
    tagNames: [...(defaultSchema.tagNames || []), 'audio'],
    attributes: {
        ...defaultSchema.attributes,
        audio: ['src'],
    },
};

interface MarkdownAreaProps {
    text: string;
    className?: string;
    ref?: React.Ref<HTMLDivElement>;
    onImageClick?: (event: React.MouseEvent<HTMLImageElement>) => void;
}

const ImageClickContext =
    createContext<MarkdownAreaProps['onImageClick']>(undefined);

function MarkdownImage({
    node,
    ...props
}: React.ComponentPropsWithoutRef<'img'> & ExtraProps) {
    const onImageClick = useContext(ImageClickContext);
    return (
        <img
            onClick={onImageClick}
            className={cn(
                'rounded-lg max-h-[70vh]',
                onImageClick ? 'cursor-pointer' : '',
            )}
            {...props}
        />
    );
}

function HighlightedCode({
    children,
    className,
    language,
}: {
    children: React.ReactNode;
    className?: string;
    language: string;
}) {
    const codeStyle = useCodeStyle();
    return (
        <SyntaxHighlighter
            className={cn('overflow-x-auto scrollbar-none text-xs', className)}
            language={language}
            style={codeStyle}
            wrapLongLines={true}
            customStyle={{backgroundColor: 'var(--color-muted)', padding: 8}}
            lineProps={{style: {display: 'block', padding: 0}}}
        >
            {String(children)}
        </SyntaxHighlighter>
    );
}

function MarkdownCode({
    children,
    className,
    node,
    ...rest
}: React.ComponentPropsWithoutRef<'code'> & ExtraProps) {
    const match = /language-(\w+)/.exec(className || '');
    return match ? (
        <HighlightedCode className={className} language={match[1]}>
            {children}
        </HighlightedCode>
    ) : (
        <code
            {...rest}
            className={cn(
                'bg-muted text-muted-foreground p-0.5 px-1 h-full text-sm rounded-lg',
                className,
            )}
        >
            {String(children)}
        </code>
    );
}

const markdownComponents: Components = {
    img: MarkdownImage,
    a: ({href, children}) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
            onClickCapture={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
        >
            {children}
        </a>
    ),
    blockquote: ({children}) => (
        <blockquote className="text-sm space-y-[1em] leading-5">
            {children}
        </blockquote>
    ),
    ol: ({children}) => (
        <ol className="list-decimal list-inside">{children}</ol>
    ),
    ul: ({children}) => (
        <ul className={cn("list-disc list-inside marker:content-['•']")}>
            {children}
        </ul>
    ),
    li: ({children}) => (
        <div className="grid grid-cols-[min-content_1fr]">
            <li className="list-item" />
            <div className="w-full ps-1 space-y-[1em] break-words overflow-hidden">
                {children}
            </div>
        </div>
    ),
    table: ({children}) => (
        <div className="overflow-x-auto scrollbar-none">
            <table>{children}</table>
        </div>
    ),
    audio: ({node, ...props}) => <audio controls {...props} />,
    code: MarkdownCode,
    sub: ({children}) => (
        <span className="inline-block mb-1">
            <sub>{children}</sub>
        </span>
    ),
};

function MarkdownAreaComponent({
    text,
    className,
    ref,
    onImageClick,
}: MarkdownAreaProps) {
    return (
        <div
            ref={ref}
            className={cn(
                'w-full min-w-0',
                'overflow-x-auto overflow-y-hidden scrollbar-none',
                'break-words space-y-[1em] leading-5',
                className,
            )}
        >
            <ImageClickContext.Provider value={onImageClick}>
                <ReactMarkdown
                    remarkPlugins={[
                        remarkBreaks,
                        remarkGfm,
                        remarkGemoji,
                        injectPlaintext,
                    ]}
                    rehypePlugins={[
                        rehypeRaw,
                        [rehypeSanitize, sanitizeSchema],
                    ]}
                    components={markdownComponents}
                >
                    {text}
                </ReactMarkdown>
            </ImageClickContext.Provider>
        </div>
    );
}

const injectPlaintext = () => (tree: Root) => {
    visit(tree, 'code', node => {
        node.lang = node.lang ?? 'plaintext';
    });
};

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
                            .matches
                            ? oneDark
                            : oneLight,
                    );
                };
                handleChange();
                mediaQuery.addEventListener('change', handleChange);
                return () =>
                    mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    return codeStyle;
}

export const MarkdownArea = React.memo(MarkdownAreaComponent);
