import {cn} from '@/lib/utils';
import {RefCallback, RefObject, useLayoutEffect} from 'react';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {HistoryExtension} from '@lexical/history';
import {LexicalExtensionComposer} from '@lexical/react/LexicalExtensionComposer';
import {
    defineExtension,
    configExtension,
    $createParagraphNode,
    $createTextNode,
    $getRoot,
    type LexicalEditor,
    $isParagraphNode,
    $insertNodes,
} from 'lexical';
import {HMRExtension} from '@lexical/extension';
import {PlainTextExtension} from '@lexical/plain-text';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {ImageNode} from './lexical-image-node';
import {$generateNodesFromDOM} from '@lexical/html';

export function clearText(editor: LexicalEditor) {
    editor.update(() => {
        $getRoot().clear();
        $getRoot().append($createParagraphNode());
    });
}

export function appendText(editor: LexicalEditor, text: string) {
    editor.update(() => {
        const paragraph = $getRoot().getChildAtIndex(0);
        if (!$isParagraphNode(paragraph)) {
            console.error('Cannot append text');
            return;
        }
        const node = $createTextNode(text);
        node.selectEnd();
        paragraph.append(node);
    });
}

export interface ContentProps {
    ref: RefObject<HTMLDivElement | null>;
    editorRef: RefObject<LexicalEditor | null>;
    contentClassName: string;
    placeholderClassName?: string;
    placeholder: string;
    onPaste: (event: React.ClipboardEvent<HTMLDivElement>) => void;
}

export function Content({
    ref,
    editorRef,
    contentClassName,
    placeholderClassName,
    placeholder,
    onPaste: onUserPaste,
}: ContentProps) {
    function onPaste(event: React.ClipboardEvent<HTMLDivElement>) {
        const html = event.clipboardData.getData('text/html');
        if (!html) {
            onUserPaste(event);
            return;
        }
        const editor = editorRef.current;
        if (!editor) return;
        editor.update(() => {
            const parser = new DOMParser();
            const dom = parser.parseFromString(html, 'text/html');
            const nodes = $generateNodesFromDOM(editor, dom);
            $getRoot().select();
            $insertNodes(nodes);
        });
    }
    return (
        <div className="relative">
            <LexicalExtensionComposer
                extension={appExtension}
                contentEditable={null}
            >
                <ContentEditable
                    ref={ref}
                    className={contentClassName}
                    aria-placeholder={placeholder}
                    onPaste={onPaste}
                    placeholder={
                        <div
                            className={cn(
                                'absolute top-0 left-0 right-0 mt-1.5',
                                'pointer-events-none text-foreground opacity-50',
                                placeholderClassName,
                            )}
                        >
                            {placeholder}
                        </div>
                    }
                />
                <EditorRefPlugin editorRef={editorRef} />
            </LexicalExtensionComposer>
        </div>
    );
}

const appExtension = defineExtension({
    name: '[root]',
    nodes: () => [ImageNode],
    onError: (error: unknown) => console.error(error),
    dependencies: [
        configExtension(HMRExtension, {hot: import.meta.hot ?? null}),
        HistoryExtension,
        PlainTextExtension,
    ],
});

export function EditorRefPlugin({
    editorRef,
}: {
    editorRef:
        | RefCallback<LexicalEditor>
        | RefObject<LexicalEditor | null | undefined>;
}): null {
    const [editor] = useLexicalComposerContext();

    useLayoutEffect(() => {
        let cleanup: (() => void) | undefined;
        if (typeof editorRef === 'function') {
            const editorRefCleanup = editorRef(editor);
            if (typeof editorRefCleanup === 'function') {
                cleanup = editorRefCleanup;
            } else {
                cleanup = () => editorRef(null);
            }
        } else if (typeof editorRef === 'object' && editorRef !== null) {
            // eslint-disable-next-line react-hooks/immutability
            editorRef.current = editor;
            cleanup = () => {
                editorRef.current = null;
            };
        }
        return cleanup;
    }, [editor, editorRef]);

    return null;
}
