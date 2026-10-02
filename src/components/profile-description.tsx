import {ImagePreviewer, useImagePreviewer} from '@/components/image-previewer';
import {cn} from '@/lib/utils';
import {useTranslations} from 'use-intl';
import {ChevronDown, ChevronUp} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import {MarkdownArea} from '@/components/ui/markdown-area';

export function ProfileDescription({description}: {description: string}) {
    const [expanded, setExpanded] = useState(false);
    const [canExpand, setCanExpand] = useState(false);
    const imagePreviewer = useImagePreviewer();

    const descriptionRef = useRef<HTMLDivElement>(null);
    const t = useTranslations('profile');

    useEffect(() => {
        const el = descriptionRef.current;
        if (!el) return;

        setCanExpand(el.scrollHeight - el.clientHeight > 1);
    }, [description]);

    return (
        <>
            <MarkdownArea
                className={cn(
                    'text-muted-foreground wrap-break-word transition-all duration-300 ease-in-out',
                    !expanded && 'line-clamp-4 sm:line-clamp-3',
                )}
                ref={descriptionRef}
                text={description}
                onImageClick={e => {
                    e.stopPropagation();
                    imagePreviewer.setPayload({
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
            <ImagePreviewer {...imagePreviewer} />
        </>
    );
}
