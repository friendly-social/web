import {AdjusterCrop} from '@/components/adjuster';
import {resizeGif} from '@/network/gif';

interface ResizeStaticParams {
    file: File;
    crop: AdjusterCrop;
    maxSizeBytes: number;
    maxIterations?: number;
    scalePrecisionFactor?: number;
}

export async function resizeImage(
    file: File,
    crop: AdjusterCrop,
): Promise<File> {
    if (file.type === 'image/gif') {
        return resizeGif({
            file,
            crop,
            maxSizeBytes: 500_000,
        });
    }

    return resizeStatic({
        file,
        crop,
        maxSizeBytes: 200_000,
    });
}

async function resizeStatic({
    file,
    crop,
    maxSizeBytes,
    maxIterations = 8,
    scalePrecisionFactor = 0.01,
}: ResizeStaticParams): Promise<File> {
    const src = URL.createObjectURL(file);

    const image: HTMLImageElement = await new Promise((resolve, reject) => {
        const result = new Image();
        result.onload = () => resolve(result);
        result.onerror = reject;
        result.src = src;
    });

    try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        const originalWidth = image.naturalWidth;
        const originalHeight = image.naturalHeight;

        if (!context) {
            return file;
        }

        const format = file.type;
        if (!format) {
            return file;
        }

        let low = 0;
        let high = 1;
        let bestBlob = await render(
            canvas,
            image,
            1,
            crop,
            originalWidth,
            originalHeight,
            format,
        );

        if (bestBlob.size > maxSizeBytes) {
            for (let i = 0; i < maxIterations; i++) {
                const mid = (low + high) / 2;
                let blob: Blob;
                try {
                    blob = await render(
                        canvas,
                        image,
                        mid,
                        crop,
                        originalWidth,
                        originalHeight,
                        format,
                    );
                } catch {
                    // Worst case: no compression applied
                    return file;
                }
                const needsMoreShrinking = blob.size > maxSizeBytes;
                if (needsMoreShrinking) {
                    high = mid;
                } else {
                    low = mid;
                    bestBlob = blob;
                }
                const precision = high - low;
                if (precision < scalePrecisionFactor) {
                    break;
                }
            }
        }

        return new File([bestBlob], file.name, {
            type: file.type,
            lastModified: file.lastModified,
        });
    } finally {
        URL.revokeObjectURL(src);
    }
}

async function render(
    canvas: HTMLCanvasElement,
    image: HTMLImageElement,
    scale: number,
    crop: AdjusterCrop,
    originalWidth: number,
    originalHeight: number,
    format: string,
): Promise<Blob> {
    const context = canvas.getContext('2d');
    if (!context) throw Error('Canvas context is null or undefined!');

    const sx = (originalWidth * crop.x) / 100;
    const sy = (originalHeight * crop.y) / 100;
    const sw = (originalWidth * crop.width) / 100;
    const sh = (originalHeight * crop.height) / 100;

    const dw = Math.max(1, Math.round(sw * scale));
    const dh = Math.max(1, Math.round(sh * scale));

    canvas.width = dw;
    canvas.height = dh;

    // Fill black to prevent transparent
    context.fillStyle = 'black';
    context.fillRect(0, 0, dw, dh);

    context.drawImage(image, sx, sy, sw, sh, 0, 0, dw, dh);
    await letUIThreadBreathe();

    return await new Promise((resolve, reject) =>
        canvas.toBlob(blob => {
            if (!blob) {
                reject(new Error('Canvas toBlob returned !blob'));
            } else {
                resolve(blob);
            }
        }, format),
    );
}

async function letUIThreadBreathe() {
    await new Promise(resolve => setTimeout(resolve, 10));
}
