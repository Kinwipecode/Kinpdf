// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Use the locally-served worker file (copied from node_modules to public/)
// This avoids CDN availability issues and version mismatches.
if (typeof window !== 'undefined') {
  // Try env var first, then fallback to detecting if we are on GitHub Pages
  const envBase = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const isGH = window.location.hostname.includes('github.io') && window.location.pathname.startsWith('/Kinpdf');
  const basePath = envBase || (isGH ? '/Kinpdf' : '');
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${basePath}/pdf.worker.min.mjs`;
}

export default pdfjsLib;
