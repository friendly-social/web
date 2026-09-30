import * as Dialog from '@radix-ui/react-dialog';
import {TopBar, useTopBarContext} from '@/app/top-bar';
import {useRef, useEffect, useLayoutEffect} from 'react';
import panzoom from 'panzoom';
import {cn} from '@/lib/utils';

export type ImagePreviewerPayload =
    | {
          type: 'open';
          src: string;
      }
    | {
          type: 'close';
      };

export interface ImagePreviewerProps {
    payload: ImagePreviewerPayload;
    setPayload: (value: ImagePreviewerPayload) => void;
}

export function ImagePreviewer({payload, setPayload}: ImagePreviewerProps) {
    return (
        <Dialog.Root
            open={payload.type === 'open'}
            onOpenChange={() => setPayload({type: 'close'})}
        >
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-2" />
                <Dialog.Content
                    onClick={e => {
                        e.stopPropagation();
                        setPayload({type: 'close'});
                    }}
                    className={cn('z-2 fixed left-0 top-0 right-0 bottom-0')}
                >
                    {payload.type === 'open' && <Content payload={payload} />}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

interface ContentProps {
    payload: ImagePreviewerPayload & {type: 'open'};
}

function Content({payload}: ContentProps) {
    const imgRef = useRef<HTMLImageElement>(null);
    const topBar = useTopBarContext();

    useLayoutEffect(() => {
        topBar.setCloseButton({
            onClick: () => {
                // clicking anywhere on top bar closes image
            },
        });
    }, []);

    useEffect(() => {
        const img = imgRef.current;
        if (!img) return;
        const instance = panzoom(img, {});
        return instance.dispose;
    }, []);

    function onImageLoad(event: React.UIEvent<HTMLImageElement>) {
        const img = event.currentTarget;
        const {naturalWidth, naturalHeight, clientWidth, clientHeight} = img;
        const scale = Math.min(
            clientWidth / naturalWidth,
            clientHeight / naturalHeight,
        );
        img.style.width = `${naturalWidth * scale}px`;
        img.style.height = `${naturalHeight * scale}px`;

        img.style.visibility = 'visible';
    }

    return (
        <div className="flex flex-col h-full w-full">
            <TopBar {...topBar} />
            <div className="w-full h-px bg-border" />
            <div
                className={cn(
                    'flex-1 p-10 flex focus:outline-none',
                    'overflow-hidden',
                )}
            >
                <img
                    ref={imgRef}
                    className="invisible"
                    src={payload.src}
                    onLoad={onImageLoad}
                    onClick={e => e.stopPropagation()}
                />
            </div>
        </div>
    );
}
