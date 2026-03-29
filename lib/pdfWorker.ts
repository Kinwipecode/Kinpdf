// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Use the locally-served worker file (copied from node_modules to public/)
// This avoids CDN availability issues and version mismatches.
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export default pdfjsLib;
