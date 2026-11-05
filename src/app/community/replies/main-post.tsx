import {Button} from '@/components/ui/button';
import * as richEditor from '@/components/lexical-rich-editor';
import {useImagePreviewerController} from '@/components/image-previewer';
import {AdjusterPayload, Adjuster, AdjusterCrop} from '@/components/adjuster';
import {isMobile} from '@/lib/is-mobile';
import {resizeImage} from '@/network/image';
import {toast} from 'sonner';
import {FileDescriptor} from '@/types/file-descriptor';
import {CommunityPostDescriptor} from '@/network/friendly-client';
import {communityPosts} from '@/services/community-posts-service';
import {forceUnwrap} from '@/network/result';
import {CommunityDetailsResponse} from '@/network/friendly-client';
import {useMutation} from '@tanstack/react-query';
import {MainPostMenu} from '@/app/community/replies/main-post-menu';
import {Send, Loader2, Pen, X, Paperclip, Check, Eye} from 'lucide-react';
import {cn} from '@/lib/utils';
import {users} from '@/services/users-service';
import {useAppContext} from '@/app.context';
import {Clock} from 'lucide-react';
import {useTranslations} from 'use-intl';
import {CommunityPostDetailsPlain} from '@/network/friendly-client';
import {StyledAvatar} from '@/components/styled-avatar';
import {createFileLink} from '@/lib/utils';
import {useNavigate} from 'react-router';
import {useFriendlyStorage} from '@/components/friendly-storage-provider';
import React, {
    RefObject,
    useRef,
    useState,
    useMemo,
    lazy,
    useLayoutEffect,
} from 'react';
import {
    $createLineBreakNode,
    $getRoot,
    $isLineBreakNode,
    $isParagraphNode,
    COMMAND_PRIORITY_HIGH,
    HISTORY_MERGE_TAG,
    KEY_ENTER_COMMAND,
    type LexicalEditor,
} from 'lexical';
import {
    $appendFromRichText,
    convertToRichText,
    EmptyRichText,
    RichText,
    richTextParser,
} from '@/network/rich-text';
import {useLatest} from '@/use-latest';
import {
    createEmptyHistoryState,
    HistoryExtension,
    HistoryState,
} from '@lexical/history';
import {getExtensionDependencyFromEditor} from '@lexical/extension';
import {newPost} from '@/services/new-post-service';
import {$createImageNode} from '@/components/lexical-image-node';

const MarkdownArea = lazy(() =>
    import('@/components/ui/markdown-area').then(m => ({
        default: m.MarkdownArea,
    })),
);

interface MainPostCardProps {
    first: boolean;
    details: CommunityDetailsResponse;
    postRef: RefObject<HTMLDivElement | null>;
    popDepth: number;
    showKeyboard: boolean;
}

const emojis = [
    '❤️',
    '🔥',
    '👍',
    '🤝',
    '😁',
    '🎉',
    '🤯',
    '👀',
    '🥰',
    '🥺',
    '😭',
    '😇',
    '💯',
    '✅',
    '🫡',
];

type InputAction = 'send' | 'edit';

export function MainPostCard({
    first,
    details,
    postRef,
    popDepth,
    showKeyboard,
}: MainPostCardProps) {
    const app = useAppContext();
    const inputRef = useRef<HTMLDivElement | null>(null);
    const [action, setAction] = useState<InputAction>('send');

    const editorRef = useRef<LexicalEditor | null>(null);
    function editor() {
        if (!editorRef.current) {
            throw new Error('Cannot get editor outside composition');
        }
        return editorRef.current;
    }
    useSendState();
    useEditState();
    useSubmitOnEnter();
    useShowKeyboard();

    const text = useRichTextView();

    const textTooLong = text.markdown.length > 4096;
    const showTextLength = text.markdown.length > 4000;

    const self = users.useSelf(app);

    const deleteMutation = useDeleteMutation({details, popDepth: popDepth - 1});

    const createMutation = useCreateMutation({
        details,
        popDepth,
        onSuccess: () => richEditor.clearText(editor()),
    });

    const editMutation = useEditMutation({
        details,
        onSuccess: stopEditing,
    });

    const attachImageMutation = useAttachImageMutation({
        onSuccess: descriptor => {
            const url = createFileLink(descriptor);
            editor().update(() => {
                const paragraph = $getRoot().getChildAtIndex(0);
                if (!$isParagraphNode(paragraph)) {
                    throw new Error('Can only append to a paragraph node');
                }
                const endsWithNewline = $isLineBreakNode(
                    paragraph.getLastChild(),
                );
                if (!endsWithNewline) {
                    paragraph.append($createLineBreakNode());
                }
                paragraph.append($createImageNode(url));
            });
        },
    });

    const isSubmitting = createMutation.isPending || editMutation.isPending;
    const forbidSubmit =
        isSubmitting ||
        attachImageMutation.isPending ||
        !text.markdown.trim() ||
        textTooLong;

    function startEditing() {
        if (isSubmitting) return;
        setAction('edit');
    }

    function stopEditing() {
        setAction('send');
    }

    function onSubmit() {
        if (forbidSubmit) return;
        switch (action) {
            case 'send':
                createMutation.mutate({
                    text: text.markdown,
                    showKeyboard: true,
                });
                break;
            case 'edit':
                editMutation.mutate(text.markdown);
                break;
            default:
                action satisfies never;
        }
    }

    function onDelete() {
        if (isSubmitting) return;
        deleteMutation.mutate();
    }

    let card;
    if (deleteMutation.isPending) {
        card = <MainPostCardLoading first={first} />;
    } else
        switch (details.post.type) {
            case 'plain':
                card = (
                    <MainPostCardPlain
                        first={first}
                        editorRef={editorRef}
                        post={details.post}
                        action={action}
                        onDelete={onDelete}
                        onEdit={startEditing}
                        isAuthor={self.data?.user?.id === details.post.owner.id}
                    />
                );
                break;
            case 'deleted':
                card = (
                    <MainPostCardDeleted
                        first={first}
                        instant={details.post.instant}
                    />
                );
                break;
        }

    function useRichTextView(): RichText {
        const [text, setText] = useState(EmptyRichText);
        useLayoutEffect(() => {
            const updates = editor().registerUpdateListener(({editorState}) => {
                editorState.read(() => {
                    setText(convertToRichText($getRoot()));
                });
            });
            return () => {
                updates();
            };
        }, [action]);
        return text;
    }

    function useSendState() {
        const [initialJson] = useState(() => newPost.getReplyLexicalJson());
        const jsonRef = useRef<string | null>(initialJson);
        const [initialHistory] = useState(() => createEmptyHistoryState());
        const historyRef = useRef<HistoryState>(initialHistory);

        useLayoutEffect(() => {
            if (action !== 'send') return;
            const updates = editor().registerUpdateListener(({editorState}) => {
                jsonRef.current = JSON.stringify(editorState);
                newPost.setReplyLexicalJson(jsonRef.current);
            });
            if (jsonRef.current) {
                editor().setEditorState(
                    editor().parseEditorState(jsonRef.current),
                    {tag: HISTORY_MERGE_TAG},
                );
                editor().update(() => {
                    $getRoot().selectEnd();
                });
            }
            historyRef.current = {
                current: historyRef.current.current
                    ? {
                          editor: editor(),
                          editorState: historyRef.current.current.editorState,
                      }
                    : null,
                undoStack: historyRef.current.undoStack.map(entry => ({
                    editor: editor(),
                    editorState: entry.editorState,
                })),
                redoStack: historyRef.current.redoStack.map(entry => ({
                    editor: editor(),
                    editorState: entry.editorState,
                })),
            };
            getExtensionDependencyFromEditor(
                editor(),
                HistoryExtension,
            ).output.historyState.value = historyRef.current;
            return () => {
                updates();
            };
        }, [action]);
    }

    function useEditState() {
        useLayoutEffect(() => {
            if (action !== 'edit') return;
            if (details.post.type !== 'plain') {
                throw new Error('Can only edit plain posts');
            }
            const markdown = details.post.text;
            const root = richTextParser.parse(markdown);
            editor().update(
                () => {
                    $getRoot().clear();
                    $appendFromRichText(
                        $getRoot(),
                        {markdown, entities: {}},
                        root,
                    );
                    $getRoot().selectEnd();
                },
                {
                    onUpdate: () => editor().focus(),
                    tag: HISTORY_MERGE_TAG,
                },
            );
            inputRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest',
            });
        }, [action]);
    }

    function useSubmitOnEnter() {
        const latest = useLatest({onSubmit});
        useLayoutEffect(() => {
            return registerEnter(editor(), () => latest.current.onSubmit());
        }, [action]);
    }

    function useShowKeyboard() {
        useLayoutEffect(() => {
            if (showKeyboard || action === 'edit') {
                editor().focus();
            }
        }, [action]);
    }

    return (
        <div className="scroll-m-40" ref={postRef}>
            {card}
            <InputField
                ref={inputRef}
                editorRef={editorRef}
                key={action}
                action={action}
                text={text}
                textTooLong={textTooLong}
                showTextLength={showTextLength}
                textLength={text.markdown.length}
                forbidSubmit={forbidSubmit}
                isSubmitting={isSubmitting}
                onSubmit={onSubmit}
                onAdjusted={(file, crop) => {
                    editor().focus();
                    attachImageMutation.mutate({file, crop});
                }}
                isAttaching={attachImageMutation.isPending}
                stopEditing={stopEditing}
            />
            <div className="h-2" />
            <div className={cn('flex gap-1 overflow-x-auto scrollbar-none')}>
                {emojis.map((emoji, index) => (
                    <Emoji
                        key={index}
                        emoji={emoji}
                        disabled={isSubmitting}
                        onClick={() => {
                            const showKeyboard =
                                inputRef?.current === document.activeElement;
                            if (
                                text.markdown.length === 0 &&
                                action === 'send'
                            ) {
                                createMutation.mutate({
                                    text: emoji,
                                    showKeyboard,
                                });
                            } else {
                                richEditor.appendText(editor(), emoji);
                            }
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

interface InputFieldProps {
    ref: RefObject<HTMLDivElement | null>;
    editorRef: RefObject<LexicalEditor | null>;
    action: InputAction;
    text: RichText;
    textTooLong: boolean;
    showTextLength: boolean;
    textLength: number;
    forbidSubmit: boolean;
    isSubmitting: boolean;
    onSubmit: () => void;
    onAdjusted: (file: File, crop: AdjusterCrop) => void;
    isAttaching: boolean;
    stopEditing: () => void;
}

function InputField({
    ref,
    editorRef,
    action,
    text,
    textTooLong,
    showTextLength,
    forbidSubmit,
    isSubmitting,
    onSubmit,
    onAdjusted,
    isAttaching,
    stopEditing,
}: InputFieldProps) {
    const app = useAppContext();

    const [adjuster, setAdjuster] = useState<AdjusterPayload>({type: 'close'});
    const imagePreviewer = useImagePreviewerController();

    const self = users.useSelf(app);

    function onAttach(data: File) {
        setAdjuster({type: 'open', data});
    }

    function onPaste(event: ClipboardEvent) {
        const file = event.clipboardData?.files[0];
        if (file && file.type.startsWith('image')) {
            event.preventDefault();
            onAttach(file);
        }
    }

    const t = useTranslations('replies');

    const selfAvatar = useMemo(
        () =>
            self.data?.user?.avatar
                ? createFileLink(self.data.user.avatar)
                : '',
        [self],
    );

    const [verticalMenu, setVerticalMenu] = useState(false);
    const [showPreviewOption, setShowPreviewOption] = useState(false);
    const [preview, setPreview] = useState(false);

    useLayoutEffect(() => {
        const input = ref.current;
        if (!input) return;
        if (preview) return;

        const observer = new ResizeObserver(([entry]) => {
            const style = window.getComputedStyle(input);
            const height = entry.contentRect.height;
            const lines = height / parseFloat(style.lineHeight);
            if (lines >= 3) {
                setVerticalMenu(true);
            }
            if (lines >= 6) {
                setShowPreviewOption(true);
            }
        });
        observer.observe(input);

        return () => {
            observer.disconnect();
        };
    }, [preview]);

    return (
        <div
            className={cn(
                'flex bg-card flex-row gap-2 px-2 py-1',
                'rounded-bl-xl rounded-br-xl',
                'border border-border',
            )}
        >
            <StyledAvatar
                avatarClassName="mt-1 w-8 h-8"
                src={selfAvatar}
                nickname={self.data?.user?.nickname ?? ''}
            />
            <div className="flex-1 min-w-0 flex flex-col">
                {preview && (
                    <MarkdownArea
                        className="text-foreground"
                        text={text.markdown}
                        onImageClick={e => {
                            e.stopPropagation();
                            void imagePreviewer.setPayload({
                                type: 'open',
                                src: e.currentTarget.src,
                            });
                        }}
                    />
                )}
                <richEditor.Content
                    ref={ref}
                    editorRef={editorRef}
                    contentClassName={cn(
                        'min-h-10 w-full content-center',
                        'text-sm outline-none resize-none',
                        'scroll-m-60 field-sizing-content',
                        'space-y-[1em] leading-5',
                        preview ? 'hidden' : 'block',
                    )}
                    placeholderClassName="text-sm mt-2.5"
                    onPaste={onPaste}
                    placeholder={t('reply-placeholder')}
                />
                <div className="w-full flex">
                    {textTooLong ? (
                        <div className="text-destructive text-xs mb-2">
                            {t('too-long')}
                        </div>
                    ) : undefined}
                    <div className="flex-1" />
                    {showTextLength ? (
                        <div
                            className={cn(
                                'text-xs mb-2',
                                textTooLong ? 'text-destructive' : '',
                            )}
                        >
                            {text.markdown.length} / 4096
                        </div>
                    ) : undefined}
                </div>
            </div>
            <SubmitMenu
                vertical={verticalMenu}
                preview={preview}
                showPreviewOption={showPreviewOption}
                action={action}
                forbidSubmit={forbidSubmit}
                isSubmitting={isSubmitting}
                isAttaching={isAttaching}
                onStopEdit={stopEditing}
                onAttach={onAttach}
                onPreview={() => setPreview(!preview)}
                onSubmit={() => onSubmit()}
            />
            <Adjuster
                title={t('adjuster')}
                payload={adjuster}
                setPayload={setAdjuster}
                onAdjusted={onAdjusted}
            />
        </div>
    );
}

interface EmojiProps {
    emoji: string;
    onClick: (value: React.UIEvent) => void;
    disabled: boolean;
}

function Emoji({emoji, onClick, disabled}: EmojiProps) {
    return (
        <span
            onClick={event => {
                if (disabled) return;
                onClick(event);
            }}
            onMouseDown={event => event.preventDefault()}
            className={cn(
                'flex bg-card rounded-xl',
                'border border-border flex-row gap-2 px-2 py-1 hover:bg-accent/50',
                'cursor-pointer',
                disabled ? 'opacity-40' : '',
            )}
        >
            {emoji}
        </span>
    );
}

interface MainPostCardLoading {
    first: boolean;
}

function MainPostCardLoading({first}: MainPostCardLoading) {
    return (
        <div
            className={cn(
                'bg-card p-4 cursor-pointer',
                'border-l border-r border-t border-border',
                first ? 'rounded-tl-xl rounded-tr-xl' : '',
            )}
        >
            <Loader2 className="m-auto animate-spin text-muted-foreground" />
        </div>
    );
}

export interface MainPostCardPlainProps {
    first: boolean;
    editorRef: RefObject<LexicalEditor | null>;
    post: CommunityPostDetailsPlain;
    action: InputAction;
    onDelete: () => void;
    onEdit: () => void;
    isAuthor: boolean;
}

function MainPostCardPlain({
    first,
    editorRef,
    post,
    action,
    onDelete,
    onEdit,
    isAuthor,
}: MainPostCardPlainProps) {
    const t = useTranslations('post');
    const navigate = useNavigate();
    const storage = useFriendlyStorage();

    const imagePreviewer = useImagePreviewerController();

    const avatarUrl = post.owner.avatar
        ? createFileLink(post.owner.avatar)
        : undefined;
    const postTime = new Date(post.instant);

    async function navigateProfile(event: React.MouseEvent) {
        event.stopPropagation();
        await storage.userAccessHashes.save([
            {
                id: post.owner.id,
                accessHash: post.owner.accessHash,
            },
        ]);
        await navigate(`/user/${post.owner.id}`);
    }

    return (
        <div
            className={cn(
                first ? 'rounded-tl-xl rounded-tr-xl' : '',
                'border-l border-r border-t border-border',
                'bg-card p-4',
                action === 'edit'
                    ? 'pointer-events-none opacity-50 select-none'
                    : '',
            )}
        >
            <div className="flex gap-3">
                <StyledAvatar
                    avatarClassName="w-10 h-10 cursor-pointer"
                    onClick={event => void navigateProfile(event)}
                    src={avatarUrl}
                    nickname={post.owner.nickname}
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p
                            className="font-semibold text-foreground truncate cursor-pointer"
                            onClick={event => {
                                if (
                                    window.getSelection()?.isCollapsed === false
                                )
                                    return;
                                void navigateProfile(event);
                            }}
                        >
                            {post.owner.nickname}
                        </p>
                        <span
                            title={postTime.toLocaleString()}
                            className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap shrink-0"
                        >
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(t, postTime)}
                            {post.edited ? ' ' + t('edited') : undefined}
                        </span>
                        <div className="flex-1" />
                        <MainPostMenu
                            onDelete={onDelete}
                            onEdit={onEdit}
                            onCloseAutoFocus={() => editorRef.current?.focus()}
                            showDelete={isAuthor}
                        />
                    </div>
                    <MarkdownArea
                        className="text-foreground break-words"
                        text={post.text}
                        onImageClick={e => {
                            e.stopPropagation();
                            void imagePreviewer.setPayload({
                                type: 'open',
                                src: e.currentTarget.src,
                            });
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

interface MainPostCardDeletedProps {
    first: boolean;
    instant: string;
}

function MainPostCardDeleted({first, instant}: MainPostCardDeletedProps) {
    const t = useTranslations('post');
    const postTime = new Date(instant);

    return (
        <div
            className={cn(
                first ? 'rounded-tl-xl rounded-tr-xl' : '',
                'border-l border-r border-t border-border',
                'bg-card',
                'p-4 cursor-pointer flex items-center justify-between',
            )}
        >
            <p className="italic text-foreground truncate cursor-pointer">
                {t('deleted')}
            </p>
            <span
                title={postTime.toLocaleString()}
                className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap"
            >
                <Clock className="h-3 w-3" />
                {formatTimeAgo(t, postTime)}
            </span>
        </div>
    );
}

function formatTimeAgo(
    t: ReturnType<typeof useTranslations<'post'>>,
    date: Date,
) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return t('just_now');
    if (diffMins < 60) return t('minutes_ago', {count: diffMins});
    if (diffHours < 24) return t('hours_ago', {count: diffHours});
    if (diffDays < 7) return t('days_ago', {count: diffDays});
    return date.toLocaleDateString();
}

interface UseDeleteMutationProps {
    details: CommunityDetailsResponse;
    popDepth: number;
}

function useDeleteMutation({details, popDepth}: UseDeleteMutationProps) {
    const app = useAppContext();
    const navigate = useNavigate();
    const t = useTranslations('replies');

    async function navigateReplies(descriptor: CommunityPostDescriptor) {
        await navigate(`/community/${descriptor.id}/replies`, {
            state: {popDepth},
            replace: true,
        });
    }

    return useMutation({
        mutationKey: ['communityDelete', details.post.id],
        mutationFn: async () => {
            const result = await app.backend.communityDelete({
                id: details.post.id,
            });
            forceUnwrap(result);
            if (details.replies.data.length === 0) {
                if (details.upstream.length === 0) {
                    await communityPosts.prefetchList(app, {staleTime: 0});
                    await navigate('/community');
                } else {
                    const lastUpstream =
                        details.upstream[details.upstream.length - 1];
                    await app.queryClient.prefetchInfiniteQuery({
                        ...communityPosts.repliesOptions(app, lastUpstream),
                        staleTime: 0,
                    });
                    await navigateReplies({...lastUpstream});
                }
            } else {
                await communityPosts.setPosts(app, [
                    {
                        type: 'deleted',
                        id: details.post.id,
                        accessHash: details.post.accessHash,
                        instant: details.post.instant,
                        replyPreviews: details.post.replyPreviews,
                        newUnreadId: details.post.newUnreadId,
                    },
                ]);
            }
        },
        onError: error => {
            toast.error(error.message ?? t('post_create_error'));
        },
    });
}

interface UseAttachImageMutationProps {
    onSuccess: (descriptor: FileDescriptor) => void;
}

function useAttachImageMutation({onSuccess}: UseAttachImageMutationProps) {
    const app = useAppContext();
    return useMutation({
        mutationFn: async (props: {file: File; crop: AdjusterCrop}) => {
            const {file, crop} = props;
            const compressed = await resizeImage(file, crop);
            const descriptor = forceUnwrap(
                await app.backend.uploadFile(compressed),
            );
            onSuccess(descriptor);
        },
    });
}

interface UseCreateMutationProps {
    details: CommunityDetailsResponse;
    popDepth: number;
    onSuccess: () => void;
}

function useCreateMutation({
    details,
    popDepth,
    onSuccess,
}: UseCreateMutationProps) {
    const app = useAppContext();
    const navigate = useNavigate();
    const t = useTranslations('replies');

    async function navigateReplies(
        descriptor: CommunityPostDescriptor,
        showKeyboard: boolean,
    ) {
        await navigate(`/community/${descriptor.id}/replies`, {
            state: {popDepth, showKeyboard},
        });
    }

    return useMutation({
        mutationFn: async (props: {text: string; showKeyboard: boolean}) => {
            props.text = props.text.trim();

            const post = {
                replyTo: {
                    id: details.post.id,
                    accessHash: details.post.accessHash,
                },
                text: props.text,
            };
            const result = await app.backend.communityPost(post);
            try {
                const response = {
                    post: {
                        type: 'plain',
                        ...post,
                        ...forceUnwrap(result),
                        replyPreviews: [],
                        newUnreadId: null,
                        instant: new Date().toISOString(),
                        owner: (await users.ensureCachedSelf(app)).user,
                        edited: false,
                    },
                    replies: {data: [], nextId: null},
                    upstream: [...details.upstream, details.post],
                } satisfies CommunityDetailsResponse;
                await communityPosts.setDetails(app, [response]);
                void app.queryClient.invalidateQueries({
                    queryKey: ['communityReplies', details.post.id],
                });
                onSuccess();
                await navigateReplies(response.post, props.showKeyboard);
            } catch (error) {
                if (error instanceof Error) {
                    toast.error(error.message ?? t('post_create_error'));
                }
            }
        },
        onError: error => {
            toast.error(error.message ?? t('post_create_error'));
        },
    });
}

interface UseEditMutationProps {
    details: CommunityDetailsResponse;
    onSuccess: () => void;
}

function useEditMutation({details, onSuccess}: UseEditMutationProps) {
    const app = useAppContext();
    const t = useTranslations('replies');

    return useMutation({
        mutationFn: async (text: string) => {
            text = text.trim();

            if (details.post.type !== 'plain') {
                throw new Error('Can only edit plain posts');
            }

            forceUnwrap(
                await app.backend.communityEdit(details.post.id, {
                    text: {value: text},
                }),
            );
            await communityPosts.setDetails(app, [
                {
                    ...details,
                    post: {
                        ...details.post,
                        text,
                        edited: true,
                    },
                },
            ]);
        },
        onSuccess,
        onError: () => toast.error(t('unknown_error')),
    });
}

interface SubmitMenuProps {
    vertical: boolean;
    preview: boolean;
    showPreviewOption: boolean;
    action: InputAction;
    forbidSubmit: boolean;
    isSubmitting: boolean;
    isAttaching: boolean;
    onStopEdit: () => void;
    onSubmit: () => void;
    onPreview: () => void;
    onAttach: (file: File) => void;
}

function SubmitMenu({
    onStopEdit,
    onSubmit,
    onAttach,
    vertical,
    action,
    forbidSubmit,
    isSubmitting,
    isAttaching,
    preview,
    onPreview,
    showPreviewOption,
}: SubmitMenuProps) {
    const imageInputRef = useRef<HTMLInputElement | null>(null);

    function onImageSelected(file: File) {
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
        onAttach(file);
    }

    function attachImage() {
        imageInputRef.current?.click();
    }

    return (
        <>
            <div className={cn('flex-row', vertical ? 'hidden' : 'flex')}>
                {action === 'edit' ? (
                    <Button
                        className="mt-1 w-8 h-8"
                        onClick={onStopEdit}
                        onMouseDown={event => event.preventDefault()}
                        variant="ghost"
                    >
                        <X />
                    </Button>
                ) : undefined}
                <Button
                    className="mt-1 w-8 h-8 me-1"
                    disabled={isAttaching}
                    onClick={attachImage}
                    onMouseDown={event => event.preventDefault()}
                    variant="ghost"
                >
                    {isAttaching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Paperclip />
                    )}
                    <input
                        className="hidden"
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        placeholder="Avatar"
                        onChange={e => {
                            const files = e.target.files;
                            if (files) {
                                void onImageSelected(files[0]);
                            }
                        }}
                    />
                </Button>
                <Button
                    className="mt-1 w-8 h-8"
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => onSubmit()}
                    disabled={forbidSubmit}
                >
                    {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : action === 'send' ? (
                        <Send />
                    ) : (
                        <Pen />
                    )}
                </Button>
            </div>
            <div className={cn('flex flex-col', vertical ? 'flex' : 'hidden')}>
                <Button
                    className="mt-1 w-8 h-8"
                    onClick={onSubmit}
                    disabled={forbidSubmit}
                    onMouseDown={event => event.preventDefault()}
                >
                    {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : action === 'send' ? (
                        <Send />
                    ) : (
                        <Check />
                    )}
                </Button>
                <Button
                    className="mt-1 w-8 h-8"
                    disabled={isAttaching}
                    onClick={attachImage}
                    onMouseDown={event => event.preventDefault()}
                    variant="ghost"
                >
                    {isAttaching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Paperclip />
                    )}
                    <input
                        className="hidden"
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        placeholder="Avatar"
                        onChange={e => {
                            const files = e.target.files;
                            if (files) {
                                void onImageSelected(files[0]);
                            }
                        }}
                    />
                </Button>
                {showPreviewOption && (
                    <Button
                        className="mt-1 w-8 h-8 mt-1"
                        onClick={() => onPreview()}
                        variant="ghost"
                    >
                        {preview ? <Pen /> : <Eye />}
                    </Button>
                )}
                {action === 'edit' ? (
                    <Button
                        className="w-8 h-8"
                        onClick={onStopEdit}
                        onMouseDown={event => event.preventDefault()}
                        variant="ghost"
                    >
                        <X />
                    </Button>
                ) : undefined}
            </div>
        </>
    );
}

function registerEnter(editor: LexicalEditor, handleSubmit: () => void) {
    return editor.registerCommand(
        KEY_ENTER_COMMAND,
        event => {
            if (!event || event.shiftKey || isMobile()) return false;
            handleSubmit();
            event.preventDefault();
            return true;
        },
        COMMAND_PRIORITY_HIGH,
    );
}
