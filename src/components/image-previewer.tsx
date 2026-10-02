import * as Dialog from '@radix-ui/react-dialog';
import {TopBar, useTopBarContext} from '@/app/top-bar';
import {useRef, useEffect, useState, useLayoutEffect} from 'react';
import createPanzoom, * as panzoom from '@y9san9/panzoom';
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

/*
 * Use image previewer with search params
 */
export function useImagePreviewer(): ImagePreviewerProps {
    const [payload, setPayload] = useState<ImagePreviewerPayload>({
        type: 'close',
    });

    return {
        payload,
        setPayload,
    };
}

export function ImagePreviewer({payload, setPayload}: ImagePreviewerProps) {
    return (
        <Dialog.Root
            open={payload.type === 'open'}
            onOpenChange={() => setPayload({type: 'close'})}
        >
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-2 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-100" />
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
    const [panzoom, setPanzoom] = useState<panzoom.PanZoom | null>(null);

    useLayoutEffect(() => {
        topBar.setCloseButton({
            onClick: () => {
                // clicking anywhere on top bar closes image
            },
        });
    }, []);

    useEffect(() => {
        function onResize() {
            console.log('resize');
            if (imgRef.current) {
                onImageLoad(imgRef.current);
            }
        }
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [onImageLoad]);

    useEffect(() => {
        const img = imgRef.current;
        if (!img) return;
        const panzoom = createPanzoom(img, {
            onTouch: () => false,
        });
        setPanzoom(panzoom);
        return panzoom.dispose;
    }, []);

    function onImageLoad(img: HTMLImageElement) {
        const {naturalWidth, naturalHeight, clientWidth, clientHeight} = img;
        const scale = Math.min(
            clientWidth / naturalWidth,
            clientHeight / naturalHeight,
        );
        img.style.width = `${naturalWidth * scale}px`;
        img.style.height = `${naturalHeight * scale}px`;
        img.style.visibility = 'visible';
        centerImage();
        img.dataset.visible = 'true';
    }

    function centerImage() {
        const img = imgRef.current;
        if (!panzoom) throw new Error('panzoom was not initialized');
        if (!img) throw new Error('img was not initialized');
        const clientRect = img.getBoundingClientRect();
        const cx = clientRect.left + clientRect.width / 2;
        const cy = clientRect.top + clientRect.height / 2;
        const container = img.parentElement!.getBoundingClientRect();
        const dx = container.left + container.width / 2 - cx;
        const dy = container.top + container.height / 2 - cy;
        panzoom.moveTo(dx, dy);
    }

    return (
        <div className="flex flex-col h-full w-full">
            <TopBar {...topBar} />
            <div
                className={cn(
                    'flex-1 w-full flex p-10 focus:outline-none',
                    'overflow-hidden',
                )}
            >
                <img
                    ref={imgRef}
                    className={cn(
                        'invisible',
                        'transition-opacity duration-100 opacity-0',
                        'data-[visible=true]:opacity-100',
                    )}
                    src={payload.src}
                    onLoad={e => onImageLoad(e.currentTarget)}
                    onClick={e => e.stopPropagation()}
                />
            </div>
        </div>
    );
}
