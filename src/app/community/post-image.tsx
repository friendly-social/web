import {cn, createFileLink} from '@/lib/utils';
import {CommunityPostImage} from '@/network/friendly-client';
import {useTranslations} from 'use-intl';

interface PostImageProps {
    image?: CommunityPostImage;
    className?: string;
}

export function PostImage({image, className}: PostImageProps) {
    const t = useTranslations('post');
    if (!image) return null;

    return (
        <img
            className={cn(
                'mt-3 max-h-[70vh] w-full rounded-lg border border-border bg-muted/20 object-contain',
                className,
            )}
            src={createFileLink(image.file)}
            alt={image.altText || t('image')}
            loading="lazy"
        />
    );
}
