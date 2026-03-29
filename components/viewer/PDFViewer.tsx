'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { useAppStore } from '@/store/useAppStore';
import { AnnotationCanvas } from '@/components/annotations/AnnotationCanvas';
import { CalibrateDialog } from '@/components/measure/CalibrateDialog';
import type { Point } from '@/types';

interface PDFPageProps {
  pdfDoc: PDFDocumentProxy | null;
  pageNum: number; // logical
  physicalPage: number | string; // original
  zoom: number;
  rotation: number;
  docId: string;
  isActive: boolean;
  activeTool: string;
  fileType: 'pdf' | 'image';
  fileUrl: string;
  onVisibilityChange: (page: number, visible: boolean) => void;
  onCalibrate?: (start: Point, end: Point) => void;
}

function PDFPage({
  pdfDoc, pageNum, physicalPage, zoom, rotation, docId, onVisibilityChange, onCalibrate, activeTool,
  fileType, fileUrl,
}: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTask = useRef<{ cancel: () => void } | null>(null);
  const [dims, setDims] = useState({ width: 0, height: 0, scale: 1 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new IntersectionObserver(
      ([entry]) => onVisibilityChange(pageNum, entry.isIntersecting),
      { threshold: 0.1 }
    );
    obs.observe(container);
    return () => obs.disconnect();
  }, [pageNum, onVisibilityChange]);

  useEffect(() => {
    if (!canvasRef.current) return;
    let cancelled = false;

    const render = async () => {
      const dpr = window.devicePixelRatio || 1;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;

      if (fileType === 'pdf' && pdfDoc) {
        if (typeof physicalPage !== 'number') {
          // Blank page
          const w = 595; // A4 approx
          const h = 842;
          canvas.width = w * zoom * dpr;
          canvas.height = h * zoom * dpr;
          canvas.style.width = `${w * zoom}px`;
          canvas.style.height = `${h * zoom}px`;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          setDims({ width: w * zoom, height: h * zoom, scale: zoom });
          return;
        }

        let page: PDFPageProxy;
        try {
          page = await pdfDoc.getPage(physicalPage);
        } catch { return; }
        if (cancelled) return;

        const viewport = page.getViewport({ scale: zoom * dpr, rotation });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        setDims({ width: viewport.width / dpr, height: viewport.height / dpr, scale: zoom });

        renderTask.current?.cancel();
        const task = page.render({ canvasContext: ctx, viewport });
        renderTask.current = task;
        try {
          await task.promise;
        } catch { /* cancelled */ }
        page.cleanup();
      } else if (fileType === 'image' && fileUrl) {
        const img = new Image();
        img.src = fileUrl;
        try {
          await img.decode();
          if (cancelled) return;

          // Apply rotation logic manually for image
          const is90 = (rotation / 90) % 2 !== 0;
          const w = is90 ? img.height : img.width;
          const h = is90 ? img.width : img.height;

          const scaledW = w * zoom;
          const scaledH = h * zoom;

          canvas.width = scaledW * dpr;
          canvas.height = scaledH * dpr;
          canvas.style.width = `${scaledW}px`;
          canvas.style.height = `${scaledH}px`;

          setDims({ width: scaledW, height: scaledH, scale: zoom });

          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          ctx.save();
          ctx.translate(scaledW / 2, scaledH / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.drawImage(img, -img.width * zoom / 2, -img.height * zoom / 2, img.width * zoom, img.height * zoom);
          ctx.restore();
        } catch (err) {
          console.error("Image load error", err);
        }
      }
    };
    render();
    return () => { cancelled = true; renderTask.current?.cancel(); };
  }, [pdfDoc, pageNum, zoom, rotation, fileType, fileUrl]);

  return (
    <div
      ref={containerRef}
      className="pdf-page-container"
      id={`page-${pageNum}`}
      style={{ cursor: 'inherit', position: 'relative' }}
    >
      {/* cursor: inherit lets's parent .pdf-viewer grab/crosshair flow down */}
      <canvas ref={canvasRef} style={{ cursor: 'inherit', display: 'block', position: 'relative', zIndex: 1 }} />
      {dims.width > 0 && (
        <AnnotationCanvas
          docId={docId}
          page={pageNum}
          width={dims.width}
          height={dims.height}
          pdfScale={dims.scale}
          onCalibrate={onCalibrate}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Viewer
// ─────────────────────────────────────────────
interface PDFViewerProps {
  docId: string;
  onCursorPos: (pos: { x: number; y: number } | null) => void;
}

export function PDFViewer({ docId, onCursorPos }: PDFViewerProps) {
  const { openDocuments, setCurrentPage, setPageCount, setScale, activeTool, setActiveTool } = useAppStore();
  const doc = openDocuments.find((d) => d.id === docId);

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [calibratePending, setCalibratePending] = useState<{
    start: Point; end: Point; pixelDist: number;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isHandPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Helper: the actual scrollable container is PARENT (.canvas-area), not .pdf-viewer itself
  const getScrollEl = () => scrollRef.current?.parentElement ?? null;

  // Load Document
  useEffect(() => {
    if (!doc?.fileUrl) return;
    if (doc.fileType === 'image') {
      setPdfDoc(null);
      setPageCount(docId, 1);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const pdfjsLib = (await import('@/lib/pdfWorker')).default;
        console.log('PDF loading started for:', doc.fileUrl);
        const loaded = await pdfjsLib.getDocument({ url: doc.fileUrl }).promise;
        if (cancelled) return;
        setPdfDoc(loaded);
        setPageCount(docId, loaded.numPages);
      } catch (err) {
        console.error('PDF Load Error:', err);
        if (!cancelled) {
          // Set an error state or show a message
          const msg = err instanceof Error ? err.message : String(err);
          // For now, we'll just log it, but "PDF wird geladen..." will stay if it fails.
        }
      }
    })();

    return () => { cancelled = true; setPdfDoc(null); };
  }, [doc?.fileUrl, doc?.fileType, docId, setPageCount]);

  const handleVisibility = useCallback(
    (page: number, visible: boolean) => {
      if (visible) setCurrentPage(docId, page);
    },
    [docId, setCurrentPage]
  );

  const handleCalibrate = useCallback((start: Point, end: Point) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const pixelDist = Math.sqrt(dx * dx + dy * dy);
    setCalibratePending({ start, end, pixelDist });
  }, []);

  const applyCalibration = (realValue: number, unit: string) => {
    if (!calibratePending) return;
    setScale(docId, {
      pixelsPerUnit: calibratePending.pixelDist / realValue,
      unit,
    });
    setCalibratePending(null);
    setActiveTool('hand');
  };

  // Scroll to active page on change
  useEffect(() => {
    if (!doc || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(`#page-${doc.currentPage}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [doc?.currentPage]);

  // Hand pan behaviour
  const onMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'hand') return;
    e.preventDefault();
    const scrollEl = getScrollEl();
    if (!scrollEl) return;
    isHandPanning.current = true;
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollEl.scrollLeft,
      scrollTop: scrollEl.scrollTop,
    };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (activeTool === 'hand') {
      onCursorPos({ x: e.clientX, y: e.clientY });
    }
    if (!isHandPanning.current) return;
    const scrollEl = getScrollEl();
    if (!scrollEl) return;
    scrollEl.scrollLeft = panStart.current.scrollLeft - (e.clientX - panStart.current.x);
    scrollEl.scrollTop = panStart.current.scrollTop - (e.clientY - panStart.current.y);
  };

  const onMouseUp = () => { isHandPanning.current = false; };
  const onMouseLeave = () => { onCursorPos(null); isHandPanning.current = false; };

  // Ctrl+Scroll zoom (Manual listener to bypass passive restrictions)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey || !doc) return;

      // CRITICAL: Prevent browser zoom
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.1, Math.min(10, doc.zoom + delta));

      if (newZoom !== doc.zoom) {
        useAppStore.getState().setZoom(docId, newZoom);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [docId, doc?.zoom]);

  if (!doc) return null;

  const cursorStyle =
    activeTool === 'hand' ? (isHandPanning.current ? 'grabbing' : 'grab')
      : activeTool === 'cursor' ? 'default'
        : activeTool === 'direct-edit' ? 'cell'
          : 'default';

  return (
    <>
      <div
        ref={scrollRef}
        className="pdf-viewer"
        style={{
          cursor: cursorStyle,
          // userSelect: 'none' removed to allow HTML overlay selection
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        {/* Edit mode indicator banner */}
        {activeTool === 'direct-edit' && (
          <div style={{
            position: 'sticky', top: 8, zIndex: 10,
            display: 'flex', justifyContent: 'center', pointerEvents: 'none',
          }}>
            <span style={{
              background: 'rgba(79,142,247,0.18)', border: '1px solid #4f8ef7',
              borderRadius: 6, padding: '4px 14px', fontSize: 12,
              color: '#4f8ef7', backdropFilter: 'blur(4px)',
            }}>
              ✏️ Direkt-Edit — Wählen Sie vorhandene Notizen oder Markierungen aus, um sie zu bearbeiten
            </span>
          </div>
        )}
        {pdfDoc || doc.fileType === 'image' ? (
          (doc.pageOrder || []).map((physicalPage, idx) => {
            const logicalPageNum = idx + 1;
            return (
              <PDFPage
                key={`${docId}-${logicalPageNum}-${physicalPage}`}
                pdfDoc={pdfDoc}
                pageNum={logicalPageNum}
                physicalPage={physicalPage}
                zoom={doc.zoom}
                rotation={doc.rotation}
                docId={docId}
                isActive={doc.currentPage === logicalPageNum}
                onVisibilityChange={handleVisibility}
                onCalibrate={handleCalibrate}
                activeTool={activeTool}
                fileType={doc.fileType}
                fileUrl={doc.fileUrl}
              />
            );
          })
        ) : (
          <div style={{ color: 'var(--text-muted)', marginTop: 60 }}>
            PDF wird geladen...
          </div>
        )}
      </div>

      {calibratePending && (
        <CalibrateDialog
          linePixelLength={calibratePending.pixelDist}
          onConfirm={applyCalibration}
          onCancel={() => setCalibratePending(null)}
        />
      )}
    </>
  );
}