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
  const data = new Uint8ClampedArray(imageData.data); // Clone to avoid mutating original immediately

  // Pre-calculate contrast factor
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      // 1. Get basic grayscale & apply contrast
      let oldPixel = getLuminance(data[i], data[i + 1], data[i + 2]);
      oldPixel = factor * (oldPixel - 128) + 128; 

      if (method === 'threshold') {
        const newPixel = closestColor(oldPixel);
        data[i] = data[i + 1] = data[i + 2] = newPixel;
        data[i + 3] = 255; // Alpha
      } 
      
      else if (method === 'random') {
        const noise = (Math.random() - 0.5) * 60;
        const newPixel = closestColor(oldPixel + noise);
        data[i] = data[i + 1] = data[i + 2] = newPixel;
        data[i + 3] = 255;
      }

      else if (method === 'bayer') {
        const mapValue = bayerMap4x4[y % 4][x % 4];
        const normalized = (mapValue / 16) * 255;
        // If pixel is brighter than the map threshold, it's white
        const newPixel = (oldPixel + (normalized - 128)) < 128 ? 0 : 255;
        data[i] = data[i + 1] = data[i + 2] = newPixel;
        data[i + 3] = 255;
      }

      else if (method === 'floyd' || method === 'atkinson') {
        // Error Diffusion Algorithms
        const newPixel = closestColor(oldPixel);
        const quantError = oldPixel - newPixel;

        data[i] = data[i + 1] = data[i + 2] = newPixel;
        data[i + 3] = 255;

        // Distribute Error
        const distribute = (dx: number, dy: number, weight: number) => {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const ni = (ny * width + nx) * 4;
            const existing = getLuminance(data[ni], data[ni + 1], data[ni + 2]);
            const adjusted = existing + quantError * weight;
            // We only update the R channel temporarily to store luminance for next pass
            // In a robust app, you'd use a separate float32 buffer for error accumulation
            data[ni] = data[ni + 1] = data[ni + 2] = adjusted; 
          }
        };

        if (method === 'floyd') {
          distribute(1, 0, 7 / 16);
          distribute(-1, 1, 3 / 16);
          distribute(0, 1, 5 / 16);
          distribute(1, 1, 1 / 16);
        } else if (method === 'atkinson') {
          distribute(1, 0, 1/8);
          distribute(2, 0, 1/8);
          distribute(-1, 1, 1/8);
          distribute(0, 1, 1/8);
          distribute(1, 1, 1/8);
          distribute(0, 2, 1/8);
        }
      }
    }
  }

  return new ImageData(data, width, height);
};