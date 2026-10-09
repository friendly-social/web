import {useImagePreviewerController} from '@/components/image-previewer';
import {normalizeLink} from '@/lib/utils';
import {cn} from '@/lib/utils';
import {useTranslations} from 'use-intl';
import {ChevronDown, Link, ChevronUp} from 'lucide-react';
import {useEffect, useRef, useState, lazy} from 'react';

const MarkdownArea = lazy(() =>
    import('@/components/ui/markdown-area').then(m => ({
        default: m.MarkdownArea,
    })),
);

export interface ProfileDescriptionProps {
    description: string;
    socialLink: string | null;
}

export function ProfileDescription({
    description,
    socialLink,
}: ProfileDescriptionProps) {
    const [expanded, setExpanded] = useState(false);
    const [canExpand, setCanExpand] = useState(false);
    const imagePreviewer = useImagePreviewerController();

    const descriptionRef = useRef<HTMLDivElement>(null);
    const t = useTranslations('profile');

    useEffect(() => {
        const el = descriptionRef.current;
        if (!el) return;

        setCanExpand(el.scrollHeight - el.clientHeight > 1);
    }, [description]);

    return (
        <div className="flex flex-col gap-2 w-full">
            {socialLink && (
                <a
                    href={normalizeLink(socialLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-center sm:w-full"
                >
                    <div className="text-sm gap-1 flex items-center text-primary cursor-pointer hover:underline">
                        <Link className="h-[1em] w-[1em] inline" />
                        {socialLink}
                    </div>
                </a>
            )}

            <MarkdownArea
                className={cn(
                    'text-muted-foreground wrap-break-word transition-all',
                    'duration-300 ease-in-out',
                    !expanded && 'line-clamp-4 sm:line-clamp-3',
                )}
                text={description}
                ref={descriptionRef}
                onImageClick={e => {
                    e.stopPropagation();
                    void imagePreviewer.setPayload({
                        type: 'open',
                        src: e.currentTarget.src,
                    });
                }}
            />

            {canExpand && (
                <button
                    onClick={() => setExpanded(v => !v)}
                    className="mt-1 flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer"
                >
                    {expanded ? (
                        <>
                            <ChevronUp className="w-4 h-4" />
                            {t('show-less')}
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-4 h-4" />
                            {t('show-more')}
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
