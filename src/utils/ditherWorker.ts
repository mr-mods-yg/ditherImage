// Web Worker for dithering computation
import { processImage, DitherMethod } from './ditherEngine';

self.onmessage = (e: MessageEvent) => {
    const { imageData, method, contrast } = e.data;

    try {
        const processedData = processImage(imageData, method, contrast);
        self.postMessage({ success: true, imageData: processedData });
    } catch (error) {
        self.postMessage({ success: false, error: String(error) });
    }
};

export { };
