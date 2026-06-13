import {AdjusterCrop} from '@/components/adjuster';
import {GifReader, GifWriter} from 'omggif';

export interface CompressGifProps {
    file: File;
    maxSizeBytes: number;
    maxWidth: number;
    maxHeight: number;
    fps: number;
}

export interface CropGifProps {
    file: File;
    cropX: number;
    cropY: number;
    cropW: number;
    cropH: number;
}

interface FrameInfo {
    data: Uint8Array;
    delay: number;
    disposal: number;
    width: number;
    height: number;
    left: number;
    top: number;
}

interface ResizeGifParams {
    file: File;
    crop: AdjusterCrop;
    maxSizeBytes: number;
}

export async function resizeGif({
    file,
    crop,
    maxSizeBytes,
}: ResizeGifParams): Promise<File> {
    const cropped = await cropGif({
        file,
        cropX: crop.x,
        cropY: crop.y,
        cropW: crop.width,
        cropH: crop.height,
    });

    const compressed = await compressGif({
        file: cropped,
        maxSizeBytes,
        maxWidth: crop.width,
        maxHeight: crop.height,
        fps: 12,
    });

    return compressed;
}

async function compressGif({
    file,
    maxSizeBytes,
    maxWidth,
    maxHeight,
    fps,
}: CompressGifProps): Promise<File> {
    const t0 = performance.now();
    const arrayBuf = await file.arrayBuffer();
    const reader = new GifReader(new Uint8Array(arrayBuf));

    const srcWidth = reader.width;
    const srcHeight = reader.height;
    const numFrames = reader.numFrames();

    console.log(
        `gif: compress start ${file.name} (${file.size}B, ${srcWidth}x${srcHeight}, ${numFrames}f, target ${maxSizeBytes}B @ ${fps}fps)`,
    );

    const scale = Math.min(maxWidth / srcWidth, maxHeight / srcHeight, 1);
    let newWidth = Math.max(1, Math.round(srcWidth * scale));
    let newHeight = Math.max(1, Math.round(srcHeight * scale));

    const frames = await extractFrames(
        reader,
        numFrames,
        srcWidth,
        srcHeight,
        fps,
    );
    console.log(
        `gif: extracted ${frames.length} frames in ${(performance.now() - t0).toFixed(0)}ms`,
    );

    let bestBytes: Uint8Array | null = null;
    let attempt = 0;

    while (newWidth > 4 && newHeight > 4) {
        attempt++;
        console.log(
            `gif: attempt ${attempt} → resize to ${newWidth}x${newHeight}`,
        );
        const resized = await resizeFrames(frames, newWidth, newHeight);
        const bytes = await encodeGif(resized, newWidth, newHeight);
        console.log(
            `gif: attempt ${attempt} → encoded ${bytes.length}B (limit ${maxSizeBytes}B)`,
        );
        if (bytes.length <= maxSizeBytes) {
            console.log(
                `gif: done in ${(performance.now() - t0).toFixed(0)}ms → ${bytes.length}B`,
            );
            return new File([new Blob([bytes as BlobPart])], file.name, {
                type: 'image/gif',
                lastModified: file.lastModified,
            });
        }
        bestBytes = bytes;
        newWidth = Math.max(1, Math.round(newWidth * 0.75));
        newHeight = Math.max(1, Math.round(newHeight * 0.75));
        await letUIThreadBreathe();
    }

    console.log(
        `gif: done (best effort) in ${(performance.now() - t0).toFixed(0)}ms → ${bestBytes!.length}B`,
    );
    return new File([new Blob([bestBytes! as BlobPart])], file.name, {
        type: 'image/gif',
        lastModified: file.lastModified,
    });
}

async function cropGif({
    file,
    cropX,
    cropY,
    cropW,
    cropH,
}: CropGifProps): Promise<File> {
    const t0 = performance.now();
    const arrayBuf = await file.arrayBuffer();
    const reader = new GifReader(new Uint8Array(arrayBuf));

    const srcWidth = reader.width;
    const srcHeight = reader.height;
    const numFrames = reader.numFrames();

    console.log(
        `gif: crop start ${file.name} (${srcWidth}x${srcHeight}, ${numFrames}f)`,
    );

    const newWidth = Math.max(1, Math.round((srcWidth * cropW) / 100));
    const newHeight = Math.max(1, Math.round((srcHeight * cropH) / 100));
    const offsetX = Math.round((-srcWidth * cropX) / 100);
    const offsetY = Math.round((-srcHeight * cropY) / 100);

    const frames = await extractFrames(reader, numFrames, srcWidth, srcHeight);
    console.log(
        `gif: extracted ${frames.length} frames in ${(performance.now() - t0).toFixed(0)}ms`,
    );

    const srcCanvas = document.createElement('canvas');
    const srcCtx = srcCanvas.getContext('2d')!;
    const dstCanvas = document.createElement('canvas');
    dstCanvas.width = newWidth;
    dstCanvas.height = newHeight;
    const dstCtx = dstCanvas.getContext('2d')!;

    const cropped: FrameInfo[] = [];
    for (let fi = 0; fi < frames.length; fi++) {
        const frame = frames[fi];
        srcCanvas.width = frame.width;
        srcCanvas.height = frame.height;
        const imageData = srcCtx.createImageData(frame.width, frame.height);
        imageData.data.set(frame.data);
        srcCtx.putImageData(imageData, 0, 0);

        dstCtx.clearRect(0, 0, newWidth, newHeight);
        dstCtx.drawImage(srcCanvas, offsetX, offsetY);

        const outData = dstCtx.getImageData(0, 0, newWidth, newHeight);
        cropped.push({
            data: new Uint8Array(outData.data),
            delay: frame.delay,
            disposal: 0,
            width: newWidth,
            height: newHeight,
            left: 0,
            top: 0,
        });
        if ((fi + 1) % 5 === 0) await letUIThreadBreathe();
    }

    const bytes = await encodeGif(cropped, newWidth, newHeight);
    console.log(
        `gif: crop done in ${(performance.now() - t0).toFixed(0)}ms → ${bytes.length}B`,
    );
    return new File([new Blob([bytes as BlobPart])], file.name, {
        type: 'image/gif',
        lastModified: file.lastModified,
    });
}

async function extractFrames(
    reader: GifReader,
    numFrames: number,
    width: number,
    height: number,
    targetFps?: number,
): Promise<FrameInfo[]> {
    const minDelay = targetFps ? Math.round(100 / targetFps) : 0;
    const canvas = new Uint8Array(width * height * 4);
    const frames: FrameInfo[] = [];
    let pending: FrameInfo | null = null;

    for (let i = 0; i < numFrames; i++) {
        const info = reader.frameInfo(i);

        let prev: Uint8Array | null = null;
        if (info.disposal === 3) {
            prev = new Uint8Array(canvas);
        }

        reader.decodeAndBlitFrameRGBA(i, canvas);
        const frameData = new Uint8Array(canvas);

        const current: FrameInfo = {
            data: frameData,
            delay: Math.max(1, info.delay),
            disposal: 0,
            width,
            height,
            left: 0,
            top: 0,
        };

        if (info.disposal === 2) {
            clearRect(canvas, info.x, info.y, info.width, info.height, width);
        } else if (info.disposal === 3 && prev) {
            canvas.set(prev);
        }

        if (targetFps) {
            if (pending === null) {
                pending = current;
            } else {
                pending.delay += current.delay;
                pending.data = current.data;
            }
            if (pending.delay >= minDelay) {
                frames.push(pending);
                pending = null;
            }
        } else {
            frames.push(current);
        }

        if ((i + 1) % 5 === 0) await letUIThreadBreathe();
    }

    if (targetFps && pending !== null) {
        if (frames.length > 0) {
            frames[frames.length - 1].delay += pending.delay;
        } else {
            frames.push(pending);
        }
    }

    return frames;
}

function clearRect(
    buf: Uint8Array,
    x: number,
    y: number,
    w: number,
    h: number,
    stride: number,
) {
    for (let row = 0; row < h; row++) {
        const start = ((y + row) * stride + x) * 4;
        buf.fill(0, start, start + w * 4);
    }
}

async function resizeFrames(
    frames: FrameInfo[],
    newWidth: number,
    newHeight: number,
): Promise<FrameInfo[]> {
    const srcCanvas = document.createElement('canvas');
    const srcCtx = srcCanvas.getContext('2d')!;
    const dstCanvas = document.createElement('canvas');
    dstCanvas.width = newWidth;
    dstCanvas.height = newHeight;
    const dstCtx = dstCanvas.getContext('2d')!;

    const result: FrameInfo[] = [];
    for (let fi = 0; fi < frames.length; fi++) {
        const frame = frames[fi];
        srcCanvas.width = frame.width;
        srcCanvas.height = frame.height;
        const imageData = srcCtx.createImageData(frame.width, frame.height);
        imageData.data.set(frame.data);
        srcCtx.putImageData(imageData, 0, 0);

        dstCtx.clearRect(0, 0, newWidth, newHeight);
        dstCtx.drawImage(srcCanvas, 0, 0, newWidth, newHeight);

        const outData = dstCtx.getImageData(0, 0, newWidth, newHeight);
        result.push({
            ...frame,
            data: new Uint8Array(outData.data),
            width: newWidth,
            height: newHeight,
            left: 0,
            top: 0,
        });
        if ((fi + 1) % 5 === 0) await letUIThreadBreathe();
    }

    return result;
}

async function buildPalette(frames: FrameInfo[]): Promise<{
    palette: number[];
    transparentIdx: number;
}> {
    const colorMap = new Map<number, number>();
    let hasAlpha = false;

    for (let fi = 0; fi < frames.length; fi++) {
        const data = frames[fi].data;
        for (let i = 3; i < data.length; i += 16) {
            const a = data[i];
            if (a < 128) {
                hasAlpha = true;
                continue;
            }
            const r = data[i - 3];
            const g = data[i - 2];
            const b = data[i - 1];
            const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
            colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }
        if ((fi + 1) % 5 === 0) await letUIThreadBreathe();
    }

    if (colorMap.size === 0) {
        return {palette: [0x000000], transparentIdx: 0};
    }

    const sorted = [...colorMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, hasAlpha ? 255 : 256);

    const palette: number[] = sorted.map(([key]) => {
        const r = (((key >> 10) & 0x1f) << 3) | 4;
        const g = (((key >> 5) & 0x1f) << 3) | 4;
        const b = ((key & 0x1f) << 3) | 4;
        return (r << 16) | (g << 8) | b;
    });

    const transparentIdx = hasAlpha ? palette.length : -1;
    return {palette, transparentIdx};
}

function buildColorLut(palette: number[]): Uint8Array {
    const lut = new Uint8Array(32768);
    for (let r5 = 0; r5 < 32; r5++) {
        const r = (r5 << 3) | 4;
        for (let g5 = 0; g5 < 32; g5++) {
            const g = (g5 << 3) | 4;
            const base = (r5 << 10) | (g5 << 5);
            for (let b5 = 0; b5 < 32; b5++) {
                const b = (b5 << 3) | 4;
                lut[base | b5] = nearestColor(r, g, b, palette);
            }
        }
    }
    return lut;
}

function nearestColor(
    r: number,
    g: number,
    b: number,
    palette: number[],
): number {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < palette.length; i++) {
        const pr = (palette[i] >> 16) & 0xff;
        const pg = (palette[i] >> 8) & 0xff;
        const pb = palette[i] & 0xff;
        const dr = r - pr;
        const dg = g - pg;
        const db = b - pb;
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) {
            bestDist = dist;
            best = i;
        }
    }
    return best;
}

async function encodeGif(
    frames: FrameInfo[],
    width: number,
    height: number,
): Promise<Uint8Array> {
    const {palette, transparentIdx} = await buildPalette(frames);
    const lut = buildColorLut(palette);

    let paletteSize = 2;
    while (paletteSize < palette.length) paletteSize <<= 1;
    const gctPalette = [...palette];
    while (gctPalette.length < paletteSize) {
        gctPalette.push(0x000000);
    }

    const bufSize = Math.max(1024, width * height * frames.length + 1024);
    const buf = new Uint8Array(bufSize);
    const writer = new GifWriter(buf, width, height, {
        loop: 0,
        palette: gctPalette,
    });

    for (let fi = 0; fi < frames.length; fi++) {
        const frame = frames[fi];
        const numPixels = frame.width * frame.height;
        const indexed = new Uint8Array(numPixels);
        const data = frame.data;

        if (transparentIdx >= 0) {
            for (let i = 0; i < numPixels; i++) {
                const pi = i * 4;
                if (data[pi + 3] < 128) {
                    indexed[i] = transparentIdx;
                } else {
                    indexed[i] =
                        lut[
                            ((data[pi] >> 3) << 10) |
                                ((data[pi + 1] >> 3) << 5) |
                                (data[pi + 2] >> 3)
                        ];
                }
            }
        } else {
            for (let i = 0; i < numPixels; i++) {
                const pi = i * 4;
                indexed[i] =
                    lut[
                        ((data[pi] >> 3) << 10) |
                            ((data[pi + 1] >> 3) << 5) |
                            (data[pi + 2] >> 3)
                    ];
            }
        }

        writer.addFrame(
            frame.left,
            frame.top,
            frame.width,
            frame.height,
            indexed as unknown as number[],
            {
                delay: frame.delay,
                disposal: frame.disposal,
                transparent: transparentIdx >= 0 ? transparentIdx : undefined,
            },
        );
        if ((fi + 1) % 5 === 0) await letUIThreadBreathe();
    }

    writer.end();
    return buf.slice(0, writer.end());
}

async function letUIThreadBreathe() {
    await new Promise(resolve => setTimeout(resolve, 10));
}
