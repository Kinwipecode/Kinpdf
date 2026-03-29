# PDF Editor Pro

A modern, high-performance web-based PDF editor for viewing, annotating, and measuring documents with built-in OCR capabilities.

![Aesthetics](https://img.shields.io/badge/Aesthetics-Premium-blueviolet)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🎨 Key Features

- **Document Management**: Multi-tab interface for handling multiple PDF documents simultaneously.
- **Rich Annotation Tools**:
  - Highlighting (Text Selection).
  - Freehand drawing with custom colors.
  - Shape creation (Rectangles, Circles, Lines, Arrows, Double-Arrows).
  - Textboxes & Callouts for detailed notes.
- **Advanced Measuring**:
  - Distance measurement with support for multiple units (px, m, mm, cm, etc.).
  - Area calculation for polygon shapes.
  - Scale calibration using a reference distance.
- **Smart OCR (Texterkennung)**: Automated text recognition for scanned documents with real-time editing.
- **Full History**: Undo/Redo support for all annotation actions.
- **Intuitive UI**: Premium dark-mode interface with an Office-style ribbon toolbar and thumbnail navigation.

## 🚀 Technical Stack

- **Core**: [Next.js 15](https://nextjs.org/) (App Router)
- **PDF Engine**: [PDF.js](https://mozilla.github.io/pdf.js/)
- **OCR Engine**: [Tesseract.js](https://tesseract.projectnaptha.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: Tailwind CSS & Lucide/React Icons
- **Image Processing**: [Sharp](https://sharp.pixelplumbing.com/)

---

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Project is optimized for latest LTS)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pdf-editor-pro.git
   ```
2. Navigate to the project directory:
   ```bash
   cd pdf-editor-pro
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Build for Production

```bash
npm run build
npm start
```

---

## ❤️ Credits

Developed with focus on rich aesthetics and top-tier user experience.
