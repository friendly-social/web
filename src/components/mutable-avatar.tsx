import {AdjusterPayload, Adjuster, AdjusterCrop} from '@/components/adjuster';
import {FileDescriptor} from '@/types/file-descriptor';
import {FilePreuploadDescriptor} from '@/network/friendly-client';
import {resizeImage} from '@/network/image';
import {createFileLink} from '@/lib/utils';
import {toast} from 'sonner';
import {Pencil, Trash2, ImageIcon, Upload} from 'lucide-react';
import {useBackend} from '@/backend.context';
import {Spinner} from '@/components/ui/spinner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {ReactNode, useState, useRef, useEffect} from 'react';
import {useTranslations} from 'use-intl';
import {StyledAvatar} from './styled-avatar';
import {centerCrop, makeAspectCrop} from 'react-image-crop';

interface MutableAvatarContentProps {
    nickname: string;
    loading: boolean;
    setLoading: (value: boolean) => void;
    avatarProps:
        | {
              type: 'upload';
              avatar: FileDescriptor | null;
              setAvatar: (value: FileDescriptor | null) => void;
          }
        | {
              type: 'preupload';
              avatar: FilePreuploadDescriptor | null;
              setAvatar: (value: FilePreuploadDescriptor | null) => void;
          };
}

/**
 * Avatar Pipeline and Definitions:
 *
 * o User clicks on avatar.
 * o User selects either remove or pick.
 * o If user selects pick, system picker for image is shown
 * o After user selected image, adjuster is shown that allows to
 *   interactively resize image.
 * o After interactive adjust, image is compressed to be under 200KB.
 * o Then, setAvatar function is called.
 */
export function MutableAvatarContent({
    nickname,
    loading,
    setLoading,
    avatarProps,
}: MutableAvatarContentProps): ReactNode {
    const backend = useBackend();
    const t = useTranslations('edit_profile_dialog');

    const avatarInputRef = useRef<HTMLInputElement | null>(null);

    const [avatarUrl, setAvatarUrl] = useState<string | null>(
        avatarProps.type === 'upload' && avatarProps.avatar
            ? createFileLink(avatarProps.avatar)
            : null,
    );

    const [adjuster, setAdjuster] = useState<AdjusterPayload>({type: 'close'});

    useEffect(() => {
        return () => {
            if (avatarUrl) {
                URL.revokeObjectURL(avatarUrl);
            }
        };
    }, [avatarUrl]);

    async function onSelected(file: File) {
        setAdjuster({
            type: 'open',
            data: file,
        });
        if (avatarInputRef.current) {
            avatarInputRef.current.value = '';
        }
    }

    async function onAdjusted(file: File | null, crop: AdjusterCrop) {
        const previousAvatarUrl = avatarUrl;
        if (!file) {
            avatarProps.setAvatar(null);
            setAvatarUrl(null);
            return;
        }
        setLoading(true);
        try {
            const compressed = await resizeImage(file, crop);

            const src = URL.createObjectURL(compressed);
            setAvatarUrl(src);

            let ok = false;
            switch (avatarProps.type) {
                case 'upload': {
                    const result = await backend.uploadFile(compressed);
                    if (result.ok) {
                        ok = true;
                        avatarProps.setAvatar(result.data);
                    }
                    break;
                }
                case 'preupload': {
                    const result = await backend.preuploadFile(compressed);
                    if (result.ok) {
                        ok = true;
                        avatarProps.setAvatar(result.data);
                    }
                    break;
                }
                default:
                    avatarProps satisfies never;
            }
            if (!ok) {
                toast.error(t('error-connection'));
                setAvatarUrl(previousAvatarUrl);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full flex justify-center">
            <Adjuster
                payload={adjuster}
                setPayload={setAdjuster}
                title={t('adjuster')}
                aspect={1}
                initialCrop={({width, height}) => {
                    return centerCrop(
                        makeAspectCrop(
                            {unit: '%', width: 90, height: 90},
                            1,
                            width,
                            height,
                        ),
                        width,
                        height,
                    );
                }}
                onAdjusted={(file, result) => void onAdjusted(file, result)}
            />
            <AvatarDropdown
                onDelete={() =>
                    void onAdjusted(null, {x: 0, y: 0, width: 0, height: 0})
                }
                onSelect={() => avatarInputRef?.current?.click()}
                show={!!avatarProps.avatar}
            >
                <div className="relative cursor-pointer">
                    <StyledAvatar
                        avatarClassName="w-22 h-22 ring-2 ring-background shadow-sm"
                        avatarImageClassName={
                            loading ? 'blur-xs brightness-80' : undefined
                        }
                        src={avatarUrl ?? undefined}
                        nickname={nickname}
                        fallbackContent={<Upload />}
                    />
                    <div className="size-6 absolute bottom-1 right-1 rounded-full bg-card border border-border">
                        <Pencil className="size-full p-1" />
                    </div>
                    {loading && (
                        <Spinner className="text-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                    )}
                </div>
            </AvatarDropdown>
            <input
                className="hidden"
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                placeholder="Avatar"
                onChange={e => {
                    const files = e.target.files;
                    if (files) {
                        void onSelected(files[0]);
                    }
                }}
            />
        </div>
    );
}

interface AvatarDropdownProps {
    show: boolean;
    onDelete: () => void;
    onSelect: () => void;
    children: ReactNode;
}

function AvatarDropdown({
    show,
    onDelete,
    onSelect,
    children,
}: AvatarDropdownProps): ReactNode {
    const t = useTranslations('edit_profile_dialog');

    if (show) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
                <DropdownMenuContent className="w-40" align="start">
                    <DropdownMenuItem onClick={onDelete}>
                        <Trash2 className="size-4" />
                        {t('remove-avatar')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onSelect}>
                        <ImageIcon className="size-4" />
                        {t('select-avatar')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    } else {
        return <div onClick={onSelect}>{children}</div>;
    }
}
