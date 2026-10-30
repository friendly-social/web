import {cn} from '@/lib/utils';
import {ReactNode, RefObject} from 'react';
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
} from 'lexical';
import {HMRExtension} from '@lexical/extension';
import {PlainTextExtension} from '@lexical/plain-text';

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
        paragraph.append($createTextNode(text));
    });
}

export interface HostProps {
    children: ReactNode;
}

export function Host({children}: HostProps): ReactNode {
    return (
        <LexicalExtensionComposer
            extension={appExtension}
            contentEditable={null}
        >
            {children}
        </LexicalExtensionComposer>
    );
}

export interface ContentProps {
    ref: RefObject<HTMLDivElement | null>;
    contentClassName: string;
    placeholderClassName?: string;
    placeholder: string;
    onPaste: (event: React.ClipboardEvent<HTMLDivElement>) => void;
}

export function Content({
    ref,
    contentClassName,
    placeholderClassName,
    placeholder,
    onPaste,
}: ContentProps) {
    return (
        <div className="relative">
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
        </div>
    );
}

const appExtension = defineExtension({
    name: '[root]',
    onError: (error: unknown) => console.error(error),
    dependencies: [
        configExtension(HMRExtension, {hot: import.meta.hot ?? null}),
        HistoryExtension,
        PlainTextExtension,
    ],
});
