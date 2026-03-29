'use client';
import { useState, useEffect } from 'react';
import { MdDocumentScanner } from 'react-icons/md';
import type { ToolType } from '@/types';

interface OCRButtonProps {
  docId: string;
  currentPage: number;
  onOCRComplete: (annotations: { text: string; x: number; y: number; width: number; height: number; fontSize?: number }[]) => void;
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
}

export function OCRButton({ docId, currentPage, onOCRComplete, activeTool, setActiveTool }: OCRButtonProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedArea, setSelectedArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleOCRClick = () => {
    console.log('🔴 OCR Selection Mode aktiviert!');
    setActiveTool('ocr-select');
  };

  const handleOCRScan = async (area: { x: number; y: number; width: number; height: number }) => {
    console.log('🔴 Starte OCR für markierten Bereich:', area);
    setIsScanning(true);
    setProgress(0);

    try {
      console.log('📦 Lade Tesseract.js...');
      const Tesseract = await import('tesseract.js');
      console.log('✅ Tesseract.js geladen');

      const pdfCanvas = document.querySelector(`#page-${currentPage} canvas`) as HTMLCanvasElement;
      if (!pdfCanvas) {
        console.error('❌ PDF-Seite nicht gefunden');
        setIsScanning(false);
        return;
      }

      // Bestimme den Skalierungsfaktor des Original-Canvas (DPR)
      const rect = pdfCanvas.getBoundingClientRect();
      const canvasDpr = pdfCanvas.width / rect.width;

      // Berücksichtige den DPI-Scale für bessere Erkennung (OCR-Zielauflösung)
      const ocrDpr = 3.0;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = area.width * ocrDpr;
      tempCanvas.height = area.height * ocrDpr;
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        // 1. Hintergrund weiß füllen (Tesseract mag kein Transparent/Schwarz)
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // 2. Skalierung für das Zeichnen setzen
        tempCtx.scale(ocrDpr, ocrDpr);

        // 3. Kopiere den Bereich mit korrekter Quell-Skalierung
        // Wir nehmen den Ausschnitt aus dem hochauflösenden PDF-Canvas
        tempCtx.drawImage(
          pdfCanvas,
          area.x * canvasDpr, area.y * canvasDpr,
          area.width * canvasDpr, area.height * canvasDpr,
          0, 0, area.width, area.height
        );
      }

      console.log(`✂️ OCR-Ausschnitt: ${area.width}x${area.height} (DPR: ${canvasDpr.toFixed(2)})`);

      // OCR durchführen
      const result = await Tesseract.recognize(
        tempCanvas,
        'deu+eng',
        {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          }
        }
      );

      const data = result.data as any;
      const lines = data.lines || [];

      // Maximale Sensibilität für Abstände
      let reconstructedText = "";
      let lastLineBottom = -1;

      lines.forEach((line: any) => {
        const lineText = line.text.replace(/\s+$/g, ""); // Nur am Ende trimmen
        if (!lineText.trim()) return;

        const currentLineTop = line.bbox.y0 / ocrDpr;
        const currentLineHeight = (line.bbox.y1 - line.bbox.y0) / ocrDpr;

        if (lastLineBottom !== -1) {
          const gap = currentLineTop - lastLineBottom;
          // Ab 20% Zeilenhöhe wird ein Abstand als Absatz gewertet
          if (gap > currentLineHeight * 0.20) {
            // Berechne Leerzeilen - Faktor 0.9 ist aggressiver
            const numNewLines = Math.max(1, Math.round(gap / (currentLineHeight * 0.9)));
            for (let i = 0; i < numNewLines; i++) {
              reconstructedText += "\n";
            }
          }
        }

        reconstructedText += lineText + "\n";
        lastLineBottom = line.bbox.y1 / ocrDpr;
      });

      const finalAreaText = reconstructedText.trim();

      if (finalAreaText.length === 0) {
        console.warn('⚠️ Tesseract hat keinen Text erkannt. Fallback auf data.text...');
        const fallback = (data.text || "").trim();
        if (!fallback) throw new Error("Kein Text erkannt");
        processResult(fallback);
      } else {
        processResult(finalAreaText);
      }

      function processResult(text: string) {
        const annotations = [{
          text,
          x: area.x,
          y: area.y,
          width: area.width,
          height: Math.max(80, area.height),
          fontSize: 13
        }];
        onOCRComplete(annotations);
        setSelectedArea(null);
        setActiveTool('cursor');
      }

    } catch (error: any) {
      console.error('❌ OCR Fehler:', error);
      alert("OCR fehlgeschlagen: " + (error.message || "Unbekannter Fehler"));
    } finally {
      setIsScanning(false);
      setProgress(0);
    }
  };

  // Event Listener optimiert für OCR-Auswahl
  useEffect(() => {
    if (activeTool !== 'ocr-select') {
      setSelectedArea(null);
      return;
    }

    let isDrawing = false;
    let startX = 0;
    let startY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      const canvas = document.querySelector(`#page-${currentPage} canvas`);
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;

      isDrawing = true;
      setSelectedArea({ x: startX, y: startY, width: 0, height: 0 });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing) return;

      const canvas = document.querySelector(`#page-${currentPage} canvas`);
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      setSelectedArea({
        x: Math.min(startX, currentX),
        y: Math.min(startY, currentY),
        width: Math.abs(currentX - startX),
        height: Math.abs(currentY - startY)
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDrawing) return;
      isDrawing = false;

      const canvas = document.querySelector(`#page-${currentPage} canvas`);
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const finalX = e.clientX - rect.left;
      const finalY = e.clientY - rect.top;

      const width = Math.abs(finalX - startX);
      const height = Math.abs(finalY - startY);
      const x = Math.min(startX, finalX);
      const y = Math.min(startY, finalY);

      if (width > 5 && height > 5) {
        const area = { x, y, width, height };
        setSelectedArea(area);
        handleOCRScan(area);
      } else {
        setSelectedArea(null);
        setActiveTool('cursor');
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeTool, currentPage]);

  // Hole die Canvas-Position für das Auswahl-Rechteck
  const canvasRect = () => {
    const canvas = document.querySelector(`#page-${currentPage} canvas`);
    return canvas?.getBoundingClientRect();
  };

  return (
    <>
      <button
        className={`tool-btn ${activeTool === 'ocr-select' ? 'active' : ''}`}
        onClick={handleOCRClick}
        disabled={isScanning}
        title="Texterkennung (OCR) - Bereich markieren zum Scannen"
      >
        <MdDocumentScanner size={20} />
        <span>OCR</span>
      </button>

      {/* OCR-Auswahl-Rectangle anzeigen - jetzt korrekt positioniert! */}
      {selectedArea && (() => {
        const rect = canvasRect();
        if (!rect) return null;

        const left = Math.min(selectedArea.x, selectedArea.x + selectedArea.width);
        const top = Math.min(selectedArea.y, selectedArea.y + selectedArea.height);
        const width = Math.abs(selectedArea.width);
        const height = Math.abs(selectedArea.height);

        return (
          <div
            className="ocr-selection-rect"
            style={{
              position: 'fixed',
              left: rect.left + left,
              top: rect.top + top,
              width: width,
              height: height,
              border: '2px solid #4f8ef7',
              background: 'rgba(79, 142, 247, 0.1)',
              pointerEvents: 'none',
              zIndex: 10000,
            }}
          />
        );
      })()}

      {isScanning && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: 4,
          padding: '8px 12px',
          marginTop: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          minWidth: 200,
          zIndex: 10000
        }}>
          <div style={{ fontSize: 12, color: '#333', marginBottom: 4 }}>
            {progress < 100 ? 'Lese Text...' : 'Fertig!'}
          </div>
          <div style={{
            height: 4,
            background: '#e0e0e0',
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: '#4f8ef7',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
            {progress}%
          </div>
        </div>
      )}
    </>
  );
}