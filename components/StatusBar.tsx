'use client';
import { useAppStore } from '@/store/useAppStore';

interface StatusBarProps {
  activeDocId: string | null;
  cursorPos: { x: number; y: number } | null;
}

export function StatusBar({ activeDocId, cursorPos }: StatusBarProps) {
  const { openDocuments, setZoom, activeTool } = useAppStore();
  const doc = openDocuments.find((d) => d.id === activeDocId);

  // const zoomPct = doc ? Math.round(doc.zoom * 100) : 100; // This line is no longer needed in its original form

  const adjustZoom = (delta: number) => {
    if (!doc) return;
    const newZoom = Math.max(0.1, Math.min(5, doc.zoom + delta));
    setZoom(doc.id, newZoom);
  };

  return (
    <div className="status-bar">
      {doc && (
        <div className="status-item">
          <span>Seite {doc.currentPage} von {doc.pageCount || '?'}</span>
        </div>
      )}

      {doc && (
        <div className="status-item" style={{ flex: 1, justifyContent: 'center', gap: 12 }}>
          <button className="status-zoom-btn" onClick={() => adjustZoom(-0.1)}>-</button>
          <div className="zoom-slider-container">
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={doc.zoom}
              onChange={(e) => setZoom(doc.id, parseFloat(e.target.value))}
            />
          </div>
          <button className="status-zoom-btn" onClick={() => adjustZoom(0.1)}>+</button>
          <span style={{ minWidth: 40, textAlign: 'right' }}>{Math.round(doc.zoom * 100)}%</span>
        </div>
      )}

      <div className="status-item">
        <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>Werkzeug:</span>
        <span style={{ fontWeight: 500, color: '#4f8ef7' }}>{translateTool(activeTool)}</span>
      </div>

      <div className="status-item" style={{ minWidth: 120 }}>
        {cursorPos ? (
          <span>{Math.round(cursorPos.x)}, {Math.round(cursorPos.y)} px</span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </div>
      {doc && (
        <>
          <div className="sep" />
          <span style={{ color: 'var(--text-muted)' }}>{doc.fileName}</span>
        </>
      )}
    </div>
  );
}

function translateTool(tool: string): string {
  const tools: Record<string, string> = {
    'cursor': 'Auswahl',
    'hand': 'Hand',
    'highlight': 'Hervorheben',
    'freehand': 'Zeichnen',
    'callout': 'Callout',
    'text': 'Text',
    'measure-distance': 'Abstand',
    'measure-area': 'Fläche',
    'measure-calibrate': 'Kalibrieren',
    'direct-edit': 'Direkt-Edit'
  };
  return tools[tool] || tool;
}
