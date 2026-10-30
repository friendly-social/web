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

// todo: lexical converters

export function $appendFromRichText(node: ElementNode, text: RichText) {
    const paragraph = $createParagraphNode();
    const lines = text.markdown.split('\n');
    let first = true;
    for (const line of lines) {
        paragraph.append($createTextNode(line));
        if (first) {
            first = false;
        } else {
            paragraph.append($createLineBreakNode());
        }
    }
    node.append(paragraph);
}

export function convertToRichText(
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
    if ($isTextNode(node)) {
        return {
            markdown: node.getTextContent().trim(),
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
