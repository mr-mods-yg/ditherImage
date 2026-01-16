// utils/ditherEngine.ts

export type DitherMethod = 'threshold' | 'random' | 'floyd' | 'atkinson' | 'bayer' | 'none';

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

  // Use a Float32Array to preserve precision during error diffusion (RGBA)
  const floatData = new Float32Array(pixels.length);

  // Pre-calculate contrast factor
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  // Initialize floatData with RGB + contrast
  for (let i = 0; i < pixels.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      let val = pixels[i + c];
      val = factor * (val - 128) + 128;
      floatData[i + c] = val;
    }
    floatData[i + 3] = pixels[i + 3]; // Preserve Alpha
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        const c_idx = idx + c;
        const oldVal = floatData[c_idx];
        let newVal = 0;

        if (method === 'threshold') {
          newVal = closestColor(oldVal);
          outputData[c_idx] = newVal;
        }

        else if (method === 'random') {
          const noise = (Math.random() - 0.5) * 60;
          newVal = closestColor(oldVal + noise);
          outputData[c_idx] = newVal;
        }

        else if (method === 'bayer') {
          const threshold = (bayerMap4x4[y % 4][x % 4] / 16) * 255;
          newVal = oldVal < threshold ? 0 : 255;
          outputData[c_idx] = newVal;
        }

        else if (method === 'none') {
          newVal = Math.max(0, Math.min(255, oldVal));
          outputData[c_idx] = newVal;
        }

        else if (method === 'floyd' || method === 'atkinson') {
          newVal = closestColor(oldVal);
          const quantError = oldVal - newVal;
          outputData[c_idx] = newVal;

          // Distribute Error for current channel
          const distribute = (dx: number, dy: number, weight: number) => {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const ni = (ny * width + nx) * 4 + c;
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
      // Set Alpha
      outputData[idx + 3] = pixels[idx + 3];
    }
  }

  return new ImageData(outputData, width, height);
};
