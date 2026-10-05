import * as Dialog from '@radix-ui/react-dialog';
import 'react-image-crop/dist/ReactCrop.css';
import ReactCrop, {PercentCrop} from 'react-image-crop';
import {X} from 'lucide-react';
import {ReactNode, useState, useMemo, useEffect} from 'react';
import {useTranslations} from 'use-intl';
import {Button} from '@/components/ui/button';
import {StyledDialogWrapper} from './styled-dialog-wrapper';

export type AdjusterPayload =
    | {
          type: 'close';
      }
    | {
          type: 'open';
          data: File;
      };

export interface AdjusterCrop {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface InitialCropParams {
    width: number;
    height: number;
}

export interface AdjusterProps {
    payload: AdjusterPayload;
    setPayload: (value: AdjusterPayload) => void;
    aspect?: number;
    title: string;
    onAdjusted: (file: File, result: AdjusterCrop) => void;
    initialCrop?: (params: InitialCropParams) => PercentCrop;
}

export function Adjuster({
    payload,
    setPayload,
    aspect,
    title,
    onAdjusted,
    initialCrop,
}: AdjusterProps): ReactNode {
    const open = useMemo(() => payload.type === 'open', [payload]);

    return (
        <StyledDialogWrapper
            open={open}
            onOpenChange={() => setPayload({type: 'close'})}
            maxContent
        >
            {payload.type === 'open' && (
                <AdjusterContent
                    title={title}
                    payload={payload}
                    setPayload={setPayload}
                    aspect={aspect}
                    onAdjusted={onAdjusted}
                    initialCrop={initialCrop}
                />
            )}
        </StyledDialogWrapper>
    );
}

interface AdjusterContentProps {
    payload: AdjusterPayload & {type: 'open'};
    setPayload: (value: AdjusterPayload) => void;
    aspect?: number;
    title: string;
    onAdjusted: (file: File, result: AdjusterCrop) => void;
    initialCrop?: (params: InitialCropParams) => PercentCrop;
}

function AdjusterContent({
    payload,
    setPayload,
    aspect,
    title,
    onAdjusted,
    initialCrop,
}: AdjusterContentProps): ReactNode {
    const t = useTranslations('adjuster');
    const [crop, setCrop] = useState<PercentCrop>();
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        const src = URL.createObjectURL(payload.data);
        setSrc(src);
    }, [payload.data]);

    useEffect(() => {
        if (!src) return;
        return () => URL.revokeObjectURL(src);
    }, [src]);

    function onCancel() {
        setPayload({type: 'close'});
    }

    async function onContinue() {
        setPayload({type: 'close'});

        const cropOrFallback = {
            x: crop?.x ?? 0,
            y: crop?.y ?? 0,
            width: crop?.width ?? 100,
            height: crop?.height ?? 100,
        };

        onAdjusted(payload.data, {
            x: Math.round(cropOrFallback.x),
            y: Math.round(cropOrFallback.y),
            width: Math.round(cropOrFallback.width),
            height: Math.round(cropOrFallback.height),
        });
    }

    interface UpscaleIfSmallResult {
        height: number;
        width: number;
    }

    function upscaleIfSmall(
        event: React.UIEvent<HTMLImageElement>,
    ): UpscaleIfSmallResult {
        const {naturalWidth: width, naturalHeight: height} =
            event.currentTarget;
        if (width >= 200 || height >= 200) return {width, height};
        const ratio = width / height;
        let upscaledWidth, upscaledHeight;
        if (width < height) {
            upscaledWidth = 200;
            upscaledHeight = upscaledWidth / ratio;
        } else {
            upscaledHeight = 200;
            upscaledWidth = upscaledHeight * ratio;
        }
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas is not supported');
        canvas.width = upscaledWidth;
        canvas.height = upscaledHeight;
        context.drawImage(
            event.currentTarget,
            0,
            0,
            upscaledWidth,
            upscaledHeight,
        );
        canvas.toBlob(blob => {
            if (!blob) return;
            const src = URL.createObjectURL(blob);
            setSrc(src);
        });
        // return old values, then toBlob substituted image url and this re-runs
        return {width, height};
    }

    function onImageLoad(event: React.UIEvent<HTMLImageElement>) {
        const {width, height} = upscaleIfSmall(event);
        if (initialCrop) {
            setCrop(initialCrop({width, height}));
        }
    }

    return (
        <>
            <div className="relative flex items-center mt-1 mx-1">
                <Dialog.Title className="w-full text-base font-semibold text-center pt-2">
                    {title}
                </Dialog.Title>

                <Dialog.Close className="absolute right-0 top-0" asChild>
                    <Button variant="ghost" className="cursor-pointer">
                        <X />
                    </Button>
                </Dialog.Close>
            </div>

            <div className="flex items-center justify-center m-4">
                {src && (
                    <ReactCrop
                        className="max-h-[70vh]"
                        crop={crop}
                        aspect={aspect}
                        onChange={(_, crop) => setCrop(crop)}
                    >
                        <img src={src} onLoad={onImageLoad} alt={'Image'} />
                    </ReactCrop>
                )}
            </div>

            <div className="flex px-4 pb-4 space-x-4">
                <Button
                    variant="outline"
                    className="flex-grow cursor-pointer"
                    onClick={onCancel}
                >
                    {t('cancel')}
                </Button>
                <Button
                    className="flex-grow cursor-pointer"
                    onClick={() => void onContinue()}
                >
                    {t('continue')}
                </Button>
            </div>
        </>
    );
}
