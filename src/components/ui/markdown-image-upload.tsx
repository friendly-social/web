import {useBackend} from '@/backend.context';
import {Button} from '@/components/ui/button';
import {createFileLink} from '@/lib/utils';
import {
    markdownImageAcceptedTypes,
    prepareMarkdownImage,
    validateMarkdownImage,
} from '@/network/image';
import {forceUnwrap} from '@/network/result';
import {ImagePlus, Loader2} from 'lucide-react';
import {ChangeEvent, RefObject, useRef, useState} from 'react';
import {toast} from 'sonner';
import {useTranslations} from 'use-intl';

interface MarkdownImageUploadProps {
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    text: string;
    disabled: boolean;
    onTextChange: (text: string) => void;
    onUploadingChange: (uploading: boolean) => void;
}

interface MarkdownInsertion {
    text: string;
    cursor: number;
}

export function MarkdownImageUpload({
    textareaRef,
    text,
    disabled,
    onTextChange,
    onUploadingChange,
}: MarkdownImageUploadProps) {
    const t = useTranslations('markdown-input');
    const backend = useBackend();
    const inputRef = useRef<HTMLInputElement>(null);
    const textRef = useRef(text);
    const [isUploading, setIsUploading] = useState(false);
    textRef.current = text;

    async function selectImage(event: ChangeEvent<HTMLInputElement>) {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = '';
        if (!file) return;

        const validationError = validateMarkdownImage(file);
        if (validationError) {
            toast.error(t(`image-${validationError}`));
            return;
        }

        setIsUploading(true);
        onUploadingChange(true);
        try {
            const preparedImage = await prepareMarkdownImage(file);
            const descriptor = forceUnwrap(
                await backend.uploadFile(preparedImage),
            );
            const textarea = textareaRef.current;
            const currentText = textRef.current;
            const start = textarea?.selectionStart ?? currentText.length;
            const end = textarea?.selectionEnd ?? start;
            const selectedText = currentText.slice(start, end).trim();
            const alt = normalizeAltText(
                selectedText || file.name.replace(/\.[^.]+$/, ''),
            );
            const markdown = `![${alt || t('image')}](${createFileLink(descriptor)})`;
            const insertion = insertMarkdown(
                currentText,
                start,
                end,
                markdown,
            );
            onTextChange(insertion.text);
            requestAnimationFrame(() => {
                textareaRef.current?.focus();
                textareaRef.current?.setSelectionRange(
                    insertion.cursor,
                    insertion.cursor,
                );
            });
        } catch {
            toast.error(t('image-upload-error'));
        } finally {
            setIsUploading(false);
            onUploadingChange(false);
        }
    }

    return (
        <>
            <Button
                variant="ghost"
                disabled={disabled || isUploading}
                onClick={() => inputRef.current?.click()}
            >
                {isUploading ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <ImagePlus />
                )}
                {t('image')}
            </Button>
            <input
                ref={inputRef}
                className="hidden"
                type="file"
                accept={markdownImageAcceptedTypes.join(',')}
                disabled={disabled || isUploading}
                onChange={event => void selectImage(event)}
            />
        </>
    );
}

function normalizeAltText(value: string): string {
    return value.replace(/[[\]\\]/g, '').trim();
}

function insertMarkdown(
    text: string,
    start: number,
    end: number,
    markdown: string,
): MarkdownInsertion {
    const before = text.slice(0, start);
    const after = text.slice(end);
    const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
    const suffix = after.length > 0 && !after.startsWith('\n') ? '\n' : '';
    const inserted = `${prefix}${markdown}${suffix}`;

    return {
        text: `${before}${inserted}${after}`,
        cursor: before.length + inserted.length,
    };
}
