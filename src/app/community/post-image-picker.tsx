import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {postImageAcceptedTypes, validatePostImage} from '@/network/image';
import {ImagePlus, X} from 'lucide-react';
import {ChangeEvent, useEffect, useMemo, useRef} from 'react';
import {toast} from 'sonner';
import {useTranslations} from 'use-intl';

export interface PostImageDraft {
    file: File;
    altText: string;
}

interface PostImagePickerProps {
    value: PostImageDraft | null;
    disabled: boolean;
    onChange: (value: PostImageDraft | null) => void;
}

export function PostImagePicker({
    value,
    disabled,
    onChange,
}: PostImagePickerProps) {
    const t = useTranslations('community');
    const inputRef = useRef<HTMLInputElement>(null);
    const file = value?.file;
    const previewUrl = useMemo(
        () => (file ? URL.createObjectURL(file) : null),
        [file],
    );

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    function selectImage(event: ChangeEvent<HTMLInputElement>) {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = '';
        if (!file) return;

        const validationError = validatePostImage(file);
        if (validationError) {
            toast.error(t(`image-${validationError}`));
            return;
        }

        onChange({file, altText: ''});
    }

    return (
        <div className="mt-2 flex flex-col gap-2">
            {value && previewUrl && (
                <div className="flex flex-col gap-2">
                    <div className="relative overflow-hidden rounded-lg border border-border bg-muted/20">
                        <img
                            className="max-h-96 w-full object-contain"
                            src={previewUrl}
                            alt={value.altText}
                        />
                        <Button
                            className="absolute right-2 top-2 size-8"
                            variant="secondary"
                            size="icon"
                            disabled={disabled}
                            aria-label={t('remove-image')}
                            onClick={() => onChange(null)}
                        >
                            <X />
                        </Button>
                    </div>
                    <Input
                        value={value.altText}
                        disabled={disabled}
                        maxLength={300}
                        aria-label={t('image-alt-label')}
                        placeholder={t('image-alt-placeholder')}
                        onChange={event =>
                            onChange({...value, altText: event.target.value})
                        }
                    />
                </div>
            )}
            <div>
                <Button
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => inputRef.current?.click()}
                >
                    <ImagePlus />
                    {value ? t('replace-image') : t('add-image')}
                </Button>
                <input
                    ref={inputRef}
                    className="hidden"
                    type="file"
                    accept={postImageAcceptedTypes.join(',')}
                    disabled={disabled}
                    onChange={selectImage}
                />
            </div>
        </div>
    );
}
