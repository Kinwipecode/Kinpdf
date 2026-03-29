# PDF Editor Pro

A modern, high-performance web-based PDF editor for viewing, annotating, and measuring documents with built-in OCR and page management.

![Aesthetics](https://img.shields.io/badge/Aesthetics-Premium-blueviolet)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🎨 Key Features

- **Document Management**: Multi-tab interface for handling multiple PDF documents.
- **Page Management (NEU)**: 
  - Delete pages (Single & Ranges).
  - Move pages up/down or move whole ranges (e.g., move pages 2-5 to position 10).
  - Insert blank pages anywhere.
- **Rich Annotation Tools**:
  - Highlighting, Freehand, Rectangles, Circles, Lines, Arrows.
  - Textboxes & Callouts with adjustable font size.
- **Advanced Measuring & Precision**:
  - Distance & Area measurement with custom units and scale calibration.
  - **Magnifier (L-Taste)**: Toggleable lupe for pixel-perfect targeting during measurements.
- **Smart OCR (Texterkennung)**: Automated text recognition for scanned documents.
- **PDF Export**: Save your modified document as a new PDF including all annotations and new page structure.
- **Full History**: Undo/Redo support for all actions.

## 🚀 Technical Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **PDF Core**: [PDF.js](https://mozilla.github.io/pdf.js/) & [pdf-lib](https://pdf-lib.js.org/)
- **OCR**: [Tesseract.js](https://tesseract.projectnaptha.com/)
- **State**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: Vanilla CSS & React Icons

---

## 🛠️ Installation

1. Clone or download this folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development mode:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## 📦 Build for Production

```bash
npm run build
npm start
```

---

## ❤️ Credits

Developed with focus on rich aesthetics and professional engineering workflows.
