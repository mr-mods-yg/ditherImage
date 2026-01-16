// utils/ditherEngine.ts

export type DitherMethod = 'threshold' | 'random' | 'floyd' | 'atkinson' | 'bayer';

// Helper: Convert RGB to Luminance
const getLuminance = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

// Helper: Find closest palette color (Black or White for 1-bit)
const closestColor = (val: number) => (val < 128 ? 0 : 255);

const bayerMap4x4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
];

export const processImage = (
  imageData: ImageData,
  method: DitherMethod,
  contrast: number = 0
): ImageData => {
  const width = imageData.width;
  const height = imageData.height;
  const pixels = imageData.data;
  const outputData = new Uint8ClampedArray(pixels.length);

  // Use a Float32Array to preserve precision during error diffusion
  const floatData = new Float32Array(width * height);

  // Pre-calculate contrast factor
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  // Initialize floatData with luminance + contrast
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    let lum = getLuminance(pixels[idx], pixels[idx + 1], pixels[idx + 2]);
    lum = factor * (lum - 128) + 128;
    floatData[i] = lum;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const idx = i * 4;
      const oldPixel = floatData[i];

      if (method === 'threshold') {
        const newPixel = closestColor(oldPixel);
        outputData[idx] = outputData[idx + 1] = outputData[idx + 2] = newPixel;
        outputData[idx + 3] = 255;
      }

      else if (method === 'random') {
        const noise = (Math.random() - 0.5) * 60;
        const newPixel = closestColor(oldPixel + noise);
        outputData[idx] = outputData[idx + 1] = outputData[idx + 2] = newPixel;
        outputData[idx + 3] = 255;
      }

      else if (method === 'bayer') {
        const threshold = (bayerMap4x4[y % 4][x % 4] / 16) * 255;
        const newPixel = oldPixel < threshold ? 0 : 255;
        outputData[idx] = outputData[idx + 1] = outputData[idx + 2] = newPixel;
        outputData[idx + 3] = 255;
      }

      else if (method === 'floyd' || method === 'atkinson') {
        const newPixel = closestColor(oldPixel);
        const quantError = oldPixel - newPixel;

        outputData[idx] = outputData[idx + 1] = outputData[idx + 2] = newPixel;
        outputData[idx + 3] = 255;

        // Distribute Error
        const distribute = (dx: number, dy: number, weight: number) => {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const ni = ny * width + nx;
            floatData[ni] += quantError * weight;
          }
        };

        if (method === 'floyd') {
          distribute(1, 0, 7 / 16);
          distribute(-1, 1, 3 / 16);
          distribute(0, 1, 5 / 16);
          distribute(1, 1, 1 / 16);
        } else if (method === 'atkinson') {
          distribute(1, 0, 1 / 8);
          distribute(2, 0, 1 / 8);
          distribute(-1, 1, 1 / 8);
          distribute(0, 1, 1 / 8);
          distribute(1, 1, 1 / 8);
          distribute(0, 2, 1 / 8);
        }
      }
    }
  }

  return new ImageData(outputData, width, height);
};
