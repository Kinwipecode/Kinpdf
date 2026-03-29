'use client';
import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useAppStore } from '@/store/useAppStore';

interface ThumbnailPanelProps {
  pdfDoc: PDFDocumentProxy | null;
  activeDocId: string | null;
}

export function ThumbnailPanel({ pdfDoc, activeDocId }: ThumbnailPanelProps) {
  const { openDocuments, setCurrentPage } = useAppStore();
  const doc = openDocuments.find((d) => d.id === activeDocId);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const renderingRef = useRef(false);

  useEffect(() => {
    if (!pdfDoc || renderingRef.current) return;
    renderingRef.current = true;
    setThumbs([]);

    const generate = async () => {
      const urls: string[] = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        try {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 0.18 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport }).promise;
          urls.push(canvas.toDataURL('image/jpeg', 0.7));
          // update incrementally
          setThumbs((prev) => [...prev, canvas.toDataURL('image/jpeg', 0.7)]);
          page.cleanup();
        } catch {
          urls.push('');
          setThumbs((prev) => [...prev, '']);
        }
      }
      renderingRef.current = false;
    };
    generate();
  }, [pdfDoc]);

  if (!doc) {
    return (
      <div className="thumbnail-panel">
        <div className="sidebar-header">
          <span>Miniaturansichten</span>
        </div>
        <div className="sidebar-content">
          <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
            Kein Dokument geöffnet
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="thumbnail-panel">
      <div className="thumbnail-panel-header">Pages ({doc.pageCount})</div>
      <div className="thumbnail-list">
        {(doc.pageOrder || []).map((physicalPage, idx) => {
          const logicalPageNum = idx + 1;
          const isBlank = typeof physicalPage !== 'number';
          return (
            <div
              key={`${logicalPageNum}-${physicalPage}`}
              className={`thumbnail-item ${doc.currentPage === logicalPageNum ? 'active' : ''}`}
              onClick={() => setCurrentPage(doc.id, logicalPageNum)}
            >
              <div className="thumbnail-canvas-wrapper">
                {!isBlank && thumbs[(physicalPage as number) - 1] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbs[(physicalPage as number) - 1]}
                    alt={`Page ${logicalPageNum}`}
                    style={{ width: '100%', display: 'block' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '0.707',
                      background: isBlank ? '#fff' : '#f0f0f0',
                      border: isBlank ? '1px solid #ddd' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999',
                      fontSize: 11,
                    }}
                  >
                    {isBlank ? 'Blank' : logicalPageNum}
                  </div>
                )}
              </div>
              <span className="thumbnail-label">{logicalPageNum} {isBlank ? '(Neu)' : ''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
