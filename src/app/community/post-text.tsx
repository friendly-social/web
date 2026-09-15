import {useMemo} from 'react';
import {MarkdownArea} from '@/components/ui/markdown-area';
import {
    CommunityPostEntity,
    CommunityPostMention,
} from '@/network/friendly-client';

const PROFILE_URL_BASE = 'https://web.getfriend.ly/user/';

function isMentionEntity(
    entity: CommunityPostEntity,
): entity is CommunityPostMention {
    if (entity.type !== 'mention') return false;
    const mention = entity as CommunityPostMention;
    return (
        typeof mention.position === 'number' &&
        typeof mention.length === 'number' &&
        typeof mention.target === 'string'
    );
}

// Rewrites raw post text into Markdown, turning every recognized mention
// entity into a link to the mentioned user's profile. Entities are applied
// from the highest position down, so replacing one never shifts the offsets
// of the mentions still waiting to be applied.
export function resolvePostText(
    text: string,
    entities: CommunityPostEntity[] | undefined,
): string {
    if (!entities || entities.length === 0) return text;

    const mentions = entities
        .filter(isMentionEntity)
        .sort((a, b) => b.position - a.position);

    const textLength = text.length;
    let result = text;
    for (const mention of mentions) {
        const start = mention.position;
        const end = start + mention.length;
        if (start < 0 || end > textLength || start >= end) continue;

        const [userId] = mention.target.split(':');
        const label = result.slice(start, end);
        result =
            result.slice(0, start) +
            `[${label}](${PROFILE_URL_BASE}${userId})` +
            result.slice(end);
    }
    return result;
}

interface PostTextProps {
    text: string;
    entities?: CommunityPostEntity[];
    className?: string;
}

// Shared renderer for post bodies (community feed, replies, main post) that
// resolves entities into Markdown links before handing off to MarkdownArea.
export function PostText({text, entities, className}: PostTextProps) {
    const resolvedText = useMemo(
        () => resolvePostText(text, entities),
        [text, entities],
    );
    return <MarkdownArea text={resolvedText} className={className} />;
}
