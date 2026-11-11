import {$createImageNode, $isImageNode} from '@/components/lexical-image-node';
import {
    $createLineBreakNode,
    $createParagraphNode,
    $createTextNode,
    $isLineBreakNode,
    $isParagraphNode,
    $isRootNode,
    $isTextNode,
    ElementNode,
    type LexicalNode,
} from 'lexical';
import * as mdast from 'mdast';
import remarkParse from 'remark-parse';
import {unified} from 'unified';

/*
 * Custom entities can be embedded in 2 formats:
 *
 * Markdown: ![](friendly://entity?id=0)
 * HTML: <friendly.entity id="0"></friendly.entity>
 */
export interface RichText {
    markdown: string;
    entities: Record<RichTextEntityId, RichTextEntity>;
}

export type RichTextEntityId = number & {readonly __brand: unique symbol};

// todo: limit [url]
export type RichTextEntity = {type: 'image'; url: string} | {type: never};

export const EmptyRichText: RichText = {markdown: '', entities: []};

export const richTextParser = unified().use(remarkParse);

export function $appendFromRichText(
    node: ElementNode,
    text: RichText,
    parsed: mdast.Root,
) {
    const paragraph = $createParagraphNode();
    const entities = [...findImages(parsed), null];
    for (const [i, next] of entities.entries()) {
        const previous = entities[i - 1];
        const startIndex = previous?.position?.end?.offset ?? 0;
        const endIndex = next?.position?.start?.offset ?? text.markdown.length;
        const textBefore = text.markdown.substring(startIndex, endIndex);
        $importText(paragraph, textBefore);
        if (next !== null) {
            paragraph.append($createImageNode(next.url));
        }
    }
    node.append(paragraph);
}

function findImages(node: mdast.Parent): mdast.Image[] {
    return node.children.flatMap(node => {
        if ('children' in node) {
            return findImages(node);
        }
        if (node.type === 'image') {
            return [node];
        }
        return [];
    });
}

function $importText(node: ElementNode, text: string) {
    const lines = text.split('\n');
    let first = true;
    for (const line of lines) {
        if (first) {
            first = false;
        } else {
            node.append($createLineBreakNode());
        }
        node.append($createTextNode(line));
    }
}

export function convertToRichText(node: LexicalNode): RichText {
    const {markdown, entities} = convertToRichTextResursion(node);
    return {
        markdown: markdown.trim(),
        entities,
    };
}

function convertToRichTextResursion(
    node: LexicalNode,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    nonce: number = 0,
): RichText {
    if ($isRootNode(node)) {
        return node.getChildren().reduce(
            (acc, node) => {
                let markdown = acc.markdown;
                if (acc.markdown.length !== 0) {
                    markdown = markdown + '\n';
                }
                const richText = convertToRichText(node);
                return {
                    markdown: markdown + richText.markdown,
                    entities: Object.assign(acc.entities, richText.entities),
                };
            },
            {markdown: '', entities: {}},
        );
    }
    if ($isParagraphNode(node)) {
        return node.getChildren().reduce(
            (acc, node) => {
                const richText = convertToRichText(node);
                return {
                    markdown: acc.markdown + richText.markdown,
                    entities: Object.assign(acc.entities, richText.entities),
                };
            },
            {markdown: '', entities: {}},
        );
    }
    if ($isImageNode(node)) {
        return {
            markdown: `![](${node.$getSrc()})`,
            entities: [],
        };
    }
    if ($isTextNode(node)) {
        return {
            markdown: node.getTextContent(),
            entities: [],
        };
    }
    if ($isLineBreakNode(node)) {
        return {
            markdown: '\n',
            entities: [],
        };
    }
    console.error('Unknown node', node.getType());
    return {
        markdown: '',
        entities: [],
    };
}
