import {cn} from '@/lib/utils';
import {ChevronDown, ChevronUp} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';

const URL_REGEX = /((?:https?):\/\/[^\s]+)/g;

function FormattedDescription({description}: {description: string}) {
    const parts = description.split(URL_REGEX);

    return (
        <p>
            {parts.map((part, index) => {
                if (part.match(URL_REGEX)) {
                    return (
                        <a
                            key={index}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                'font-medium text-primary underline underline-offset-4',
                                'decoration-primary/30 transition-colors hover:decoration-primary',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                            )}
                        >
                            {part}
                        </a>
                    );
                }
                return part;
            })}
        </p>
    );
}

export function ProfileDescription({description}: {description: string}) {
    const [expanded, setExpanded] = useState(false);
    const [canExpand, setCanExpand] = useState(false);

    const descriptionRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        const el = descriptionRef.current;
        if (!el) return;

        setCanExpand(el.scrollHeight > el.clientHeight);
    }, [description]);

    return (
        <>
            <div
                className={cn(
                    'text-neutral-700 dark:text-zinc-400 wrap-break-word whitespace-pre-wrap transition-all duration-300 ease-in-out',
                    !expanded && 'line-clamp-4 sm:line-clamp-3',
                )}
                ref={descriptionRef}
            >
                <FormattedDescription description={description} />
            </div>

            {canExpand && (
                <button
                    onClick={() => setExpanded(v => !v)}
                    className="mt-1 flex items-center gap-1 text-sm text-blue-500 hover:underline cursor-pointer"
                >
                    {expanded ? (
                        <>
                            <ChevronUp className="w-4 h-4" /> Show less
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-4 h-4" /> Show more
                        </>
                    )}
                </button>
            )}
        </>
    );
}
