<p align="center">
  <img src="./public/favicon.ico" alt="ditherImage" width="80" />
</p>

<h1 align="center">ditherImage 🎨</h1>

<p align="center">
  <strong>A browser-based image dithering tool</strong><br />
  Transform your images into stunning pixel art with classic dithering algorithms.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=flat-square&logo=tailwindcss" alt="TailwindCSS 4" />
</p>

---

## ✨ Features

- **6 Dithering Algorithms** — Choose from Floyd-Steinberg, Atkinson, Bayer, Threshold, Random, or None
- **Live Preview** — See changes instantly as you tweak settings
- **Contrast Control** — Adjust contrast before dithering
- **Web Worker Powered** — Heavy processing runs off the main thread for a smooth UI
- **Export** — Download your dithered masterpiece
- **Modern Stack** — Built with Next.js 16, React 19, TypeScript, and TailwindCSS 4

## 🧩 Dithering Algorithms

| Algorithm | Type | Description |
|-----------|------|-------------|
| **Floyd-Steinberg** | Error Diffusion | Classic algorithm, distributes quantization error to neighboring pixels |
| **Atkinson** | Error Diffusion | Apple Macintosh style, spreads error to 6 neighbors — preserves more detail |
| **Bayer (4x4)** | Ordered Dithering | Matrix-based pattern dithering, great for that retro computer look |
| **Threshold** | Simple | Pure black & white based on a 128 threshold |
| **Random** | Noise-based | Threshold with added random noise for a gritty texture |
| **None** | Grayscale | Just contrast + grayscale conversion, no dithering |

## 🚀 Getting Started

```bash
git clone https://github.com/mr-mods-yg/ditherImage.git
cd ditherImage
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Build

```bash
npm run build
npm start
```

## 🏗️ Project Structure

```
ditherImage/
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/
│   │   └── DitherStudio.tsx   # Main UI component
│   └── utils/
│       ├── ditherEngine.ts    # Core dithering algorithms
│       └── ditherWorker.ts    # Web Worker for async processing
├── public/            # Static assets
├── next.config.ts     # Next.js configuration
└── tsconfig.json      # TypeScript configuration
```

## 🧠 How It Works

1. **Upload** an image
2. **Select** a dithering algorithm
3. **Adjust** contrast to fine-tune the result
4. **Download** your dithered image

The processing runs in a **Web Worker**, so the UI stays responsive even with large images.

## 🛠️ Tech Stack

- **[Next.js 16](https://nextjs.org/)** — React framework
- **[React 19](https://react.dev/)** — UI library
- **[TypeScript](https://www.typescriptlang.org/)** — Type safety
- **[TailwindCSS 4](https://tailwindcss.com/)** — Styling
- **[lucide-react](https://lucide.dev/)** — Icons
- **Web Workers** — Background processing

## 🤝 Contributing

Contributions are welcome! Open an issue or submit a PR.

## 📄 License

[MIT](./LICENSE)

---

<p align="center">Built with ❤️ by <a href="https://github.com/mr-mods-yg">Yash Garg</a></p>